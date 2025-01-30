import { useContext, useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from "react-native"
import { Calendar } from "react-native-calendars"
import { useNavigation } from "@react-navigation/native"
import { AppContext } from "../AppContext"
import moment from "moment"
import Icon from "react-native-vector-icons/FontAwesome"

const { height } = Dimensions.get("window")

const DailyChart = () => {
  const navigation = useNavigation()
  const {
    fajr,
    setFajr,
    dhuhr,
    setDhuhr,
    asr,
    setAsr,
    maghrib,
    setMaghrib,
    isha,
    setIsha,
    witr,
    setWitr,
    dailyPrayerCounts,
    setDailyPrayerCounts,
    madhab,
  } = useContext(AppContext)
  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const [prayerStates, setPrayerStates] = useState({
    [today]: {
      fajr: false,
      dhuhr: false,
      asr: false,
      maghrib: false,
      isha: false,
      witr: false,
    },
  })
  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({
    [today]: {
      fajr: 0,
      dhuhr: 0,
      asr: 0,
      maghrib: 0,
      isha: 0,
      witr: 0,
    },
  })
  const [isModalVisible, setIsModalVisible] = useState(false)

  const handleDateSelect = (date) => {
    if (moment(date).isSameOrBefore(today)) {
      setSelectedDate(date)
      if (!prayerStates[date]) {
        setPrayerStates((prevStates) => ({
          ...prevStates,
          [date]: {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
            witr: false,
          },
        }))
      }
      if (!ldailyPrayerCounts[date]) {
        lsetDailyPrayerCounts((prevCounts) => ({
          ...prevCounts,
          [date]: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
        }))
      }
    }
  }

  const handlePrayerSelect = (prayer) => {
    const updatedStates = {
      ...prayerStates,
      [selectedDate]: {
        ...prayerStates[selectedDate],
        [prayer]: !prayerStates[selectedDate][prayer],
      },
    }
    setPrayerStates(updatedStates)

    const countAdjust = updatedStates[selectedDate][prayer] ? -1 : 1
    if (prayer === "fajr") setFajr(fajr + countAdjust)
    if (prayer === "dhuhr") setDhuhr(dhuhr + countAdjust)
    if (prayer === "asr") setAsr(asr + countAdjust)
    if (prayer === "maghrib") setMaghrib(maghrib + countAdjust)
    if (prayer === "isha") setIsha(isha + countAdjust)
    if (prayer === "witr") setWitr(witr + countAdjust)
  }

  const adjustCount = (prayer, amount) => {
    lsetDailyPrayerCounts((prevCounts) => {
      const currentCount = prevCounts[selectedDate][prayer]
      if (amount < 0 && currentCount === 0) return prevCounts

      const updatedCount = currentCount + amount
      return {
        ...prevCounts,
        [selectedDate]: {
          ...prevCounts[selectedDate],
          [prayer]: updatedCount,
        },
      }
    })

    const countAdjust = amount < 0 ? -1 : 1
    if (prayer === "fajr") setFajr(fajr - countAdjust)
    if (prayer === "dhuhr") setDhuhr(dhuhr - countAdjust)
    if (prayer === "asr") setAsr(asr - countAdjust)
    if (prayer === "maghrib") setMaghrib(maghrib - countAdjust)
    if (prayer === "isha") setIsha(isha - countAdjust)
    if (prayer === "witr") setWitr(witr - countAdjust)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = moment().format("HH:mm")
      if (currentTime === "00:00") {
        setFajr(fajr + 1)
        setDhuhr(dhuhr + 1)
        setAsr(asr + 1)
        setMaghrib(maghrib + 1)
        setIsha(isha + 1)
        setWitr(witr + 1)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [fajr, dhuhr, asr, maghrib, isha, witr, setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr])

  const getMarkedDates = () => {
    const markedDates = {}
    Object.keys(prayerStates).forEach((date) => {
      const selectedPrayers = prayerStates[date] || {}
      const selectedCount = Object.values(selectedPrayers).filter((value) => value).length
      const color =
        selectedCount === 0
          ? "#FF0000"
          : selectedCount === 1
            ? "#FF3300"
            : selectedCount === 2
              ? "#FF6600"
              : selectedCount === 3
                ? "#FF9900"
                : selectedCount === 4
                  ? "#FFCC00"
                  : selectedCount === 5
                    ? "#CCFF00"
                    : selectedCount === 6
                      ? "#00FF00"
                      : "#00FF00"

      markedDates[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
          },
          text: {
            color: "white",
          },
        },
      }
    })
    return markedDates
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Chart</Text>
      </View>

      <View style={styles.card}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setIsModalVisible(true)}>
          <Text style={styles.dateButtonText}>{moment(selectedDate).format("MMMM D, YYYY")}</Text>
          <Icon name="calendar" size={20} color="#777777" />
        </TouchableOpacity>

        <View style={styles.prayersContainer}>
          {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
            <View key={prayer} style={styles.prayerWrapper}>
              <TouchableOpacity
                style={[styles.prayerButton, prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButton]}
                onPress={() => handlePrayerSelect(prayer)}
              >
                <Text
                  style={[
                    styles.prayerButtonText,
                    prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButtonText,
                  ]}
                >
                  {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                </Text>
                {prayerStates[selectedDate]?.[prayer] && (
                  <View style={styles.counterContainer}>
                    <TouchableOpacity
                      style={styles.counterButton}
                      onPress={() => adjustCount(prayer, -1)}
                      disabled={ldailyPrayerCounts[selectedDate]?.[prayer] === 0}
                    >
                      <Icon
                        name="minus"
                        size={20}
                        color={ldailyPrayerCounts[selectedDate]?.[prayer] === 0 ? "#ccc" : "#FFFFFF"}
                      />
                    </TouchableOpacity>
                    <Text style={styles.counterText}>{ldailyPrayerCounts[selectedDate]?.[prayer]}</Text>
                    <TouchableOpacity style={styles.counterButton} onPress={() => adjustCount(prayer, 1)}>
                      <Icon name="plus" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Calendar
              current={selectedDate}
              onDayPress={(day) => {
                handleDateSelect(day.dateString)
                setIsModalVisible(false)
              }}
              markingType={"custom"}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#b6c1cd",
                selectedDayBackgroundColor: "#5CB390",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#5CB390",
                dayTextColor: "#2d4150",
                textDisabledColor: "#d9e1e8",
                dotColor: "#5CB390",
                selectedDotColor: "#ffffff",
                arrowColor: "#5CB390",
                monthTextColor: "#5CB390",
                indicatorColor: "#5CB390",
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "300",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "300",
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5CB390",
    padding: 20,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
    maxHeight: height * 0.7,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  dateButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
  },
  prayersContainer: {
    flexGrow: 0,
  },
  prayerWrapper: {
    marginBottom: 12,
  },
  prayerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
  },
  selectedPrayerButton: {
    backgroundColor: "#4BD4A2",
  },
  prayerButtonText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedPrayerButtonText: {
    color: "#FFFFFF",
  },
  counterContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  counterButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 12,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 12,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  closeButton: {
    backgroundColor: "#FBC742",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    alignSelf: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
})

export default DailyChart