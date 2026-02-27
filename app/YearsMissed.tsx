import { useContext, useState, useMemo, useCallback } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native"
import { AppContext } from "../AppContext"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"

const YearsMissed = () => {
  const router = useRouter()
  const { dop, setYearsMissed, setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr } = useContext(AppContext)

  const [showPicker, setShowPicker] = useState(false)
  const [yearsPrayed, setYearsPrayed] = useState("")
  const insets = useSafeAreaInsets()

  const totalYearsSincePuberty = useMemo(() => {
    const currentYear = new Date().getFullYear()
    const dopYear = new Date(dop).getFullYear()
    return Math.max(currentYear - dopYear, 0)
  }, [dop])

  const resetAllPrayers = useCallback(() => {
    setFajr(0)
    setDhuhr(0)
    setAsr(0)
    setMaghrib(0)
    setIsha(0)
    setWitr(0)
  }, [])

  const saveToFirestore = useCallback(async (userId, yearsMissed) => {
    const userDocRef = firestore().collection("users").doc(userId)
    const userDoc = await userDocRef.get()

    if (userDoc.exists) {
      await userDocRef.update({ yearsMissed })
    } else {
      await userDocRef.set(
        {
          yearsMissed,
          createdAt: firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      )
    }
  }, [])

  const handleConfirm = useCallback(async () => {
    if (yearsPrayed === "") {
      Alert.alert("Invalid input", "Please enter a number.")
      return
    }

    const prayedYears = Number(yearsPrayed)

    if (isNaN(prayedYears) || prayedYears < 0) {
      Alert.alert("Invalid input", "Please enter a valid number.")
      return
    }

    if (prayedYears > totalYearsSincePuberty) {
      Alert.alert(
        "Invalid input",
        `You cannot enter more than ${totalYearsSincePuberty} years.`
      )
      return
    }

    const yearsMissed = totalYearsSincePuberty - prayedYears

    try {
      const user = auth().currentUser

      if (!user) {
        Alert.alert("Error", "You need to be logged in to save your data.")
        return
      }

      await saveToFirestore(user.uid, yearsMissed)
      setYearsMissed(yearsMissed)

      if (yearsMissed === 0) {
        resetAllPrayers()
      }
      router.push("/MadhabSelection")
    } catch (error) {
      console.error("Error saving years missed:", error)
      Alert.alert("Error", "Failed to save data. Please try again.")
    }
  }, [
    yearsPrayed,
    totalYearsSincePuberty,
    saveToFirestore,
    setYearsMissed,
    resetAllPrayers,
    router,
  ])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Years of Salah</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          How many years have you prayed salah regularly?
        </Text>

        <TouchableOpacity
          style={[styles.selectButton, yearsPrayed !== "" && styles.selectedButton]}
          onPress={() => setShowPicker(true)}
        >
          <Text
            style={[
              styles.selectButtonText,
              yearsPrayed !== "" && styles.selectedButtonText,
            ]}
          >
            {yearsPrayed !== ""
              ? `${yearsPrayed} ${Number(yearsPrayed) === 1 ? "Year" : "Years"}`
              : "Enter Years"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Years Prayed Regularly</Text>

            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder={`0 - ${totalYearsSincePuberty}`}
              value={yearsPrayed}
              onChangeText={(text) =>
                setYearsPrayed(text.replace(/[^0-9]/g, ""))
              }
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>

            </View>
          </View>
        </View>
      </Modal>

      <View
        style={[
          styles.bottomContainer,
          { bottom: (insets.bottom || 20) + 20 },
        ]}
      >
        {yearsPrayed !== "" && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 16,
    textAlign: "center",
  },
  selectButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#4BD4A2",
  },
  selectButtonText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedButtonText: {
    color: "#FFFFFF",
  },
  bottomContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#2F7F6F",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalConfirmButton: {
    backgroundColor: "#2F7F6F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  modalConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  modalCloseButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#2F7F6F",
  },
  modalCloseButtonText: {
    color: "#2F7F6F",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default YearsMissed