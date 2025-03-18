import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, SafeAreaView } from "react-native"
import { LineChart } from "react-native-chart-kit"
import moment from "moment"
import { doc, collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db, auth } from '../FirebaseConfig'
import { AppContext } from "../AppContext"

const Progress = () => {
  const [userData, setUserData] = useState(null)
  const [dailyPrayerCounts, setDailyPrayerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const {madhab} = useContext(AppContext)
  
  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setLoading(false);
      return;
    }
  
    const userDocRef = doc(db, "users", userId);
    const totalQadhaRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
    const dailyPrayersRef = collection(db, "users", userId, "dailyPrayers");
    const historyQuery = query(dailyPrayersRef, orderBy("__name__", "asc")); // Dates are doc IDs
  
    let fetchedUserData = {}; // Store data before updating state
    let fetchedHistory = {}; // Store prayer history
  
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
          const date = docSnap.id; // Document ID is the date
  
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

  // Generate dates for the last 14 days
  const generateDates = () => {
    const dates = []
    for (let i = 0; i < 14; i++) {
      dates.push(moment().subtract(i, "days").format("YYYY-MM-DD"))
    }
    return dates.reverse()
  }

  const dates = generateDates()

  // Get prayer counts for chart
  const getPrayerCounts = () => {
    return dates.map((date) => {
      const counts = dailyPrayerCounts[date] || { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0 }
      return Object.values(counts).reduce((total, count) => total + count, 0)
    })
  }

  // If still loading
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
    )
  }

  // If there was an error
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
    )
  }

  // If no user data found
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
    )
  }

  const prayerCounts = getPrayerCounts()
  const totalQadhaPrayed = prayerCounts.reduce((sum, count) => sum + count, 0)
  const averageQadhaPerDay = totalQadhaPrayed > 0 ? (totalQadhaPrayed / 14).toFixed(2) : "0.00"
  
  // Get the remaining prayers from user data
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
  
  // Calculate days to finish - handle as strings properly
  let daysToFinish = "∞"; // Default value
  if (parseFloat(averageQadhaPerDay) > 0) {
    const days = Math.ceil(totalRemainingPrayers / parseFloat(averageQadhaPerDay));
    daysToFinish = days.toString();
  }

  // Prepare years string for display
  let yearsToFinish = "";
  if (daysToFinish !== "∞") {
    const years = (parseInt(daysToFinish, 10) / 365).toFixed(2);
    yearsToFinish = `(${years} years)`;
  }

  const screenWidth = Dimensions.get("window").width

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
            <Text style={styles.summaryText}>Total Qadha Prayed: {totalQadhaPrayed}</Text>
            <Text style={styles.summaryText}>Average Qadha per Day: {averageQadhaPerDay}</Text>
            <Text style={styles.summaryText}>Estimated Completion: {daysToFinish} days {yearsToFinish}</Text>
          </View>
          
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Breakdown</Text>
            <Text style={styles.summaryText}>
              Fajr: {fajrCount} | Dhuhr: {dhuhrCount} | Asr: {asrCount}
            </Text>
            <Text style={styles.summaryText}>
              Maghrib: {maghribCount} | Isha: {ishaCount} {madhab === "Hanafi" ? `| Witr: ${witrCount}` : ""}
            </Text>
            <Text style={styles.summaryText}>Total Remaining Qadha: {totalRemainingPrayers}</Text>
          </View>

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
})

export default Progress