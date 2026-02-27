import { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Text } from "react-native"
import { AppContext } from "../AppContext"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router"

const GenderSelection = () => {
  const router = useRouter()
  const { setGender } = useContext(AppContext)
  const [selectedGender, setSelectedGender] = useState(null)
  const insets = useSafeAreaInsets();

  const selectGender = (gender) => {
    setSelectedGender(gender)
  }

  const handleConfirm = async () => {
    if (selectedGender) {
      setGender(selectedGender);
  
      try {
        const user = auth().currentUser;
  
        if (user) {
          const userId = user.uid;
          const userDocRef = firestore().collection("users").doc(userId);
  
          const userDoc = await userDocRef.get();
  
          if (userDoc.exists) {
            await userDocRef.update({
              gender: selectedGender,
            });
          } else {
            await userDocRef.set(
              {
                gender: selectedGender,
                createdAt: firestore.Timestamp.now(),
              },
              { merge: true }
            );            
          }
  
          console.log("Gender saved successfully!");
        } else {
          console.error("No authenticated user found!");
        }
      } catch (error) {
        console.error("Error saving gender:", error);
      }
      router.push(selectedGender === "Female" ? "/DaysOfCycle" : "/YearsMissed")
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Your Gender</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Please select your gender:</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectGender("Male")}
            style={[styles.genderButton, selectedGender === "Male" && styles.selectedButton]}
          >
            <Ionicons name="man" size={80} color={selectedGender === "Male" ? "#FFFFFF" : "#777777"} />
            <Text style={[styles.genderText, selectedGender === "Male" && styles.selectedGenderText]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectGender("Female")}
            style={[styles.genderButton, selectedGender === "Female" && styles.selectedButton]}
          >
            <Ionicons name="woman" size={80} color={selectedGender === "Female" ? "#FFFFFF" : "#777777"} />
            <Text style={[styles.genderText, selectedGender === "Female" && styles.selectedGenderText]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        {selectedGender && (
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  genderButton: {
    alignItems: "center",
    backgroundColor: "#EEEEEE",
    borderRadius: 12,
    padding: 16,
    width: "45%",
  },
  selectedButton: {
    backgroundColor: "#4BD4A2",
  },
  genderText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
    marginTop: 10,
  },
  selectedGenderText: {
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
})

export default GenderSelection