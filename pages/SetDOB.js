import { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Platform, Modal, TextInput, Alert } from "react-native"
import { AppContext } from "../AppContext"
import { useNavigation } from "@react-navigation/native"
import DateTimePicker from "@react-native-community/datetimepicker"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SetDOB = () => {
  const navigation = useNavigation()
  const { setDob, setDop, gender } = useContext(AppContext)
  const [selectedDOB, setSelectedDOB] = useState(null)
  const [selectedDOP, setSelectedDOP] = useState(null)
  const [showDOBPicker, setShowDOBPicker] = useState(false)
  const [showAgePicker, setShowAgePicker] = useState(false)
  const [selectedAge, setSelectedAge] = useState(null)
  const [tempAge, setTempAge] = useState("")
  const insets = useSafeAreaInsets();

  const today = new Date()
  const minimumDOB = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate())

  const selectDOB = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowDOBPicker(false)
      return
    }

    const currentDate = selectedDate || selectedDOB
    setShowDOBPicker(Platform.OS === "ios")
    setSelectedDOB(currentDate)
    setSelectedDOP(null)
    setSelectedAge(null)
  }

  const islamicDefault = (date) => {
    if (date) {
      const newDate = new Date(date)
      const newMonth = newDate.getMonth() + 8
      newDate.setFullYear(newDate.getFullYear() + 14)

      if (newMonth > 11) {
        newDate.setFullYear(newDate.getFullYear() + 1)
        newDate.setMonth(newMonth - 12)
      } else {
        newDate.setMonth(newMonth)
      }
      return newDate
    }
    return null
  }

  const handleIslamicDefault = () => {
    if (selectedDOB) {
      const defaultDOP = islamicDefault(selectedDOB)
      setSelectedDOP(defaultDOP)
      setSelectedAge(null)
    }
  }

  const handleExactAge = () => {
    setTempAge(selectedAge !== null ? String(selectedAge) : "")
    setShowAgePicker(true)
  }

  const applyExactAge = () => {
    const age = Number(tempAge)

    if (!selectedDOB) return

    if (age < 9 || age > 16) {
      Alert.alert("Invalid Age", "Age of puberty can only be between 9 and 16.")
      return
    }

    const newDate = new Date(selectedDOB)
    newDate.setFullYear(newDate.getFullYear() + age)
    setSelectedDOP(newDate)
    setSelectedAge(age)
    setShowAgePicker(false)
}


  const handleConfirm = async () => {
    if (selectedDOB && selectedDOP) {
      setDob(selectedDOB)
      setDop(selectedDOP)

      try {
        const user = auth().currentUser

        if (user) {
          const userId = user.uid
          const userDocRef = firestore().collection("users").doc(userId)
          const userDoc = await userDocRef.get()

          if (userDoc.exists) {
            await userDocRef.update({
              dob: firestore.Timestamp.fromDate(selectedDOB),
              dop: firestore.Timestamp.fromDate(selectedDOP),
            })
          } else {
            await userDocRef.set(
              {
                dob: firestore.Timestamp.fromDate(selectedDOB),
                dop: firestore.Timestamp.fromDate(selectedDOP),
                createdAt: firestore.Timestamp.now(),
              },
              { merge: true }
            )
          }

          console.log("Dates saved successfully!")
        } else {
          console.error("No authenticated user found!")
        }
      } catch (error) {
        console.error("Error saving dates:", error)
      }

      navigation.navigate("GenderSelection")
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Your Dates</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Date of Birth</Text>
        <TouchableOpacity
          style={[styles.dateButton, selectedDOB && styles.selectedDateButton]}
          onPress={() => setShowDOBPicker(true)}
        >
          <Text style={[styles.dateText, selectedDOB && styles.selectedDateText]}>
            {selectedDOB ? selectedDOB.toLocaleDateString() : "Select Date"}
          </Text>
        </TouchableOpacity>
        {showDOBPicker && Platform.OS === "ios" && (
          <Modal transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <DateTimePicker
                  value={selectedDOB || new Date()}
                  mode="date"
                  display="spinner"
                  onChange={(event, date) => {
                    if (date) setSelectedDOB(date)
                  }}
                  maximumDate={minimumDOB}
                />
                <TouchableOpacity onPress={() => setShowDOBPicker(false)}>
                  <Text>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
        {showDOBPicker && Platform.OS !== "ios" && (
          <DateTimePicker
            value={selectedDOB || new Date()}
            mode="date"
            display="spinner"
            onChange={selectDOB}
            maximumDate={minimumDOB}
          />
        )}
      </View>

      {selectedDOB && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Age of Puberty</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedDOP &&
                  selectedDOP.getTime() === islamicDefault(selectedDOB)?.getTime() &&
                  styles.selectedOptionButton,
              ]}
              onPress={handleIslamicDefault}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedDOP &&
                    selectedDOP.getTime() === islamicDefault(selectedDOB)?.getTime() &&
                    styles.selectedOptionText,
                ]}
              >
                Islamic Default (14 years and 8 months)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, selectedAge !== null && styles.selectedOptionButton]}
              onPress={handleExactAge}
            >
              <Text style={[styles.optionText, selectedAge !== null && styles.selectedOptionText]}>
                {selectedAge !== null ? `Age ${selectedAge}` : "Select Exact Age"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showAgePicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Your Age of Puberty</Text>

            <TextInput
              style={styles.ageInput}
              keyboardType="numeric"
              placeholder="9 - 16"
              value={tempAge}
              onChangeText={(text) => setTempAge(text.replace(/[^0-9]/g, ""))}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={applyExactAge}>
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowAgePicker(false)}>
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        {selectedDOB && selectedDOP && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleConfirm}
            style={[styles.confirmButton, styles.activeConfirmButton]}
          >
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
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 16,
  },
  dateButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedDateButton: {
    backgroundColor: "#4BD4A2",
  },
  dateText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedDateText: {
    color: "#FFFFFF",
  },
  buttonGroup: {
    flexDirection: "column",
    gap: 12,
  },
  optionButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedOptionButton: {
    backgroundColor: "#4BD4A2",
  },
  optionText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
    textAlign: "center",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  bottomContainer: {
    position: "absolute",
    width: "100%",
    alignItems: "center",
    alignSelf: "center",
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  activeConfirmButton: {
    backgroundColor: "#2F7F6F",
    borderRadius: 12,
  },
  confirmButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
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
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 24,
  },
  ageInput: {
    width: "60%",
    borderWidth: 1,
    borderColor: "#777777",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtonsRow: {
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

export default SetDOB