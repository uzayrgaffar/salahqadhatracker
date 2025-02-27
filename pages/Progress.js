import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator, SafeAreaView } from "react-native"
import { LineChart } from "react-native-chart-kit"
import moment from "moment"
import { useNavigation } from "@react-navigation/native"
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db, auth } from '../FirebaseConfig'

const Progress = () => {
  const navigation = useNavigation()
  const [userData, setUserData] = useState(null)
  const [dailyPrayerCounts, setDailyPrayerCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the current user ID from Firebase Auth
        const userId = auth.currentUser?.uid
        
        if (!userId) {
          throw new Error('No authenticated user found')
        }
        
        // Fetch the user document
        const userDocRef = doc(db, 'users', userId)
        const userDocSnap = await getDoc(userDocRef)
        
        if (!userDocSnap.exists()) {
          throw new Error('User document not found')
        }
        
        setUserData(userDocSnap.data())
        
        // Fetch prayer history from the prayerHistory subcollection
        const dates = generateDates()
        const historyData = {}
        
        const historyCollectionRef = collection(db, 'users', userId, 'prayerHistory')
        const historyQuery = query(
          historyCollectionRef,
          where('date', '>=', dates[0]),
          orderBy('date', 'asc')
        )
        
        const historyQuerySnapshot = await getDocs(historyQuery)
        
        historyQuerySnapshot.forEach(doc => {
          const data = doc.data()
          if (data.date) {
            historyData[data.date] = {
              fajr: data.fajr || 0,
              dhuhr: data.dhuhr || 0,
              asr: data.asr || 0,
              maghrib: data.maghrib || 0,
              isha: data.isha || 0,
              witr: data.witr || 0
            }
          }
        })
        
        setDailyPrayerCounts(historyData)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error.message)
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

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
  
  const totalRemainingPrayers = fajrCount + dhuhrCount + asrCount + maghribCount + ishaCount + witrCount
  
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
                  stroke: "#e0e0e0",
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
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryText}>Total Qadha Prayed: {totalQadhaPrayed}</Text>
            <Text style={styles.summaryText}>Average Qadha per Day: {averageQadhaPerDay}</Text>
            <Text style={styles.summaryText}>
              Estimated Completion: {daysToFinish} days {yearsToFinish}
            </Text>
          </View>
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Breakdown</Text>
            <Text style={styles.summaryText}>
              Fajr: {fajrCount} | Dhuhr: {dhuhrCount} | Asr: {asrCount}
            </Text>
            <Text style={styles.summaryText}>
              Maghrib: {maghribCount} | Isha: {ishaCount} | Witr: {witrCount}
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    borderRadius: 16,
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