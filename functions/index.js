/* eslint-disable linebreak-style */
/* eslint-disable max-len */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const axios = require("axios");
const moment = require("moment-timezone");
const admin = require("firebase-admin");
const {CloudTasksClient} = require("@google-cloud/tasks");
// @ts-ignore
const whichCountry = require("which-country");

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
// --- COUNTRY → METHOD MAPPING ---
const getMethodByCountry = (countryCode) => {
  switch (countryCode) {
    // 🇸🇦 Saudi Arabia
    case "SA":
      return 4; // Umm Al-Qura

    // 🇵🇰 Pakistan / 🇮🇳 India / 🇧🇩 Bangladesh / 🇦🇫 Afghanistan
    case "PK":
    case "IN":
    case "BD":
    case "AF":
      return 1; // Karachi

    // 🇺🇸 USA / 🇨🇦 Canada
    case "US":
    case "CA":
      return 2; // ISNA

    // 🇬🇧 UK / 🇮🇪 Ireland
    case "GB":
    case "IE":
      return 15; // Moonsighting Committee

    // 🇪🇬 Egypt
    case "EG":
      return 5;

    // 🇹🇷 Turkey
    case "TR":
      return 13;

    // 🇲🇾 Malaysia
    case "MY":
      return 17;

    // 🇮🇩 Indonesia
    case "ID":
      return 20;

    // 🇲🇦 Morocco
    case "MA":
      return 21;

    // 🇯🇴 Jordan
    case "JO":
      return 23;

    // 🇫🇷 France
    case "FR":
      return 12;

    // 🇷🇺 Russia
    case "RU":
      return 14;

    default:
      return 3; // Muslim World League (safe global default)
  }
};

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
        let countryCode = user.countryCode;

        if (!method) {
          if (!countryCode) {
            // which-country expects [lng, lat]
            const isoCode = whichCountry([user.longitude, user.latitude]);
            countryCode = isoCode || "DEFAULT";
          }
          method = getMethodByCountry(countryCode);

          // Update the user doc so we don't have to guess next hour
          await db.collection("users").doc(doc.id).update({
            method: method,
            countryCode: countryCode,
          });
          console.log(`Updated user ${doc.id} with guessed method ${method} for ${countryCode}`);
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
      if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
      }

      console.log("Request body:", JSON.stringify(req.body));
      console.log("Content-Type:", req.headers["content-type"]);
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const {userId, fcmToken, prayer, prayerTime, dateStr} = body;
      if (!userId || !fcmToken || !prayer || !prayerTime || !dateStr) {
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
