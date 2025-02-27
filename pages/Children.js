import { useContext, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { AppContext } from "../AppContext"
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const Children = () => {
  const navigation = useNavigation()
  const { selectedLanguage, gender, madhab } = useContext(AppContext)
  const [selectedOption, setSelectedOption] = useState(null)

  const handleOptionSelect = (option) => {
    setSelectedOption(option)
  }

  const handleConfirm = async () => {
    if (selectedOption) {
        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                const userId = user.uid;
                const userDocRef = doc(db, "users", userId);

                const userDoc = await getDoc(userDocRef);

                // Convert selection to a boolean
                const hadChildrenBeforeSalah = selectedOption !== "No";

                if (userDoc.exists()) {
                    // Update existing user document
                    await updateDoc(userDocRef, {
                        hadChildrenBeforeSalah,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    // Create a new document if it doesn't exist
                    await setDoc(userDocRef, {
                        hadChildrenBeforeSalah,
                        createdAt: serverTimestamp(),
                    });
                }

                console.log("Childbirth data saved successfully!");

                // Navigate based on user selection
                if (!hadChildrenBeforeSalah) {
                    navigation.navigate("YearsMissed");
                } else {
                    navigation.navigate("NumberOfChildren");
                }
            } else {
                console.error("No authenticated user found!");
                Alert.alert("Error", "You need to be logged in to save your data.");
            }
        } catch (error) {
            console.error("Error saving childbirth data:", error);
            Alert.alert("Error", "Failed to save data. Please try again.");
        }
    }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Previous Childbirth</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Did you have any children before you started praying salah regularly?</Text>
        <View style={styles.optionsContainer}>
          {["Yes", "Don't Know", "No"].map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, selectedOption === option && styles.selectedOptionButton]}
              onPress={() => handleOptionSelect(option)}
            >
              <Text style={[styles.optionButtonText, selectedOption === option && styles.selectedOptionButtonText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.bottomContainer}>
        {selectedOption && (
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
  optionsContainer: {
    alignItems: "center",
  },
  optionButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  selectedOptionButton: {
    backgroundColor: "#4BD4A2",
  },
  optionButtonText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedOptionButtonText: {
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
})

export default Children