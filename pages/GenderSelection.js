import React, { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Image, Text } from "react-native"
import { AppContext } from "../AppContext"
import { useNavigation } from "@react-navigation/native"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const GenderSelection = () => {
  const navigation = useNavigation()
  const { setGender } = useContext(AppContext)
  const [selectedGender, setSelectedGender] = useState(null)

  const selectGender = (gender) => {
    setSelectedGender(gender)
  }

  const handleConfirm = async () => {
    if (selectedGender) {
      setGender(selectedGender);
  
      try {
        const auth = getAuth();
        const user = auth.currentUser;
  
        if (user) {
          const userId = user.uid;
          const userDocRef = doc(db, "users", userId);
  
          const userDoc = await getDoc(userDocRef);
  
          if (userDoc.exists()) {
            // Update existing user document with gender
            await updateDoc(userDocRef, {
              gender: selectedGender,
              updatedAt: new Date(),
            });
          } else {
            // Create a new document if it doesn't exist
            await setDoc(userDocRef, {
              gender: selectedGender,
              createdAt: new Date(),
            });
          }
  
          console.log("Gender saved successfully!");
        } else {
          console.error("No authenticated user found!");
        }
      } catch (error) {
        console.error("Error saving gender:", error);
      }
  
      navigation.navigate(selectedGender === "Female" ? "DaysOfCycle" : "YearsMissed");
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
            <Image source={require("../assets/Male.jpg")} style={styles.genderImage} />
            <Text style={[styles.genderText, selectedGender === "Male" && styles.selectedGenderText]}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => selectGender("Female")}
            style={[styles.genderButton, selectedGender === "Female" && styles.selectedButton]}
          >
            <Image source={require("../assets/Female.jpg")} style={styles.genderImage} />
            <Text style={[styles.genderText, selectedGender === "Female" && styles.selectedGenderText]}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomContainer}>
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
  genderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  genderText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedGenderText: {
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

export default GenderSelection