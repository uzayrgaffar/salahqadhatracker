import React, { useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { db } from "../FirebaseConfig"
import { doc, setDoc, serverTimestamp, getDoc, updateDoc, Timestamp } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const DaysOfCycle = () => {
  const navigation = useNavigation()
  const [showCyclePicker, setShowCyclePicker] = useState(false)
  const [selectedDays, setSelectedDays] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCycleSelection = (days) => {
    setSelectedDays(days)
    setShowCyclePicker(false)
  }

  const handleConfirm = async () => {
    if (!selectedDays) return;
  
    setLoading(true); // Start loading indicator
  
    try {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        console.error("No authenticated user found!");
        Alert.alert("Error", "You need to be logged in to save your cycle data.");
        setLoading(false);
        return;
      }
  
      const userId = user.uid;
      const userDocRef = doc(db, "users", userId);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          daysOfCycle: selectedDays,
        });
      } else {
        await setDoc(
          userDocRef,
          {
            daysOfCycle: selectedDays,
            createdAt: Timestamp.now(),
          },
          { merge: true } // Prevents overwriting other user data
        );
      }
  
      console.log("Cycle days saved successfully!");
      navigation.navigate("Children");
    } catch (error) {
      console.error("Error saving cycle days:", error);
      Alert.alert("Error", "Failed to save data. Please try again.");
    } finally {
      setLoading(false); // Stop loading indicator
    }
  };  


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Days of Cycle</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select the number of days in your cycle:</Text>
        <TouchableOpacity
          style={[styles.selectButton, selectedDays && styles.selectedButton]}
          onPress={() => setShowCyclePicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedDays && styles.selectedButtonText]}>
            {selectedDays ? `${selectedDays} Days` : "Select Days"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showCyclePicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Days of Cycle</Text>
            <View style={styles.daysButtonsContainer}>
              {Array.from({ length: 8 }, (_, i) => i + 3).map((days) => (
                <TouchableOpacity key={days} style={styles.daysButton} onPress={() => handleCycleSelection(days)}>
                  <Text style={styles.daysButtonText}>{days}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCyclePicker(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomContainer}>
        {selectedDays && (
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
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  confirmButton: {
    backgroundColor: "#FBC742",
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
  daysButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  daysButton: {
    backgroundColor: "#4BD4A2",
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  daysButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: "#FBC742",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default DaysOfCycle