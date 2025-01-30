import { useContext, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { AppContext } from "../AppContext"

export const SetQadhaSalah = () => {
  const navigation = useNavigation()
  const {
    selectedLanguage,
    setFajr,
    setDhuhr,
    setAsr,
    setMaghrib,
    setIsha,
    setWitr,
    yearsMissed,
    daysOfCycle,
    gender,
    madhab,
    pnb,
    numberOfChildren,
  } = useContext(AppContext)
  const [selectedSalah, setSelectedSalah] = useState({
    Fajr: false,
    Dhuhr: false,
    Asr: false,
    Maghrib: false,
    Isha: false,
    Witr: false,
    Jummah: false,
    OnlyRamadan: false,
    None: false,
  })

  const toggleSalah = (salah) => {
    setSelectedSalah((prevState) => {
      const newState = { ...prevState }

      if (salah === "None") {
        Object.keys(newState).forEach((key) => {
          newState[key] = key === "None" ? !prevState.None : false
        })
      } else {
        newState.None = false
        newState[salah] = !prevState[salah]
      }

      return newState
    })
  }

  const confirmSelection = () => {
    const totalDays = yearsMissed * 365

    if (selectedSalah.OnlyRamadan) {
      const daysPerYear = 336
      const missedDays = yearsMissed * daysPerYear
      if (daysOfCycle && gender === "Female") {
        const missedDays = yearsMissed * daysPerYear - daysOfCycle * 12 * yearsMissed
        const childAdjustment = numberOfChildren * 9 * daysOfCycle
        const pnbAdjustment = pnb * numberOfChildren
        const adjustedDays = missedDays + childAdjustment - pnbAdjustment

        setFajr(adjustedDays)
        setDhuhr(adjustedDays)
        setAsr(adjustedDays)
        setMaghrib(adjustedDays)
        setIsha(adjustedDays)
        setWitr(adjustedDays)
      } else {
        setFajr(missedDays)
        setDhuhr(missedDays)
        setAsr(missedDays)
        setMaghrib(missedDays)
        setIsha(missedDays)
        setWitr(missedDays)

        if (selectedSalah.Jummah) {
          setDhuhr(missedDays - 48 * yearsMissed)
        }
      }
    } else if (selectedSalah.None) {
      if (daysOfCycle && gender === "Female") {
        const daysPerYear = 365
        const missedDays = yearsMissed * daysPerYear - daysOfCycle * 12 * yearsMissed
        const childAdjustment = numberOfChildren * 9 * daysOfCycle
        const pnbAdjustment = pnb * numberOfChildren
        const adjustedDays = missedDays + childAdjustment - pnbAdjustment

        setFajr(adjustedDays)
        setDhuhr(adjustedDays)
        setAsr(adjustedDays)
        setMaghrib(adjustedDays)
        setIsha(adjustedDays)
        setWitr(adjustedDays)
      } else {
        setFajr(totalDays)
        setDhuhr(totalDays)
        setAsr(totalDays)
        setMaghrib(totalDays)
        setIsha(totalDays)
        setWitr(totalDays)
      }
    } else {
      if (daysOfCycle && gender === "Female") {
        const ftotalDays = totalDays - daysOfCycle * 12 * yearsMissed
        setFajr(selectedSalah.Fajr ? 0 : ftotalDays)
        setDhuhr(selectedSalah.Dhuhr ? 0 : ftotalDays)
        setAsr(selectedSalah.Asr ? 0 : ftotalDays)
        setMaghrib(selectedSalah.Maghrib ? 0 : ftotalDays)
        setIsha(selectedSalah.Isha ? 0 : ftotalDays)
        setWitr(selectedSalah.Witr ? 0 : ftotalDays)

        if (selectedSalah.Jummah && !selectedSalah.Dhuhr) {
          const onlyJummah = ftotalDays - 52 * yearsMissed
          setDhuhr(onlyJummah)
        }
      } else {
        setFajr(selectedSalah.Fajr ? 0 : totalDays)
        setDhuhr(selectedSalah.Dhuhr ? 0 : totalDays)
        setAsr(selectedSalah.Asr ? 0 : totalDays)
        setMaghrib(selectedSalah.Maghrib ? 0 : totalDays)
        setIsha(selectedSalah.Isha ? 0 : totalDays)
        setWitr(selectedSalah.Witr ? 0 : totalDays)

        if (selectedSalah.Jummah && !selectedSalah.Dhuhr) {
          const onlyJummah = totalDays - 52 * yearsMissed
          setDhuhr(onlyJummah)
        }
      }
    }

    navigation.navigate("MainPages", { screen: "Daily Chart" })
  }

  const getTranslation = (text) => {
    switch (selectedLanguage) {
      case "Arabic":
        return {
          Fajr: "الفجر",
          Dhuhr: "الظهر",
          Asr: "العصر",
          Maghrib: "المغرب",
          Isha: "العشاء",
          Witr: "الوتر",
          Jummah: "الجمعة",
          OnlyRamadan: "رمضان فقط",
          None: "لا شيء مما سبق",
          question: "أي صلاة كنت تصلي بانتظام؟",
          confirm: "تأكيد",
        }[text]
      case "Urdu":
        return {
          Fajr: "فجر",
          Dhuhr: "ظہر",
          Asr: "عصر",
          Maghrib: "مغرب",
          Isha: "عشاء",
          Witr: "وتر",
          Jummah: "جمعہ",
          OnlyRamadan: "صرف رمضان",
          None: "اوپر میں سے کوئی نہیں",
          question: "آپ نے کون سی نماز باقاعدگی سے ادا کی؟",
          confirm: "تصدیق کریں",
        }[text]
      case "Hindi":
        return {
          Fajr: "फजर",
          Dhuhr: "जुहर",
          Asr: "असर",
          Maghrib: "मग़रिब",
          Isha: "ईशा",
          Witr: "वितर",
          Jummah: "जुम्मा",
          OnlyRamadan: "केवल रमजान",
          None: "उपरोक्त में से कोई नहीं",
          question: "आपने कौन सी नमाज नियमित रूप से पढ़ी?",
          confirm: "पुष्टि करें",
        }[text]
      default:
        return {
          Fajr: "Fajr",
          Dhuhr: "Dhuhr",
          Asr: "Asr",
          Maghrib: "Maghrib",
          Isha: "Isha",
          Witr: "Witr",
          Jummah: "Jummah",
          OnlyRamadan: "Only Ramadan",
          None: "None of the Above",
          question: "Which Salah did you pray regularly?",
          confirm: "Confirm",
        }[text]
    }
  }

  const isAnySelected = Object.values(selectedSalah).some((value) => value)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Qadha Salah</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{getTranslation("question")}</Text>

          <View style={styles.optionsContainer}>
            {[
              "Fajr",
              "Dhuhr",
              "Asr",
              "Maghrib",
              "Isha",
              ...(madhab === "Hanafi" ? ["Witr"] : []),
              "Jummah",
              "OnlyRamadan",
              "None",
            ].map((salah) => (
              <TouchableOpacity
                key={salah}
                style={[styles.optionButton, selectedSalah[salah] && styles.optionButtonSelected]}
                onPress={() => toggleSalah(salah)}
              >
                <Text style={[styles.optionText, selectedSalah[salah] && styles.optionTextSelected]}>
                  {getTranslation(salah)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {isAnySelected && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.confirmButton} onPress={confirmSelection}>
            <Text style={styles.confirmButtonText}>{getTranslation("confirm")}</Text>
          </TouchableOpacity>
        </View>
      )}
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Add padding to prevent overlap with bottom button
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 16,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
  },
  optionButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  optionButtonSelected: {
    backgroundColor: "#4BD4A2",
  },
  optionText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#FFFFFF",
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: "#5CB390",
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#FBC742",
    paddingVertical: 12,
    paddingHorizontal: 40,
    maxWidth: "45%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
})

export default SetQadhaSalah