/* eslint-disable linebreak-style */
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
// eslint-disable-next-line max-len
exports.sendPrayerNotifications = onSchedule("0,15,30,45 * * * *", async (event) => {
  const db = admin.firestore();
  const usersSnap = await db.collection("users")
      .where("fcmToken", "!=", null)
      .get();

  const notificationPromises = usersSnap.docs.map(async (doc) => {
    const user = doc.data();
    if (!user.latitude || !user.longitude) return null;

    const userTime = moment().tz(user.timezone || "UTC");
    const dateStr = userTime.format("DD-MM-YYYY");

    try {
      const response = await axios.get("https://api.aladhan.com/v1/timings", {
        params: {
          latitude: user.latitude,
          longitude: user.longitude,
          school: user.madhab === "Hanafi" ? 1 : 0,
          date: dateStr,
        },
        timeout: 10000,
      });

      const {timings} = response.data.data;
      const prayerNames = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
      const userNotifications = [];

      for (const prayer of prayerNames) {
        const prayerTime = moment.tz(
            `${userTime.format("YYYY-MM-DD")} ${timings[prayer]}`,
            "YYYY-MM-DD HH:mm",
            user.timezone || "UTC",
        );

        const diff = prayerTime.diff(userTime, "minutes");

        if (diff >= 0 && diff < 15) {
          userNotifications.push(
              admin.messaging().send({
                token: user.fcmToken,
                notification: {
                  title: "iQadha",
                  body: `It is time for ${prayer} (${timings[prayer]})`,
                },
                android: {
                  priority: "high",
                  notification: {channelId: "prayer_times", sound: "default"},
                },
                apns: {payload: {aps: {sound: "default"}}},
              }),
          );
        }
      }
      return Promise.all(userNotifications);
    } catch (err) {
      console.error(`API Error for user ${doc.id}:`, err.message);
      return null;
    }
  });

  await Promise.all(notificationPromises);
  return null;
});
