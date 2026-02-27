import { useContext, useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native"
import { AppContext } from "../AppContext"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router"

export const SetQadhaSalah = () => {
  const router = useRouter()

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
    setYearsMissed,
    setDaysOfCycle,
    setGender,
    setMadhab,
    setPNB,
    setNumberOfChildren,
  } = useContext(AppContext)
  const insets = useSafeAreaInsets();

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth().currentUser

        if (user) {
          const userDocRef = firestore().collection("users").doc(user.uid)
          const userDoc = await userDocRef.get()

          if (userDoc.exists) {
            const data = userDoc.data()

            setYearsMissed?.(data.yearsMissed || 0)
            setDaysOfCycle?.(data.daysOfCycle || 0)
            setGender?.(data.gender || "")
            setMadhab?.(data.madhab || "")
            setPNB?.(data.postNatalBleedingDays || 0)
            setNumberOfChildren?.(data.numberOfChildren || 0)
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    }

    fetchData()
  }, [])

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

  const confirmSelection = async () => {
    const totalDays = yearsMissed * 365
    let adjustedDays = totalDays

    if (daysOfCycle && gender === "Female") {
      const missedDays = yearsMissed * 336 - daysOfCycle * 12 * yearsMissed
      const childAdjustment = numberOfChildren * 9 * daysOfCycle
      const pnbAdjustment = pnb * numberOfChildren
      adjustedDays = missedDays + childAdjustment - pnbAdjustment
    }

    let fajr = selectedSalah.Fajr ? 0 : adjustedDays
    let dhuhr = selectedSalah.Dhuhr ? 0 : adjustedDays
    let asr = selectedSalah.Asr ? 0 : adjustedDays
    let maghrib = selectedSalah.Maghrib ? 0 : adjustedDays
    let isha = selectedSalah.Isha ? 0 : adjustedDays
    let witr = selectedSalah.Witr ? 0 : adjustedDays

    if (selectedSalah.Jummah && !selectedSalah.Dhuhr) {
      const jummahWeeks = selectedSalah.OnlyRamadan ? 48 : 52
      dhuhr -= jummahWeeks * yearsMissed
    }

    if (selectedSalah.OnlyRamadan) {
      const ramadanReduction = 30 * yearsMissed
      if (!selectedSalah.Fajr) fajr = Math.max(0, fajr - ramadanReduction)
      if (!selectedSalah.Dhuhr) dhuhr = Math.max(0, dhuhr - ramadanReduction)
      if (!selectedSalah.Asr) asr = Math.max(0, asr - ramadanReduction)
      if (!selectedSalah.Maghrib) maghrib = Math.max(0, maghrib - ramadanReduction)
      if (!selectedSalah.Isha) isha = Math.max(0, isha - ramadanReduction)
      if (!selectedSalah.Witr) witr = Math.max(0, witr - ramadanReduction)
    }

    fajr = Math.max(0, fajr)
    dhuhr = Math.max(0, dhuhr)
    asr = Math.max(0, asr)
    maghrib = Math.max(0, maghrib)
    isha = Math.max(0, isha)
    witr = Math.max(0, witr)

    setFajr?.(fajr)
    setDhuhr?.(dhuhr)
    setAsr?.(asr)
    setMaghrib?.(maghrib)
    setIsha?.(isha)
    setWitr?.(witr)

    try {
      const user = auth().currentUser

      if (user) {
        const userDocRef = firestore().collection("users").doc(user.uid)
        const postNatalBleedingDays = pnb;

        await userDocRef.update({
          yearsMissed,
          daysOfCycle,
          gender,
          madhab,
          postNatalBleedingDays,
          numberOfChildren,
        })

        const totalQadhaRef = firestore()
          .collection("users")
          .doc(user.uid)
          .collection("totalQadha")
          .doc("qadhaSummary")

        try {
          await totalQadhaRef.update({
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha,
            witr,
          })
        } catch (error) {
          await totalQadhaRef.set({
            fajr,
            dhuhr,
            asr,
            maghrib,
            isha,
            witr,
          })
        }

        console.log("Qadha Salah data saved successfully!")
        router.push("/Totals")
      } else {
        Alert.alert("Error", "You need to be logged in to save your data.")
      }
    } catch (error) {
      console.error("Error saving data:", error)
      Alert.alert("Error", "Failed to save data. Please try again.")
    }
  }

  const getTranslation = (text) => {
    switch (selectedLanguage) {
      case "Arabic":
        return { /* Arabic translations */ }[text]
      case "Urdu":
        return { /* Urdu translations */ }[text]
      case "Hindi":
        return { /* Hindi translations */ }[text]
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
          question: "During the years you missed Salah, which prayers did you regularly perform?",
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{getTranslation("question")}</Text>
          <View style={styles.optionsContainer}>
            {["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", ...(madhab === "Hanafi" ? ["Witr"] : []), "Jummah", "OnlyRamadan", "None"].map((salah) => (
              <TouchableOpacity key={salah} style={[styles.optionButton, selectedSalah[salah] && styles.optionButtonSelected]} onPress={() => toggleSalah(salah)}>
                <Text style={[styles.optionText, selectedSalah[salah] && styles.optionTextSelected]}>
                  {getTranslation(salah)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {isAnySelected && (
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom || 20 }]}>
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
    paddingBottom: 80,
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
    backgroundColor: "#5CB390",
    alignItems: "center",
    paddingVertical: 12,
  },
  confirmButton: {
    backgroundColor: "#2F7F6F",
    paddingVertical: 12,
    paddingHorizontal: 40,
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