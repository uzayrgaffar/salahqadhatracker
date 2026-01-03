import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, TouchableOpacity } from "react-native"
import { LineChart } from "react-native-chart-kit"
import moment from "moment"
import auth from '@react-native-firebase/auth'
import firestore from '@react-native-firebase/firestore'
import { AppContext } from "../AppContext"
import { useNavigation } from "@react-navigation/native"

const Progress = () => {
  const navigation = useNavigation()

  const [userData, setUserData] = useState(null)
  const [dailyPrayerCounts, setDailyPrayerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { madhab } = useContext(AppContext)
  const [selectedRange, setSelectedRange] = useState(14)

  useEffect(() => {
    const userId = auth().currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
  
    const userDocRef = firestore().collection("users").doc(userId);
    const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
    const dailyPrayersRef = firestore().collection("users").doc(userId).collection("dailyPrayers");
    const historyQuery = dailyPrayersRef.orderBy(firestore.FieldPath.documentId(), "asc");
  
    let fetchedUserData = {};
    let fetchedHistory = {};
  
    const unsubscribeUser = userDocRef.onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          fetchedUserData = { ...fetchedUserData, ...docSnap.data() };
          setUserData(fetchedUserData);
        }
      },
      (error) => {
        console.error("Error fetching user data:", error);
        setError(error.message);
      }
    );
  
    const unsubscribeQadha = totalQadhaRef.onSnapshot(
      (docSnap) => {
        if (docSnap.exists) {
          fetchedUserData = { ...fetchedUserData, ...docSnap.data() };
          setUserData(fetchedUserData);
        }
      },
      (error) => {
        console.error("Error fetching Qadha data:", error);
        setError(error.message);
      }
    );
  
    const unsubscribeHistory = historyQuery.onSnapshot(
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
            witr: data.counts?.witr || 0
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
    const dates = []
    for (let i = 0; i < selectedRange; i++) {
      dates.push(moment().subtract(i, "days").format("YYYY-MM-DD"))
    }
    return dates.reverse()
  }

  const dates = generateDates()

  const getPrayerCounts = () => {
    return dates.map((date) => {
      const counts = dailyPrayerCounts[date] || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 }
      return Object.values(counts).reduce((total, count) => total + count, 0)
    })
  }

  if (loading) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <ActivityIndicator size="large" color="#5CB390" />
            <Text style={styles.loadingText}>Loading data...</Text>
          </View>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <Text style={styles.errorText}>Unable to load data</Text>
            <Text style={styles.errorSubtext}>Please try again later</Text>
          </View>
        </View>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Progress</Text>
          </View>
          <View style={[styles.content, styles.centerContent]}>
            <Text style={styles.errorText}>No user data found</Text>
            <Text style={styles.errorSubtext}>Please complete your profile setup</Text>
          </View>
        </View>
      </View>
    )
  }

  const prayerCounts = getPrayerCounts()
  const totalQadhaPrayed = prayerCounts.reduce((sum, count) => sum + count, 0)
  const averageQadhaPerDay = totalQadhaPrayed > 0 ? (totalQadhaPrayed / selectedRange).toFixed(2) : "0.00"

  const fajrCount = userData.fajr || 0
  const dhuhrCount = userData.dhuhr || 0
  const asrCount = userData.asr || 0
  const maghribCount = userData.maghrib || 0
  const ishaCount = userData.isha || 0
  const witrCount = userData.witr || 0
  
  let totalRemainingPrayers = fajrCount + dhuhrCount + asrCount + maghribCount + ishaCount
  if (madhab === "Hanafi") {
    totalRemainingPrayers += witrCount
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
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress</Text>
        </View>
        <ScrollView style={styles.content}>
          <View style={styles.rangeSelector}>
            <TouchableOpacity
              style={[styles.rangeButton, selectedRange === 7 && styles.rangeButtonActive]}
              onPress={() => setSelectedRange(7)}
            >
              <Text style={[styles.rangeButtonText, selectedRange === 7 && styles.rangeButtonTextActive]}>7d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangeButton, selectedRange === 14 && styles.rangeButtonActive]}
              onPress={() => setSelectedRange(14)}
            >
              <Text style={[styles.rangeButtonText, selectedRange === 14 && styles.rangeButtonTextActive]}>14d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangeButton, selectedRange === 30 && styles.rangeButtonActive]}
              onPress={() => setSelectedRange(30)}
            >
              <Text style={[styles.rangeButtonText, selectedRange === 30 && styles.rangeButtonTextActive]}>30d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangeButton, selectedRange === 60 && styles.rangeButtonActive]}
              onPress={() => setSelectedRange(60)}
            >
              <Text style={[styles.rangeButtonText, selectedRange === 60 && styles.rangeButtonTextActive]}>60d</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rangeButton, selectedRange === 90 && styles.rangeButtonActive]}
              onPress={() => setSelectedRange(90)}
            >
              <Text style={[styles.rangeButtonText, selectedRange === 90 && styles.rangeButtonTextActive]}>90d</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Qadha Prayers (Last {selectedRange} Days)</Text>
            <LineChart
              data={{
                labels: dates.map((date, index) => {
                  const labelInterval = selectedRange <= 7 ? 1 : selectedRange <= 14 ? 2 : selectedRange <= 30 ? 5 : selectedRange <= 60 ? 10 : 15;
                  if (index % labelInterval === 0) {
                    const currentMonth = moment().month();
                    const dateMonth = moment(date).month();
                    return currentMonth !== dateMonth ? moment(date).format("DD MMM") : moment(date).format("DD");   
                  }
                  return "";
                }),
                datasets: [{
                  data: prayerCounts.length > 0 ? prayerCounts : [0],
                  color: (opacity = 1) => `rgba(75, 212, 162, ${opacity})`,
                  strokeWidth: 2,
                }],
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

          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary (Last {selectedRange} days)</Text>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Qadha Prayed</Text>
              <Text style={styles.summaryValue}>{totalQadhaPrayed}</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Average Qadha per Day</Text>
              <Text style={styles.summaryValue}>{averageQadhaPerDay}</Text>
            </View>

            <View style={[styles.summaryItem, { borderBottomWidth: 0 }]}>
              <Text style={styles.summaryLabel}>Estimated Completion</Text>
              <Text style={styles.summaryValue}>
                {totalRemainingPrayers === 0
                  ? "All caught up!"
                  : `${daysToFinish} days ${yearsToFinish}`}
              </Text>
            </View>
          </View>

          <View style={styles.breakdownCard}>
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Remaining Qadha</Text>
              <TouchableOpacity
                style={styles.adjustButton}
                onPress={() => {
                  navigation.navigate("Totals")
                }}
              >
                <Text style={styles.adjustButtonText}>Adjust</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.prayerGrid}>
              <View style={styles.prayerItem}>
                <Text style={styles.prayerLabel}>Fajr</Text>
                <Text style={styles.prayerCount}>{fajrCount}</Text>
              </View>
              <View style={styles.prayerItem}>
                <Text style={styles.prayerLabel}>Dhuhr</Text>
                <Text style={styles.prayerCount}>{dhuhrCount}</Text>
              </View>
              <View style={styles.prayerItem}>
                <Text style={styles.prayerLabel}>Asr</Text>
                <Text style={styles.prayerCount}>{asrCount}</Text>
              </View>
              <View style={styles.prayerItem}>
                <Text style={styles.prayerLabel}>Maghrib</Text>
                <Text style={styles.prayerCount}>{maghribCount}</Text>
              </View>
              <View style={styles.prayerItem}>
                <Text style={styles.prayerLabel}>Isha</Text>
                <Text style={styles.prayerCount}>{ishaCount}</Text>
              </View>
              {madhab === "Hanafi" && (
                <View style={styles.prayerItem}>
                  <Text style={styles.prayerLabel}>Witr</Text>
                  <Text style={styles.prayerCount}>{witrCount}</Text>
                </View>
              )}
            </View>

            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Remaining</Text>
              <Text style={styles.totalCount}>{totalRemainingPrayers}</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666666",
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF6B6B",
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: "#666666",
  },
  rangeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 8,
  },
  rangeButton: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  rangeButtonActive: {
    backgroundColor: "#4BD4A2",
  },
  rangeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#777777",
  },
  rangeButtonTextActive: {
    color: "#FFFFFF",
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
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#777777",
    fontWeight: "500",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#5CB390",
    fontWeight: "600",
    textAlign: "center",
    flex: 1,
  },
  breakdownCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  breakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
  },
  adjustButton: {
    backgroundColor: "#2F7F6F",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  adjustButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  prayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    gap: 12,
  },
  prayerItem: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  prayerLabel: {
    fontSize: 12,
    color: "#777777",
    marginBottom: 4,
    fontWeight: "500",
  },
  prayerCount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#5CB390",
  },
  totalContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  totalCount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#5CB390",
  },
})

export default Progress