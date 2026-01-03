import { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const NumberOfChildren = () => {
  const navigation = useNavigation();
  const { numberOfChildren, setNumberOfChildren } = useContext(AppContext);
  const [showChildrenPicker, setShowChildrenPicker] = useState(false);
  const [selectedChildren, setSelectedChildren] = useState(numberOfChildren?.toString() || "");
  const insets = useSafeAreaInsets();

  const handleConfirmSelection = () => {
    if (selectedChildren === "" || isNaN(selectedChildren) || Number(selectedChildren) < 0) {
      Alert.alert("Invalid input", "Please enter a valid number of children.");
      return;
    }
    setNumberOfChildren(Number(selectedChildren));
    setShowChildrenPicker(false);
  };

  const handleConfirm = async () => {
    if (selectedChildren !== "") {
      try {
        const user = auth().currentUser;

        if (user) {
          const userId = user.uid;
          const userDocRef = firestore().collection("users").doc(userId);
          const userDoc = await userDocRef.get();

          if (userDoc.exists) {
            await userDocRef.update({
              numberOfChildren: Number(selectedChildren),
            });
          } else {
            await userDocRef.set(
              {
                numberOfChildren: Number(selectedChildren),
                createdAt: firestore.FieldValue.serverTimestamp(),
              },
              { merge: true }
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
          style={[styles.selectButton, selectedChildren !== "" && styles.selectedButton]}
          onPress={() => setShowChildrenPicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedChildren !== "" && styles.selectedButtonText]}>
            {selectedChildren !== "" ? `${selectedChildren} ${Number(selectedChildren) === 1 ? "Child" : "Children"}` : "Enter Number"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showChildrenPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Number of Children</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Number of Children"
              value={selectedChildren}
              onChangeText={(text) => setSelectedChildren(text.replace(/[^0-9]/g, ""))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={handleConfirmSelection}>
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowChildrenPicker(false)}>
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        {selectedChildren !== "" && (
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
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
  },
  modalConfirmButton: {
    backgroundColor: "#2F7F6F",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 10,
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
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginLeft: 10,
  },
  modalCloseButtonText: {
    color: "#2F7F6F",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default NumberOfChildren