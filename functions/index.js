const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

exports.incrementPrayerCounts = onSchedule("0 0 * * *", async (event) => {
  const db = admin.firestore();
  const usersRef = db.collection("users");
  const usersSnapshot = await usersRef.get();

  const batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const userId = userDoc.id;
    // eslint-disable-next-line max-len
    const totalQadhaRef = db.collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");

    const totalQadhaDoc = await totalQadhaRef.get();
    if (totalQadhaDoc.exists) {
      const data = totalQadhaDoc.data();
      batch.update(totalQadhaRef, {
        fajr: (data.fajr || 0) + 1,
        dhuhr: (data.dhuhr || 0) + 1,
        asr: (data.asr || 0) + 1,
        maghrib: (data.maghrib || 0) + 1,
        isha: (data.isha || 0) + 1,
        witr: (data.witr || 0) + 1,
      });
    } else {
      batch.set(totalQadhaRef, {
        fajr: 1,
        dhuhr: 1,
        asr: 1,
        maghrib: 1,
        isha: 1,
        witr: 1,
      });
    }
  }

  await batch.commit();
  return null;
});
