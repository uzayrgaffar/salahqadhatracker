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
  const { setDob, setDop } = useContext(AppContext)
  const [selectedDOB, setSelectedDOB] = useState(null)
  const [selectedDOP, setSelectedDOP] = useState(null)
  const [showDOBPicker, setShowDOBPicker] = useState(false)
  const [showAgePicker, setShowAgePicker] = useState(false)
  const [selectedAge, setSelectedAge] = useState(null)
  const [tempAge, setTempAge] = useState("")
  const insets = useSafeAreaInsets();

  const today = new Date()
  // Minimum age of 9 years old to use the app
  const minimumDOB = new Date(today.getFullYear() - 9, today.getMonth(), today.getDate())

  // --- Helper Calculations ---
  const userAgeToday = selectedDOB 
    ? today.getFullYear() - selectedDOB.getFullYear() - (today < new Date(today.getFullYear(), selectedDOB.getMonth(), selectedDOB.getDate()) ? 1 : 0) 
    : 0;

  const maxSelectableAge = Math.min(16, userAgeToday);
  
  // Show Islamic Default only if they are at least 15 lunar years (approx 14y 8m)
  const showIslamicOption = userAgeToday >= 15 || (userAgeToday === 14 && today.getMonth() >= (selectedDOB?.getMonth() + 8) % 12);

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
      const newDate = new Date(date);
      newDate.setFullYear(newDate.getFullYear() + 14);
      newDate.setMonth(newDate.getMonth() + 8);
      return newDate > today ? today : newDate;
    }
    return null;
  };

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
    const age = Number(tempAge);
    if (!selectedDOB) return;

    if (age < 9 || age > maxSelectableAge) {
      Alert.alert("Invalid Age", `Based on your birth date, please enter an age between 9 and ${maxSelectableAge}.`);
      return;
    }

    const newDate = new Date(selectedDOB);
    newDate.setFullYear(newDate.getFullYear() + age);

    if (newDate > today) {
      Alert.alert("Invalid Selection", "The calculated Date of Puberty cannot be in the future.");
      return;
    }

    setSelectedDOP(newDate);
    setSelectedAge(age);
    setShowAgePicker(false);
  };

  const handleConfirm = async () => {
    if (selectedDOB && selectedDOP) {
      setDob(selectedDOB)
      setDop(selectedDOP)

      try {
        const user = auth().currentUser

        if (user) {
          const userId = user.uid
          const userDocRef = firestore().collection("users").doc(userId)
          await userDocRef.set({
            dob: firestore.Timestamp.fromDate(selectedDOB),
            dop: firestore.Timestamp.fromDate(selectedDOP),
            updatedAt: firestore.Timestamp.now(),
          }, { merge: true })
          console.log("Dates saved successfully!")
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

        {/* 1. iOS Spinner Logic */}
        {showDOBPicker && Platform.OS === 'ios' && (
          <Modal transparent animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <DateTimePicker
                  value={selectedDOB || minimumDOB}
                  mode="date"
                  display="spinner"
                  onChange={selectDOB}
                  maximumDate={minimumDOB}
                />
                <TouchableOpacity 
                  onPress={() => setShowDOBPicker(false)} 
                  style={styles.modalConfirmButton}
                >
                  <Text style={styles.modalConfirmButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* 2. Android Spinner Logic (No Modal wrapper needed) */}
        {showDOBPicker && Platform.OS === 'android' && (
          <DateTimePicker
            value={selectedDOB || minimumDOB}
            mode="date"
            display="spinner"
            onChange={selectDOB}
            maximumDate={minimumDOB}
          />
        )}
      </View>

      {/* Age of Puberty Card */}
      {selectedDOB && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Age of Puberty</Text>
          <View style={styles.buttonGroup}>
            
            {showIslamicOption && (
              <TouchableOpacity
                style={[
                  styles.optionButton,
                  selectedDOP?.getTime() === islamicDefault(selectedDOB)?.getTime() && styles.selectedOptionButton,
                ]}
                onPress={handleIslamicDefault}
              >
                <Text style={[
                  styles.optionText,
                  selectedDOP?.getTime() === islamicDefault(selectedDOB)?.getTime() && styles.selectedOptionText,
                ]}>
                  Islamic Default (14 years and 8 months)
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.optionButton, selectedAge !== null && styles.selectedOptionButton]}
              onPress={handleExactAge}
            >
              <Text style={[styles.optionText, selectedAge !== null && styles.selectedOptionText]}>
                {selectedAge !== null 
                  ? `Age ${selectedAge}` 
                  : userAgeToday < 15 ? "Enter Age of Puberty" : "Select Exact Age"}
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
              placeholder={`${9}-${maxSelectableAge}`}
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
    marginBottom: 10,
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