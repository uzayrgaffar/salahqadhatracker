/* eslint-disable linebreak-style */
/* eslint-disable max-len */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const axios = require("axios");
const moment = require("moment-timezone");
const admin = require("firebase-admin");
const {CloudTasksClient} = require("@google-cloud/tasks");

admin.initializeApp();

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const PROJECT_ID = "iqadha-11db4";
const LOCATION = "us-central1";
const QUEUE = "prayer-notifications";
const SERVICE_ACCOUNT = "firebase-adminsdk-fbsvc@iqadha-11db4.iam.gserviceaccount.com";
const HANDLER_URL = `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/sendPrayerNotification`;
// ───────────────────────────────────────────────────────────────────────────────


// --- 1. DAILY QADHA INCREMENTER ---
exports.incrementPrayerCounts = onSchedule("0 0 * * *", async (event) => {
  const db = admin.firestore();
  const usersSnapshot = await db.collection("users").get();
  const increment = admin.firestore.FieldValue.increment(1);

  const promises = usersSnapshot.docs.map((userDoc) => {
    const userData = userDoc.data();
    const totalQadhaRef = db.collection("users")
        .doc(userDoc.id)
        .collection("totalQadha")
        .doc("qadhaSummary");

    const updateData = {
      fajr: increment,
      dhuhr: increment,
      asr: increment,
      maghrib: increment,
      isha: increment,
    };

    if (userData.madhab === "Hanafi") {
      updateData.witr = increment;
    }

    return totalQadhaRef.set(updateData, {merge: true});
  });

  await Promise.all(promises);
  console.log(`Successfully incremented Qadha for ${promises.length} users.`);
});


// --- 2. PRAYER CALENDAR CACHE HELPER ---
const calendarCache = new Map();

const getMonthCalendar = async (db, roundedLat, roundedLng, month, year, madhab, method) => {
  const calendarId = `${roundedLat}_${roundedLng}_${month}_${year}_${madhab}_${method}`;

  if (calendarCache.has(calendarId)) {
    return calendarCache.get(calendarId);
  }

  const calendarRef = db.collection("prayerCalendars").doc(calendarId);
  const calendarDoc = await calendarRef.get();

  if (calendarDoc.exists) {
    const monthData = calendarDoc.data().days;
    calendarCache.set(calendarId, monthData);
    return monthData;
  }

  console.log(`Fetching API for region: ${calendarId}`);
  const params = {
    latitude: roundedLat,
    longitude: roundedLng,
    school: madhab,
    method,
    month,
    year,
  };

  // Moonsighting Committee requires shafaq
  if (method === 15) {
    params.shafaq = "general";
  }

  const response = await axios.get("https://api.aladhan.com/v1/calendar", {
    params,
    timeout: 5000,
  });

  const monthData = response.data.data.map((dayData) => ({
    timings: {
      Fajr: dayData.timings.Fajr,
      Sunrise: dayData.timings.Sunrise,
      Dhuhr: dayData.timings.Dhuhr,
      Asr: dayData.timings.Asr,
      Maghrib: dayData.timings.Maghrib,
      Isha: dayData.timings.Isha,
    },
  }));

  await calendarRef.set({
    latitude: roundedLat,
    longitude: roundedLng,
    days: monthData,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    deleteAt: moment().add(3, "months").toDate(),
  });

  calendarCache.set(calendarId, monthData);
  return monthData;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


// --- 3. SCHEDULE DAILY PRAYER TASKS ---
// Runs every hour. Checks all users and schedules any remaining future prayers for their current day.
// Uses deterministic task names to prevent duplicate scheduling.
exports.scheduleDailyPrayerTasks = onSchedule(
    {
      schedule: "0 * * * *",
      maxInstances: 1,
      timeoutSeconds: 540,
      memory: "1GiB",
    },
    async () => {
      const db = admin.firestore();
      const client = new CloudTasksClient();
      const parent = client.queuePath(PROJECT_ID, LOCATION, QUEUE);

      calendarCache.clear();

      const usersSnap = await db.collection("users")
          .where("fcmToken", "!=", null)
          .get();

      console.log(`Checking prayer schedules for ${usersSnap.size} users...`);

      const processUser = async (doc) => {
        const user = doc.data();

        // 1. Basic Validation
        if (!user.latitude || !user.longitude || !user.fcmToken) return;

        const timezone = user.timezone || "UTC";
        const userNow = moment().tz(timezone);

        const day = parseInt(userNow.format("DD"));
        const month = userNow.month() + 1;
        const year = userNow.year();

        // 2. Formatting for Calendar Lookup
        const roundedLat = user.latitude.toFixed(1);
        const roundedLng = user.longitude.toFixed(1);
        const madhab = user.madhab === "Hanafi" ? 1 : 0;

        // 3. Method Logic:
        // We prioritize a stored 'method'. If it doesn't exist, we find it via countryCode.
        // If countryCode doesn't exist, we use whichCountry to guess it.
        let method = user.method;

        if (!method) {
          console.log(`User ${doc.id} missing method. Using default method 3.`);
          method = 3;
        }

        // 4. Fetch/Cache Calendar
        let monthData;
        try {
          monthData = await getMonthCalendar(db, roundedLat, roundedLng, month, year, madhab, method);
        } catch (err) {
          console.error(`Failed to get calendar for user ${doc.id}:`, err.message);
          return;
        }

        // 5. Schedule Prayers
        // monthData is 0-indexed, so we use day - 1
        const dayTimings = monthData[day - 1].timings;
        if (!dayTimings) {
          console.error(`No timings found for day ${day} for user ${doc.id}`);
          return;
        }

        const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        for (const prayer of prayers) {
          const cleanTime = dayTimings[prayer].split(" ")[0]; // Remove extra text like "(BST)"
          const prayerMoment = moment.tz(
              `${userNow.format("YYYY-MM-DD")} ${cleanTime}`,
              "YYYY-MM-DD HH:mm",
              timezone,
          );

          // Only schedule if the prayer time is in the future (plus 1 min grace)
          if (prayerMoment.isBefore(userNow.clone().add(1, "minutes"))) continue;

          // 6. Create Task with Deterministic ID to prevent duplicates
          const taskId = `${doc.id}-${userNow.format("YYYYMMDD")}-${prayer}`;
          const taskName = client.taskPath(PROJECT_ID, LOCATION, QUEUE, taskId);

          const task = {
            name: taskName,
            httpRequest: {
              httpMethod: "POST",
              url: HANDLER_URL,
              headers: {"Content-Type": "application/json"},
              body: Buffer.from(
                  JSON.stringify({
                    userId: doc.id,
                    fcmToken: user.fcmToken,
                    prayer,
                    prayerTime: cleanTime,
                    timezone,
                    dateStr: userNow.format("DD-MM-YYYY"),
                  }),
              ).toString("base64"),
              oidcToken: {
                serviceAccountEmail: SERVICE_ACCOUNT,
              },
            },
            scheduleTime: {
              seconds: Math.floor(prayerMoment.toDate().getTime() / 1000),
            },
          };

          try {
            await client.createTask({parent, task});
          } catch (err) {
            // Error code 6 is "ALREADY_EXISTS" - we expect this on subsequent hourly runs.
            if (err.code !== 6) {
              console.error(`Failed to create task for ${doc.id} ${prayer}:`, err.message);
            }
          }
        }
      };

      for (const doc of usersSnap.docs) {
        await processUser(doc);
        await sleep(150);
      }

      return null;
    },
);


// --- 4. PRAYER NOTIFICATION HANDLER ---
// Called by Cloud Tasks at the exact prayer time for each user.
exports.sendPrayerNotification = onRequest(
    {
      timeoutSeconds: 30,
      memory: "256MiB",
    },
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          return res.status(405).send("Method Not Allowed");
        }

        console.log("Request body:", JSON.stringify(req.body));
        console.log("Content-Type:", req.headers["content-type"]);

        const body =
          typeof req.body === "string" ? JSON.parse(req.body) : req.body;

        const {userId, prayer, prayerTime, dateStr} = body;

        if (!userId || !prayer || !prayerTime || !dateStr) {
          return res.status(400).send("Missing required fields");
        }

        const db = admin.firestore();

        const userRef = db.collection("users").doc(userId);
        const userSnap = await userRef.get();

        if (!userSnap.exists) {
          console.log(`User ${userId} no longer exists. Skipping task.`);
          return res.status(200).send("user deleted");
        }

        const latestToken = userSnap.data().fcmToken;

        if (!latestToken) {
          console.log(`User ${userId} has no valid FCM token.`);
          return res.status(200).send("no token");
        }

        const logId = `${dateStr}-${prayer}`;
        const logRef = userRef
            .collection("notificationLogs")
            .doc(logId);

        const existing = await logRef.get();
        if (existing.exists) {
          console.log(
              `Already sent ${logId} for user ${userId}, skipping`,
          );
          return res.status(200).send("already sent");
        }

        await admin.messaging().send({
          token: latestToken,
          notification: {
            title: "iQadha",
            body: `It is time for ${prayer} (${prayerTime})`,
          },
          android: {
            priority: "high",
            notification: {channelId: "prayer_times", sound: "default"},
          },
          apns: {payload: {aps: {sound: "default"}}},
        });

        await logRef.set({
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          prayerTime,
          deleteAt: moment().add(1, "week").toDate(),
        });

        console.log(
            `Sent ${prayer} notification to user ${userId}`,
        );

        return res.status(200).send("ok");
      } catch (err) {
        if (err.code === "messaging/registration-token-not-registered") {
          try {
            const db = admin.firestore();
            const body =
              typeof req.body === "string" ? JSON.parse(req.body) : req.body;

            await db.collection("users").doc(body.userId).update({
              fcmToken: null,
            });
            console.log(
                `Cleared invalid token for ${body.userId}`,
            );
          } catch (updateErr) {
            console.log(
                `User missing while clearing token. Safe to ignore.`,
            );
          }

          return res.status(200).send("invalid token handled");
        }

        console.error("Unhandled error:", err);
        return res.status(200).send("handled");
      }
    },
);
