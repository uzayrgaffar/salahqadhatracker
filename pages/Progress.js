import { useContext } from "react"
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, SafeAreaView } from "react-native"
import { AppContext } from "../AppContext"
import { LineChart } from "react-native-chart-kit"
import moment from "moment"
import { useNavigation } from "@react-navigation/native"
import { ChevronLeft } from "lucide-react-native"

const Progress = () => {
  const navigation = useNavigation()
  const { dailyPrayerCounts, fajr, dhuhr, asr, maghrib, isha, witr } = useContext(AppContext)

  // Use today's date to extract the values from the prayer objects.
  const today = moment().format("YYYY-MM-DD")
  
  // Helper to extract a value from the context objects.
  const getPrayerValue = (prayerObj) => {
    return typeof prayerObj === "object" ? (prayerObj[today] || 0) : prayerObj
  }
  
  const fajrCount = getPrayerValue(fajr)
  const dhuhrCount = getPrayerValue(dhuhr)
  const asrCount = getPrayerValue(asr)
  const maghribCount = getPrayerValue(maghrib)
  const ishaCount = getPrayerValue(isha)
  const witrCount = getPrayerValue(witr)
  
  // Now totalPrayers is the sum of today's prayer counts.
  const totalPrayers = fajrCount + dhuhrCount + asrCount + maghribCount + ishaCount + witrCount

  // The following code remains the same for generating chart data
  const generateDates = () => {
    const dates = []
    for (let i = 0; i < 14; i++) {
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

  const prayerCounts = getPrayerCounts()
  const totalQadhaPrayed = prayerCounts.reduce((sum, count) => sum + count, 0)
  const averageQadhaPerDay = (totalQadhaPrayed / 14).toFixed(2)
  const daysToFinish = (totalPrayers / (totalQadhaPrayed / 14)).toFixed(0)

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
                    data: prayerCounts,
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
              Estimated Completion: {daysToFinish} days ({(daysToFinish / 365).toFixed(2)} years)
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
            <Text style={styles.summaryText}>Total Remaining Qadha: {totalPrayers}</Text>
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
  backButton: {
    padding: 8,
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
    color: "#666666",
    marginBottom: 8,
  },
})

export default Progress