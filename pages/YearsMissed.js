import { useContext, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { AppContext } from "../AppContext"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const YearsMissed = () => {
  const navigation = useNavigation()
  const { dob, dop, setYearsMissed, setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr } = useContext(AppContext)
  const [showYearsPicker, setShowYearsPicker] = useState(false)
  const [selectedYears, setSelectedYears] = useState(null)

  const currentYear = new Date().getFullYear()
  const dopYear = new Date(dop).getFullYear()
  const maxYearsMissed = currentYear - dopYear
  const yearsOptions = Array.from({ length: maxYearsMissed + 1 }, (_, i) => i)

  const handleYearSelection = (years) => {
    setSelectedYears(years)
    setShowYearsPicker(false)
  }

  const handleConfirm = async () => {
    if (selectedYears !== null) {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const userId = user.uid;
                const userDocRef = doc(db, "users", userId);

                const userDoc = await getDoc(userDocRef);

                if (userDoc.exists()) {
                    // Update existing user document
                    await updateDoc(userDocRef, {
                        yearsMissed: selectedYears,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    // Create a new document if it doesn't exist
                    await setDoc(userDocRef, {
                        yearsMissed: selectedYears,
                        createdAt: serverTimestamp(),
                    });
                }

                console.log("Years missed data saved successfully!");
                
                // Store locally in context
                setYearsMissed(selectedYears);
                
                // If no years were missed, set all prayers to 0
                if (selectedYears === 0) {
                    setFajr(0);
                    setDhuhr(0);
                    setAsr(0);
                    setMaghrib(0);
                    setIsha(0);
                    setWitr(0);
                }

                navigation.navigate("MadhabSelection");
            } else {
                console.error("No authenticated user found!");
                Alert.alert("Error", "You need to be logged in to save your data.");
            }
        } catch (error) {
            console.error("Error saving years missed data:", error);
            Alert.alert("Error", "Failed to save data. Please try again.");
        }
    }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Years Missed</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Please select the number of years of salah you have missed:</Text>
        <TouchableOpacity
          style={[styles.selectButton, selectedYears !== null && styles.selectedButton]}
          onPress={() => setShowYearsPicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedYears !== null && styles.selectedButtonText]}>
            {selectedYears !== null ? `${selectedYears} Years` : "Select Years"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showYearsPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Years Missed</Text>
            <ScrollView style={styles.yearsScrollView}>
              <View style={styles.yearsButtonsContainer}>
                {yearsOptions.map((year) => (
                  <TouchableOpacity key={year} style={styles.yearButton} onPress={() => handleYearSelection(year)}>
                    <Text style={styles.yearButtonText}>{year}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowYearsPicker(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomContainer}>
        {selectedYears !== null && (
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
    color: "#EEEEEE",
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
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 24,
  },
  yearsScrollView: {
    width: "100%",
    maxHeight: 400,
  },
  yearsButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  yearButton: {
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
  yearButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: "#FBC742",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  modalCloseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
})

export default YearsMissed