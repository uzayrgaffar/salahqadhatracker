const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
admin.initializeApp();

exports.incrementPrayerCounts = onSchedule("0 0 * * *", async (event) => {
  const db = admin.firestore();
  const usersRef = db.collection("users");
  const usersSnapshot = await usersRef.get();
  const increment = admin.firestore.FieldValue.increment(1);

  const promises = [];

  usersSnapshot.forEach((userDoc) => {
    const userId = userDoc.id;
    const userData = userDoc.data();
    const totalQadhaRef = db.collection("users")
        .doc(userId)
        .collection("totalQadha")
        .doc("qadhaSummary");

    // Prepare the update object
    const updateData = {
      fajr: increment,
      dhuhr: increment,
      asr: increment,
      maghrib: increment,
      isha: increment,
    };

    // Only increment Witr if the user is Hanafi
    if (userData.madhab === "Hanafi") {
      updateData.witr = increment;
    }

    // .set with { merge: true } works like an update but creates
    // the document if it doesn't exist yet.
    promises.push(
        totalQadhaRef.set(updateData, {merge: true}),
    );
  });

  // 2. Execute all updates in parallel
  // This can handle thousands of users without the 500-batch limit
  await Promise.all(promises);

  console.log(`Successfully incremented Qadha for ${promises.length} users.`);
  return null;
});
