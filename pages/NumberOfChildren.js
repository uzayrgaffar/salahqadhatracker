import { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const NumberOfChildren = () => {
  const navigation = useNavigation();
  const { numberOfChildren, setNumberOfChildren } = useContext(AppContext);
  const [showChildrenPicker, setShowChildrenPicker] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState(numberOfChildren);

  const handleChildrenSelection = (children) => {
    setSelectedChildren(children);
    setNumberOfChildren(children);
    setShowChildrenPicker(false);
  };

  const handleConfirm = async () => {
    if (selectedChildren !== null) {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user) {
          const userId = user.uid;
          const userDocRef = doc(db, "users", userId);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            // Update only the numberOfChildren field
            await updateDoc(userDocRef, {
              numberOfChildren: selectedChildren,
            });
          } else {
            // Create a new document if it doesn't exist
            await setDoc(
              userDocRef,
              {
                numberOfChildren: selectedChildren,
                createdAt: Timestamp.now(),
              },
              { merge: true } // Ensures other data is not erased
            );
          }

          console.log("Number of children saved successfully!");
          navigation.navigate("PostNatal");
        } else {
          console.error("No authenticated user found!");
          Alert.alert("Error", "You need to be logged in to save your data.");
        }
      } catch (error) {
        console.error("Error saving number of children:", error);
        Alert.alert("Error", "Failed to save data. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Number of Children</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          How many children did you have before you started praying salah regularly?
        </Text>
        <TouchableOpacity
          style={[styles.selectButton, selectedChildren !== null && styles.selectedButton]}
          onPress={() => setShowChildrenPicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedChildren !== null && styles.selectedButtonText]}>
            {selectedChildren !== null ? `${selectedChildren} Children` : "Select Number"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showChildrenPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Number of Children</Text>
            <View style={styles.childrenButtonsContainer}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((children) => (
                <TouchableOpacity
                  key={children}
                  style={styles.childrenButton}
                  onPress={() => handleChildrenSelection(children)}
                >
                  <Text style={styles.childrenButtonText}>{children}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowChildrenPicker(false)}>
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.bottomContainer}>
        {selectedChildren !== null && (
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
  childrenButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 24,
  },
  childrenButton: {
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
  childrenButtonText: {
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

export default NumberOfChildren