import { useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PostNatal = () => {
  const navigation = useNavigation();
  const { pnb, setPNB } = useContext(AppContext);
  const [showPNBPicker, setShowPNBPicker] = useState(false);
  const [selectedPNB, setSelectedPNB] = useState(pnb?.toString() || "");
  const insets = useSafeAreaInsets();

  const handleConfirm = async () => {
    if (selectedPNB === "" || isNaN(selectedPNB) || Number(selectedPNB) < 0) {
      Alert.alert("Invalid input", "Please enter a valid number of days.");
      return;
    }

    try {
      const user = auth().currentUser;

      if (user) {
        const userId = user.uid;
        const userDocRef = firestore().collection("users").doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          await userDocRef.update({
            postNatalBleedingDays: Number(selectedPNB),
          });
        } else {
          await userDocRef.set(
            {
              postNatalBleedingDays: Number(selectedPNB),
              createdAt: firestore.Timestamp.now(),
            },
            { merge: true }
          );
        }

        setPNB(Number(selectedPNB));
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
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Post Natal Bleeding</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          Please enter the average number of days for your post natal bleeding:
        </Text>
        <TouchableOpacity
          style={[styles.selectButton, selectedPNB !== "" && styles.selectedButton]}
          onPress={() => setShowPNBPicker(true)}
        >
          <Text style={[styles.selectButtonText, selectedPNB !== "" && styles.selectedButtonText]}>
            {selectedPNB !== ""
              ? `${selectedPNB} ${Number(selectedPNB) === 1 ? "Day" : "Days"}`
              : "Enter Days"}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showPNBPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Number of Days</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Number of Days"
              value={selectedPNB}
              onChangeText={(text) => setSelectedPNB(text.replace(/[^0-9]/g, ""))}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => setShowPNBPicker(false)}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowPNBPicker(false)}
              >
                <Text style={styles.modalCloseButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        {selectedPNB !== "" && (
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
});

export default PostNatal;