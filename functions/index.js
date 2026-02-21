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

const getMonthCalendar = async (db, roundedLat, roundedLng, month, year, madhab) => {
  const calendarId = `${roundedLat}_${roundedLng}_${month}_${year}_${madhab}`;

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
  const response = await axios.get("https://api.aladhan.com/v1/calendar", {
    params: {latitude: roundedLat, longitude: roundedLng, school: madhab, month, year},
    timeout: 5000,
  });

  const monthData = response.data.data.map((dayData) => ({
    timings: {
      Fajr: dayData.timings.Fajr,
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

const chunk = (arr, size) =>
  Array.from({length: Math.ceil(arr.length / size)}, (_, i) =>
    arr.slice(i * size, i * size + size),
  );


// --- 3. SCHEDULE DAILY PRAYER TASKS ---
// Runs every hour. For each user whose local time is midnight, enqueues
// one Cloud Task per prayer timed to fire at the exact prayer time.
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

      console.log(`Scheduling tasks for ${usersSnap.size} users...`);

      const processUser = async (doc) => {
        const user = doc.data();
        if (!user.latitude || !user.longitude) return;

        const timezone = user.timezone || "UTC";
        const userNow = moment().tz(timezone);

        // Only schedule users whose local time is between 00:00 and 01:00
        if (userNow.hour() > 0) return;

        const day = parseInt(userNow.format("DD"));
        const month = userNow.month() + 1;
        const year = userNow.year();

        const roundedLat = Math.round(user.latitude);
        const roundedLng = Math.round(user.longitude);
        const madhab = user.madhab === "Hanafi" ? 1 : 0;

        let monthData;
        try {
          monthData = await getMonthCalendar(db, roundedLat, roundedLng, month, year, madhab);
        } catch (err) {
          console.error(`Failed to get calendar for user ${doc.id}:`, err.message);
          return;
        }

        const todayTimings = monthData[day - 1].timings;
        const prayers = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        for (const prayer of prayers) {
          const cleanTime = todayTimings[prayer].split(" ")[0];
          const prayerMoment = moment.tz(
              `${userNow.format("YYYY-MM-DD")} ${cleanTime}`,
              "YYYY-MM-DD HH:mm",
              timezone,
          );

          if (prayerMoment.isBefore(moment())) continue;

          const task = {
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
            console.error(`Failed to create task for ${doc.id} ${prayer}:`, err.message);
          }
        }
      };

      const batches = chunk(usersSnap.docs, 50);
      for (const batch of batches) {
        await Promise.all(batch.map(processUser));
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
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      let payload = req.body;
      try {
        // If it’s Base64, decode
        if (typeof payload === "string") {
          payload = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
        }
      } catch (err) {
        console.error("Failed to parse task payload:", err.message);
        res.status(400).send("Invalid JSON");
        return;
      }

      const {userId, fcmToken, prayer, prayerTime, dateStr} = payload;
      if (!userId || !fcmToken || !prayer || !prayerTime) {
        res.status(400).send("Missing required fields");
        return;
      }

      const db = admin.firestore();
      const logId = `${dateStr}-${prayer}`;
      const logRef = db.collection("users").doc(userId)
          .collection("notificationLogs").doc(logId);

      // Dedup check — Cloud Tasks retries on non-200, so this prevents duplicate sends
      try {
        const existing = await logRef.get();
        if (existing.exists) {
          console.log(`Already sent ${logId} for user ${userId}, skipping`);
          res.status(200).send("already sent");
          return;
        }
      } catch (err) {
        console.error(`Failed to check log for ${userId}:`, err.message);
        res.status(500).send("log check failed");
        return;
      }

      try {
        await admin.messaging().send({
          token: fcmToken,
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

        console.log(`Sent ${prayer} notification to user ${userId}`);
        res.status(200).send("ok");
      } catch (err) {
        if (err.code === "messaging/registration-token-not-registered") {
          await db.collection("users").doc(userId).update({fcmToken: null});
          res.status(200).send("invalid token cleared");
        } else {
          console.error(`FCM error for user ${userId}:`, err.message);
          res.status(500).send(err.message);
        }
      }
    },
);
