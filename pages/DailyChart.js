import { useContext, useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native"
import { Calendar } from "react-native-calendars"
import { AppContext } from "../AppContext"
import moment from "moment"
import Icon from "react-native-vector-icons/Ionicons"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const DailyChart = () => {
  const {
    setFajr,
    setDhuhr,
    setAsr,
    setMaghrib,
    setIsha,
    setWitr,
    madhab,
    setMadhab,
  } = useContext(AppContext)
  
  const insets = useSafeAreaInsets()
  const user = auth().currentUser
  const userId = user ? user.uid : null

  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const [prayerStates, setPrayerStates] = useState({})
  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isQadhaModalVisible, setIsQadhaModalVisible] = useState(false)

  useEffect(() => {
    if (userId) {
      const fetchMadhab = async () => {
        const userSnap = await firestore().collection("users").doc(userId).get()
  
        if (userSnap.exists) {
          const userData = userSnap.data()
          if (userData.madhab) {
            setMadhab(userData.madhab)
          }
        }
      }
  
      fetchMadhab()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      const fetchPrayerData = async () => {
        const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
        const docSnap = await dailyPrayerRef.get()

        if (docSnap.exists) {
          const data = docSnap.data()
          setPrayerStates((prevStates) => ({ ...prevStates, [selectedDate]: data.prayers }))
          lsetDailyPrayerCounts((prevCounts) => ({ ...prevCounts, [selectedDate]: data.counts }))
        } else {
          await dailyPrayerRef.set({
            prayers: {
              fajr: false,
              dhuhr: false,
              asr: false,
              maghrib: false,
              isha: false,
              witr: false,
            },
            counts: {
              fajr: 0,
              dhuhr: 0,
              asr: 0,
              maghrib: 0,
              isha: 0,
              witr: 0,
            },
          })
        }
      }
      fetchPrayerData()
    }
  }, [userId, selectedDate])

  useEffect(() => {
    const fetchPrayerCounts = async () => {
      if (userId) {
        const totalQadhaSnap = await firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary").get()
  
        if (totalQadhaSnap.exists) {
          const data = totalQadhaSnap.data()
          setFajr(data.fajr || 0)
          setDhuhr(data.dhuhr || 0)
          setAsr(data.asr || 0)
          setMaghrib(data.maghrib || 0)
          setIsha(data.isha || 0)
          setWitr(data.witr || 0)
        }
      }
    }
  
    fetchPrayerCounts()
  }, [userId])

  useEffect(() => {
    if (userId) {
      const fetchAllPrayerData = async () => {
        const querySnapshot = await firestore().collection("users").doc(userId).collection("dailyPrayers").get()
        const allPrayerStates = {}
        querySnapshot.forEach((doc) => {
          const date = doc.id
          allPrayerStates[date] = doc.data().prayers
        })
        setPrayerStates(allPrayerStates)
      }
      fetchAllPrayerData()
    }
  }, [userId])
  
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
  
  const handlePrayerSelect = async (prayer) => {
    const wasSelected = prayerStates[selectedDate]?.[prayer] || false
    const updatedStates = {
      ...prayerStates,
      [selectedDate]: {
        ...prayerStates[selectedDate],
        [prayer]: !wasSelected,
      },
    }
    setPrayerStates(updatedStates)

    const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
    await dailyPrayerRef.update({
      prayers: updatedStates[selectedDate],
    })

    if (wasSelected) {
      await adjustTotalQadha(prayer, 1)
    } else {
      await adjustTotalQadha(prayer, -1)
    }
  }

  const adjustTotalQadha = async (prayer, amount) => {
    const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary")
    const totalQadhaSnap = await totalQadhaRef.get()

    if (totalQadhaSnap.exists) {
      const totalData = totalQadhaSnap.data()
      const totalQadhaLeft = totalData[prayer] || 0
      const updatedTotal = totalQadhaLeft + amount

      await totalQadhaRef.update({
        [prayer]: updatedTotal < 0 ? 0 : updatedTotal,
      })
    }
  }
  
  const adjustCount = async (prayer, amount) => {
    const currentCount = ldailyPrayerCounts[selectedDate]?.[prayer] || 0
    const newCount = currentCount + amount
  
    if (newCount < 0) return
  
    lsetDailyPrayerCounts((prevCounts) => ({
      ...prevCounts,
      [selectedDate]: {
        ...prevCounts[selectedDate],
        [prayer]: newCount,
      },
    }))
  
    const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
    await dailyPrayerRef.update({
      [`counts.${prayer}`]: newCount,
    })
  
    const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary")
    const totalQadhaSnap = await totalQadhaRef.get()
  
    if (totalQadhaSnap.exists) {
      const totalData = totalQadhaSnap.data()
      const totalQadhaLeft = totalData[prayer] || 0
      const updatedTotal = totalQadhaLeft - amount
  
      if (amount === -1 && totalQadhaLeft === 0) return
  
      await totalQadhaRef.update({
        [prayer]: updatedTotal < 0 ? 0 : updatedTotal,
      })
    }
  }

  const getMarkedDates = () => {
    const markedDates = {}
    Object.keys(prayerStates).forEach((date) => {
      const selectedPrayers = prayerStates[date] || {}
      const selectedCount = Object.values(selectedPrayers).filter((value) => value).length
      const color =
        selectedCount === 0
          ? "#E5E7EB"
          : selectedCount === 1
            ? "#9CA3AF"
            : selectedCount === 2
              ? "#6B7280"
              : selectedCount === 3
                ? "#4B8B6F"
                : selectedCount === 4
                  ? "#34A853"
                  : selectedCount === 5
                    ? "#1F9D55"
                    : selectedCount === 6
                      ? "#0F7C3A"
                      : "#E5E7EB"

      markedDates[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
          },
          text: {
            color: selectedCount === 0 ? "#6B7280" : "white",
            fontWeight: selectedCount > 0 ? "600" : "400",
          },
        },
      }
    })
    return markedDates
  }

  const getPrayerIcon = (prayer) => {
    const icons = {
      fajr: "sunny-outline",
      dhuhr: "partly-sunny-outline",
      asr: "sunny-outline",
      maghrib: "moon-outline",
      isha: "moon-outline",
      witr: "moon-outline",
    }
    return icons[prayer] || "checkmark-circle-outline"
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Chart</Text>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setIsModalVisible(true)} activeOpacity={0.7}>
          <View style={styles.dateButtonContent}>
            <Icon name="calendar-outline" size={24} color="#5CB390" />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateButtonLabel}>Selected Date</Text>
              <Text style={styles.dateButtonText}>{moment(selectedDate).format("MMMM D, YYYY")}</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* <View style={styles.infoCard}>
          <Icon name="information-circle-outline" size={20} color="#5CB390" style={styles.infoIcon} />
          <Text style={styles.description}>
            Tap on a prayer to mark it as completed. Log your Qadha prayers using the button below.
          </Text>
        </View> */}

        <Text style={styles.sectionTitle}>Daily Prayers</Text>
        <View style={styles.prayersContainer}>
          {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
            <TouchableOpacity
              key={prayer}
              style={[styles.prayerButton, prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButton]}
              onPress={() => handlePrayerSelect(prayer)}
              activeOpacity={0.7}
            >
              <View style={styles.prayerButtonLeft}>
                <View style={[styles.prayerIconContainer, prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerIconContainer]}>
                  <Icon 
                    name={getPrayerIcon(prayer)} 
                    size={20} 
                    color={prayerStates[selectedDate]?.[prayer] ? "#FFFFFF" : "#6B7280"} 
                  />
                </View>
                <Text
                  style={[
                    styles.prayerButtonText,
                    prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButtonText,
                  ]}
                >
                  {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                </Text>
              </View>
              {prayerStates[selectedDate]?.[prayer] && (
                <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.prayQadhaButton} 
          onPress={() => setIsQadhaModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.prayQadhaButtonText}>Pray Qadha</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

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
                textSectionTitleColor: "#9CA3AF",
                selectedDayBackgroundColor: "#5CB390",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#5CB390",
                dayTextColor: "#1F2937",
                textDisabledColor: "#D1D5DB",
                dotColor: "#5CB390",
                selectedDotColor: "#ffffff",
                arrowColor: "#5CB390",
                monthTextColor: "#1F2937",
                indicatorColor: "#5CB390",
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "400",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />

            <View style={styles.colorKeyContainer}>
              <Text style={styles.colorKeyTitle}>Prayer Completion</Text>
              <View style={styles.colorKeyRow}>
                {[
                  { color: "#E5E7EB", label: "0", textColor: "#6B7280" },
                  { color: "#9CA3AF", label: "1" },
                  { color: "#6B7280", label: "2" },
                  { color: "#4B8B6F", label: "3" },
                  { color: "#34A853", label: "4" },
                  { color: "#1F9D55", label: "5" },
                  ...(madhab === "Hanafi" ? [{ color: "#0F7C3A", label: "6" }] : []),
                ].map((item) => (
                  <View key={item.color} style={styles.colorKeyItem}>
                    <View style={[styles.colorBox, { backgroundColor: item.color }]}>
                      <Text style={[styles.colorBoxText, { color: item.textColor || "#FFFFFF" }]}>{item.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isQadhaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsQadhaModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Qadha Salah</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss()
                  setIsQadhaModalVisible(false)
                }}>
                  <Icon name="close-circle" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalText}>
                Enter the number of Qadha prayers you completed today
              </Text>
        
              <ScrollView style={styles.qadhaScrollView}>
                <View style={styles.qadhaCountersContainer}>
                  {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
                    <View key={prayer} style={styles.qadhaCounterWrapper}>
                      <View style={styles.qadhaLabelContainer}>
                        <Icon name={getPrayerIcon(prayer)} size={20} color="#5CB390" style={styles.qadhaIcon} />
                        <Text style={styles.qadhaCounterLabel}>
                          {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.qadhaCounterControls}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => adjustCount(prayer, -1)}
                          activeOpacity={0.7}
                        >
                          <Icon name="remove" size={20} color="#5CB390" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.qadhaCounterInput}
                          keyboardType="numeric"
                          value={String(ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0)}
                          onChangeText={(text) => {
                            const newValue = parseInt(text, 10) || 0
                            adjustCount(prayer, newValue - (ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0))
                          }}
                        />
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => adjustCount(prayer, 1)}
                          activeOpacity={0.7}
                        >
                          <Icon name="add" size={20} color="#5CB390" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5CB390",
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
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 12,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E8F8F3",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: "#2F7F6F",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  prayersContainer: {
    gap: 10,
    marginBottom: 20,
  },
  prayerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPrayerButton: {
    backgroundColor: "#5CB390",
    borderColor: "#5CB390",
  },
  prayerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  prayerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedPrayerIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  prayerButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  selectedPrayerButtonText: {
    color: "#FFFFFF",
  },
  prayQadhaButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F7F6F",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  prayQadhaButtonText: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalText: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 22,
  },
  colorKeyContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  colorKeyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  colorKeyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorKeyItem: {
    alignItems: "center",
  },
  colorBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  colorBoxText: {
    fontSize: 13,
    fontWeight: "700",
  },
  qadhaScrollView: {
    maxHeight: 400,
  },
  qadhaCountersContainer: {
    gap: 12,
  },
  qadhaCounterWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  qadhaLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  qadhaIcon: {
    marginRight: 10,
  },
  qadhaCounterLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  qadhaCounterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5CB390",
  },
  qadhaCounterInput: {
    fontSize: 16,
    color: "#5CB390",
    borderWidth: 2,
    borderColor: "#5CB390",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
  },
})

export default DailyChart