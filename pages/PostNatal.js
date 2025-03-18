import { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const PostNatal = () => {
  const navigation = useNavigation();
  const { pnb, setPNB } = useContext(AppContext);
  const [showPNBPicker, setShowPNBPicker] = useState(false);
  const [selectedPNB, setSelectedPNB] = useState(pnb);

  const handlePNBSelection = (days) => {
    setSelectedPNB(days);
    setPNB(days);
    setShowPNBPicker(false);
  };

  const handleConfirm = async () => {
    if (selectedPNB !== null) {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userId = user.uid;
          const userDocRef = doc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            await updateDoc(userDocRef, {
              postNatalBleedingDays: selectedPNB,
            });
          } else {
            await setDoc(userDocRef, {
              postNatalBleedingDays: selectedPNB,
              createdAt: Timestamp.now(),
            },
            { merge: true }
          );
          }

          console.log("Post Natal Bleeding data saved successfully!");
          navigation.navigate("YearsMissed");
        } else {
          console.error("No authenticated user found!");
          Alert.alert("Error", "You need to be logged in to save your data.");
        }
      } catch (error) {
        console.error("Error saving Post Natal Bleeding data:", error);
        Alert.alert("Error", "Failed to save data. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post Natal Bleeding</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Please select the average number of days for your post natal bleeding:</Text>
        <TouchableOpacity
          style={[styles.selectButton, selectedPNB !== null && styles.selectedButton]}
          onPress={() => setShowPNBPicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedPNB !== null && styles.selectedButtonText]}>
            {selectedPNB !== null ? `${selectedPNB} Days` : "Select Days"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPNBPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Days</Text>
            <View style={styles.daysButtonsContainer}>
              {Array.from({ length: 40 }, (_, i) => i + 1).map((days) => (
                <TouchableOpacity key={days} style={styles.daysButton} onPress={() => handlePNBSelection(days)}>
                  <Text style={styles.daysButtonText}>{days}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowPNBPicker(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomContainer}>
        {selectedPNB !== null && (
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

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

export default PostNatal