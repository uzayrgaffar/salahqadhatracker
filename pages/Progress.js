import { useState, useEffect, useContext } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, SafeAreaView, TouchableOpacity, TextInput, Modal } from "react-native";
import { LineChart } from "react-native-chart-kit";
import moment from "moment";
import { doc, collection, query, orderBy, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../FirebaseConfig";
import { AppContext } from "../AppContext";
import { useNavigation } from "@react-navigation/native";

const Progress = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [dailyPrayerCounts, setDailyPrayerCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { madhab } = useContext(AppContext);
  const [editingTarget, setEditingTarget] = useState(false);
  const [newTarget, setNewTarget] = useState("");

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", userId);
    const totalQadhaRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
    const dailyPrayersRef = collection(db, "users", userId, "dailyPrayers");
    const historyQuery = query(dailyPrayersRef, orderBy("__name__", "asc"));

    let fetchedUserData = {};
    let fetchedHistory = {};

    const unsubscribeUser = onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          fetchedUserData = { ...fetchedUserData, ...docSnap.data() };
          setUserData(fetchedUserData);
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setError(error.message);
      }
    );

    const unsubscribeQadha = onSnapshot(
      totalQadhaRef,
      (docSnap) => {
        if (docSnap.exists()) {
          fetchedUserData = { ...fetchedUserData, ...docSnap.data() };
          setUserData(fetchedUserData);
        }
      },
      (error) => {
        console.error("Error fetching Qadha data:", error);
        setError(error.message);
      }
    );

    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (querySnapshot) => {
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const date = docSnap.id;

          fetchedHistory[date] = {
            fajr: data.counts?.fajr || 0,
            dhuhr: data.counts?.dhuhr || 0,
            asr: data.counts?.asr || 0,
            maghrib: data.counts?.maghrib || 0,
            isha: data.counts?.isha || 0,
            witr: data.counts?.witr || 0,
          };
        });

        setDailyPrayerCounts(fetchedHistory);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching daily prayers:", error);
        setError(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeUser();
      unsubscribeQadha();
      unsubscribeHistory();
    };
  }, []);

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      dates.push(moment().subtract(i, "days").format("YYYY-MM-DD"));
    }
    return dates.reverse();
  };

  const dates = generateDates();

  const getPrayerCounts = () => {
    return dates.map((date) => {
      const counts = dailyPrayerCounts[date] || {
        fajr: 0,
        dhuhr: 0,
        asr: 0,
        maghrib: 0,
        isha: 0,
        witr: 0,
      };
      return Object.values(counts).reduce((total, count) => total + count, 0);
    });
  };

  const handleSaveTarget = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const target = parseInt(newTarget, 10);
    if (isNaN(target) || target <= 0) {
      alert("Please enter a valid number of days");
      return;
    }

    try {
      await updateDoc(doc(db, "users", userId), {
        targetDays: target,
      });
      setEditingTarget(false);
      setNewTarget("");
    } catch (error) {
      console.error("Error updating target: ", error);
      alert("Failed to update target");
    }
  };

  const renderTargetStatus = () => {
    if (!userData?.targetDays || totalRemainingPrayers === 0) return null;

    const requiredDaily = totalRemainingPrayers / userData.targetDays;
    const currentAverage = parseFloat(averageQadhaPerDay);
    const difference = requiredDaily - currentAverage;

    if (difference <= 0) {
      return (
        <Text style={[styles.summaryText, styles.successText]}>
          On track to meet your {userData.targetDays}-day target! 🎉
        </Text>
      );
    }

    return (
      <Text style={[styles.summaryText, styles.warningText]}>
        To meet your {userData.targetDays}-day target, you need to pray{" "}
        {difference.toFixed(2)} more daily
      </Text>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <ActivityIndicator size="large" color="#5CB390" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <Text style={styles.errorText}>Unable to load data</Text>
            <Text style={styles.errorSubtext}>Please try again later</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <Text style={styles.errorText}>No user data found</Text>
            <Text style={styles.errorSubtext}>Please complete your profile setup</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const prayerCounts = getPrayerCounts();
  const totalQadhaPrayed = prayerCounts.reduce((sum, count) => sum + count, 0);
  const averageQadhaPerDay =
    totalQadhaPrayed > 0 ? (totalQadhaPrayed / 14).toFixed(2) : "0.00";

  const fajrCount = userData.fajr || 0;
  const dhuhrCount = userData.dhuhr || 0;
  const asrCount = userData.asr || 0;
  const maghribCount = userData.maghrib || 0;
  const ishaCount = userData.isha || 0;
  const witrCount = userData.witr || 0;

  let totalRemainingPrayers = fajrCount + dhuhrCount + asrCount + maghribCount + ishaCount;
  if (madhab === "Hanafi") {
    totalRemainingPrayers += witrCount;
  }

  let daysToFinish = "∞";
  if (parseFloat(averageQadhaPerDay) > 0) {
    const days = Math.ceil(totalRemainingPrayers / parseFloat(averageQadhaPerDay));
    daysToFinish = days.toString();
  }

  let yearsToFinish = "";
  if (daysToFinish !== "∞") {
    const years = (parseInt(daysToFinish, 10) / 365).toFixed(2);
    yearsToFinish = `(${years} years)`;
  }

  const screenWidth = Dimensions.get("window").width

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Modal visible={editingTarget} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Set Completion Target</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter target in days"
                keyboardType="numeric"
                value={newTarget}
                onChangeText={setNewTarget}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setEditingTarget(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveTarget}
                >
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Qadha Prayers (Last 14 Days)</Text>
            <LineChart
              data={{
                labels: dates.map((date) => moment(date).format("DD")),
                datasets: [
                  {
                    data: prayerCounts.length > 0 ? prayerCounts : [0],
                    color: (opacity = 1) => `rgba(75, 212, 162, ${opacity})`,
                    strokeWidth: 2,
                  },
                ],
              }}
              width={screenWidth - 40}
              height={220}
              yAxisSuffix=""
              yAxisInterval={1}
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(75, 212, 162, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: "4",
                  strokeWidth: "2",
                  stroke: "#5CB390",
                },
                propsForBackgroundLines: {
                  strokeDasharray: "",
                },
                propsForHorizontalLabels: {
                  fontSize: 10,
                },
                propsForVerticalLabels: {
                  fontSize: 10,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary (Last 14 days)</Text>
            <Text style={styles.summaryText}>
              {totalRemainingPrayers === 0 ? "MashaAllah! You are all caught up with your Qadha salah! 🎉" : `Estimated Completion: ${daysToFinish} days ${yearsToFinish}`}
            </Text>
            <Text style={styles.summaryText}>
              Average Qadha per Day: {averageQadhaPerDay}
            </Text>
            <Text style={styles.summaryText}>
              {totalRemainingPrayers === 0
                ? "MashaAllah! You are all caught up with your Qadha salah! 🎉"
                : `Estimated Completion: ${daysToFinish} days ${yearsToFinish}`}
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Breakdown</Text>
            <Text style={styles.summaryText}>
              Fajr: {fajrCount} | Dhuhr: {dhuhrCount} | Asr: {asrCount}
            </Text>
            <Text style={styles.summaryText}>
              Maghrib: {maghribCount} | Isha: {ishaCount}{" "}
              {madhab === "Hanafi" ? `| Witr: ${witrCount}` : ""}
            </Text>
            <Text style={styles.summaryText}>
              Total Remaining Qadha: {totalRemainingPrayers}
            </Text>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.targetHeader}>
              <Text style={styles.summaryTitle}>Completion Target</Text>
              <TouchableOpacity
                onPress={() => setEditingTarget(true)}
                style={styles.targetButton}
              >
                <Text style={styles.targetButtonText}>
                  {userData?.targetDays ? "Edit" : "Set Target"}
                </Text>
              </TouchableOpacity>
            </View>

            {userData?.targetDays && (
              <Text style={styles.summaryText}>
                Current Target: {userData.targetDays} days
              </Text>
            )}

            {renderTargetStatus()}
          </View>

          <TouchableOpacity style={styles.totalQadhaButton} onPress={() => {navigation.navigate('Totals')}} >
            <Text style={styles.totalQadhaButtonText}>Adjust Total Qadha</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5CB390",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666666',
  },
  chartContainer: {
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingBottom: 16,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
  },
  summaryContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  totalQadhaButton: {
    backgroundColor: "#FBC742",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 80,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  totalQadhaButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  targetButton: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  targetButtonText: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 16,
    width: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#CCCCCC",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
  },
  saveButton: {
    backgroundColor: "#5CB390",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  successText: {
    color: "#2E7D32",
    marginTop: 8,
  },
  warningText: {
    color: "#D32F2F",
    marginTop: 8,
  },
});

export default Progress;