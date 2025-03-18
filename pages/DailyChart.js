import { useContext, useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, TextInput } from "react-native"
import { Calendar } from "react-native-calendars"
import { AppContext } from "../AppContext"
import moment from "moment"
import Icon from "react-native-vector-icons/FontAwesome"
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";

const { height } = Dimensions.get("window")

const DailyChart = () => {
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
    madhab,
    setMadhab,
  } = useContext(AppContext)
  const auth = getAuth()
  const user = auth.currentUser
  const userId = user ? user.uid : null

  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const [prayerStates, setPrayerStates] = useState({})
  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isQadhaModalVisible, setIsQadhaModalVisible] = useState(false);

  useEffect(() => {
    if (userId) {
      const fetchMadhab = async () => {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
  
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.madhab) {
            setMadhab(userData.madhab);
          }
        }
      };
  
      fetchMadhab();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const fetchPrayerData = async () => {
        const dailyPrayerRef = doc(db, "users", userId, "dailyPrayers", selectedDate)
        const docSnap = await getDoc(dailyPrayerRef)

        if (docSnap.exists()) {
          const data = docSnap.data()
          setPrayerStates((prevStates) => ({ ...prevStates, [selectedDate]: data.prayers }))
          lsetDailyPrayerCounts((prevCounts) => ({ ...prevCounts, [selectedDate]: data.counts }))
        } else {
          await setDoc(dailyPrayerRef, {
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
        const totalQadhaRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
        const totalQadhaSnap = await getDoc(totalQadhaRef);
  
        if (totalQadhaSnap.exists()) {
          const data = totalQadhaSnap.data();
          setFajr(data.fajr || 0);
          setDhuhr(data.dhuhr || 0);
          setAsr(data.asr || 0);
          setMaghrib(data.maghrib || 0);
          setIsha(data.isha || 0);
          setWitr(data.witr || 0);
        }
      }
    };
  
    fetchPrayerCounts();
  }, [userId]);
  
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
    const wasSelected = prayerStates[selectedDate]?.[prayer] || false;
    const updatedStates = {
      ...prayerStates,
      [selectedDate]: {
        ...prayerStates[selectedDate],
        [prayer]: !wasSelected,
      },
    };
    setPrayerStates(updatedStates);

    const dailyPrayerRef = doc(db, "users", userId, "dailyPrayers", selectedDate);
    await updateDoc(dailyPrayerRef, {
      prayers: updatedStates[selectedDate],
    });

    if (wasSelected) {
      // Deselecting -> Increase total Qadha count
      await adjustTotalQadha(prayer, 1);
    } else {
      // Selecting -> Decrease total Qadha count
      await adjustTotalQadha(prayer, -1);
    }
};

const adjustTotalQadha = async (prayer, amount) => {
    const totalQadhaRef = doc(db, "users", userId, "totalQadha/qadhaSummary");
    const totalQadhaSnap = await getDoc(totalQadhaRef);

    if (totalQadhaSnap.exists()) {
      const totalData = totalQadhaSnap.data();
      const totalQadhaLeft = totalData[prayer] || 0;
      const updatedTotal = totalQadhaLeft + amount;

      await updateDoc(totalQadhaRef, {
        [prayer]: updatedTotal < 0 ? 0 : updatedTotal,
      });
    }
};
  
  const adjustCount = async (prayer, amount) => {
    const currentCount = ldailyPrayerCounts[selectedDate]?.[prayer] || 0;
    const newCount = currentCount + amount;
  
    // Prevent negative Qadha count update
    if (newCount < 0) return;
  
    lsetDailyPrayerCounts((prevCounts) => ({
      ...prevCounts,
      [selectedDate]: {
        ...prevCounts[selectedDate],
        [prayer]: newCount,
      },
    }));
  
    const dailyPrayerRef = doc(db, "users", userId, "dailyPrayers", selectedDate);
    await updateDoc(dailyPrayerRef, {
      [`counts.${prayer}`]: newCount,
    });
  
    const totalQadhaRef = doc(db, "users", userId, "totalQadha/qadhaSummary");
    const totalQadhaSnap = await getDoc(totalQadhaRef);
  
    if (totalQadhaSnap.exists()) {
      const totalData = totalQadhaSnap.data();
      const totalQadhaLeft = totalData[prayer] || 0;
      const updatedTotal = totalQadhaLeft - amount;
  
      // Prevent increasing Qadha when deselecting if it's already 0
      if (amount === -1 && totalQadhaLeft === 0) return;
  
      await updateDoc(totalQadhaRef, {
        [prayer]: updatedTotal < 0 ? 0 : updatedTotal,
      });
    }
  };

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
                {/* {prayerStates[selectedDate]?.[prayer] && (
                  <View style={styles.counterContainer}>
                  <Text style={styles.placeholder}>Qadha: </Text>
                  <TextInput
                    style={styles.counterInput}
                    keyboardType="numeric"
                    value={String(ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0)}
                    onChangeText={(text) => {
                    const newValue = parseInt(text, 10) || 0;
                    adjustCount(prayer, newValue - (ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0));
                    }}
                  />
                  </View>
                )} */}
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.prayQadhaButton} onPress={() => setIsQadhaModalVisible(true)}>
          <Text style={styles.prayQadhaButtonText}>Pray Qadha</Text>
        </TouchableOpacity>
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

      <Modal
        visible={isQadhaModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQadhaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Qadha Salah</Text>
            <Text style={styles.modalText}>
              Select the number of qadha salah you want to pray for the selected date
            </Text>

            {/* Qadha Counters */}
            <View style={styles.qadhaCountersContainer}>
              {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
                <View key={prayer} style={styles.qadhaCounterWrapper}>
                  <Text style={styles.qadhaCounterLabel}>
                    {prayer.charAt(0).toUpperCase() + prayer.slice(1)}:
                  </Text>
                  <TextInput
                    style={styles.qadhaCounterInput}
                    keyboardType="numeric"
                    value={String(ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0)}
                    onChangeText={(text) => {
                      const newValue = parseInt(text, 10) || 0;
                      adjustCount(prayer, newValue - (ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0));
                    }}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsQadhaModalVisible(false)}
            >
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
    paddingTop: 20,
    paddingLeft: 10,
    paddingRight: 10,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
    marginLeft: 10,
    marginRight: 10,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  placeholder: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
  counterInput: {
    fontSize: 16,
    color: "#FFFFFF",
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
  prayQadhaButton: {
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FBC742",
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  prayQadhaButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#5CB390",
    textAlign: "center",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: "#777777",
    textAlign: "center",
    marginBottom: 20,
  },
  qadhaCountersContainer: {
    width: "100%",
    marginBottom: 20,
  },
  qadhaCounterWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  qadhaCounterLabel: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  qadhaCounterInput: {
    fontSize: 16,
    color: "#5CB390",
    borderWidth: 1,
    borderColor: "#5CB390",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    width: 60,
    textAlign: "center",
  },
})

export default DailyChart