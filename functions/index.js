/* eslint-disable linebreak-style */
/* eslint-disable max-len */
const {onSchedule} = require("firebase-functions/v2/scheduler");
const axios = require("axios");
const moment = require("moment-timezone");
const admin = require("firebase-admin");

admin.initializeApp();

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


// --- 2. 15-MINUTE ADHAN NOTIFIER (V2) ---
exports.sendPrayerNotifications = onSchedule(
    {
      schedule: "0,15,30,45 * * * *",
      maxInstances: 1, // Keeps it from running twice at the same time
      timeoutSeconds: 540, // Max 9 minutes
    },
    async () => {
      const db = admin.firestore();
      const now = moment();

      // 1. FIX ISSUE 2: Create an In-Memory Cache
      // This stores prayer times for a city during THIS run.
      // If 1,000 users are in London, we only fetch London's calendar ONCE.
      const calendarCache = new Map();

      // 2. FETCH USERS: Ideally, you'd use a cursor to batch these if you have >5k users
      const usersSnap = await db.collection("users")
          .where("fcmToken", "!=", null)
          .get();

      console.log(`Processing ${usersSnap.size} users...`);

      // We use a regular for-of loop to avoid overwhelming the system
      // Helper to chunk an array into groups of N
      const chunk = (arr, size) =>
        Array.from({length: Math.ceil(arr.length / size)}, (_, i) =>
          arr.slice(i * size, i * size + size),
        );

      const processUser = async (doc) => {
        const user = doc.data();
        if (!user.latitude || !user.longitude) return;

        const timezone = user.timezone || "UTC";
        const userTime = now.clone().tz(timezone);
        const day = parseInt(userTime.format("DD"));
        const month = userTime.month() + 1;
        const year = userTime.year();

        const roundedLat = Number(user.latitude).toFixed(2);
        const roundedLng = Number(user.longitude).toFixed(2);
        const madhab = user.madhab === "Hanafi" ? 1 : 0;
        const calendarId = `${roundedLat}_${roundedLng}_${month}_${year}_${madhab}`;

        let monthData;

        if (calendarCache.has(calendarId)) {
          monthData = calendarCache.get(calendarId);
        } else {
          const calendarRef = db.collection("prayerCalendars").doc(calendarId);
          const calendarDoc = await calendarRef.get();

          if (calendarDoc.exists) {
            monthData = calendarDoc.data().days;
            calendarCache.set(calendarId, monthData);
          } else {
            try {
              console.log(`Fetching API for ${calendarId}`);
              const response = await axios.get("https://api.aladhan.com/v1/calendar", {
                params: {latitude: roundedLat, longitude: roundedLng, school: madhab, month, year},
                timeout: 5000,
              });
              monthData = response.data.data;
              const calendarDeleteAt = moment().add(3, "months").toDate();
              await calendarRef.set({
                latitude: roundedLat,
                longitude: roundedLng,
                month,
                year,
                madhab,
                days: monthData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                deleteAt: calendarDeleteAt,
              });
              calendarCache.set(calendarId, monthData);
            } catch (err) {
              console.error(`API Error for ${calendarId}:`, err.message);
              return; // Skip user
            }
          }
        }

        const todayTimings = monthData[day - 1].timings;
        const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

        for (const prayer of prayerNames) {
          const cleanTime = todayTimings[prayer].split(" ")[0];
          const prayerTime = moment.tz(
              `${userTime.format("YYYY-MM-DD")} ${cleanTime}`,
              "YYYY-MM-DD HH:mm",
              timezone,
          );

          const diff = Math.abs(userTime.diff(prayerTime, "minutes"));
          if (diff <= 10) {
            const dateStr = userTime.format("DD-MM-YYYY");
            const logId = `${dateStr}-${prayer}`;
            const logRef = db.collection("users").doc(doc.id)
                .collection("notificationLogs").doc(logId);
            const logSnap = await logRef.get();

            if (!logSnap.exists) {
              try {
                await admin.messaging().send({
                  token: user.fcmToken,
                  notification: {
                    title: "iQadha",
                    body: `It is time for ${prayer} (${cleanTime})`,
                  },
                  android: {
                    priority: "high",
                    notification: {channelId: "prayer_times", sound: "default"},
                  },
                  apns: {payload: {aps: {sound: "default"}}},
                });
                const logDeleteAt = moment().add(2, "weeks").toDate();
                await logRef.set({
                  sentAt: admin.firestore.FieldValue.serverTimestamp(),
                  prayerTime: cleanTime,
                  deleteAt: logDeleteAt,
                });
              } catch (err) {
                if (err.code === "messaging/registration-token-not-registered") {
                  await db.collection("users").doc(doc.id).update({fcmToken: null});
                  console.log(`Cleared stale token for user ${doc.id}`);
                } else {
                  console.error(`FCM error for user ${doc.id}:`, err.message);
                }
              }
            }
          }
        }
      };

      // Process users in batches of 50 concurrently
      const batches = chunk(usersSnap.docs, 50);
      for (const batch of batches) {
        await Promise.all(batch.map(processUser));
      }
      return null;
    },
);
