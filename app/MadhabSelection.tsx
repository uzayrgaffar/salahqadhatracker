import { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Alert } from "react-native"
import { AppContext } from "../AppContext"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router"

const MadhabSelection = () => {
  const router = useRouter()
  const { setMadhab, yearsMissed } = useContext(AppContext)
  const [selectedMadhab, setSelectedMadhab] = useState(null)
  const insets = useSafeAreaInsets();

  const selectMadhab = (madhab) => {
    setSelectedMadhab(madhab)
  }

  const handleConfirm = async () => {
    if (!selectedMadhab) return;

    try {
      const user = auth().currentUser;
      if (!user) return;
      const userId = user.uid;
      const userDocRef = firestore().collection("users").doc(userId);
      
      const userDoc = await userDocRef.get();
      const userData = userDoc.data();

      const hasCalculationData = userData?.dob && userData?.dop;

      await userDocRef.set({
        madhab: selectedMadhab,
        setupComplete: true,
      }, { merge: true });

      setMadhab(selectedMadhab);

      if (!hasCalculationData || !yearsMissed || yearsMissed === 0) {
        const totalQadhaRef = firestore()
          .collection("users")
          .doc(userId)
          .collection("totalQadha")
          .doc("qadhaSummary");

        await totalQadhaRef.set({
          fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0,
        }, { merge: true });

        router.push("/Totals")
      } else {
        router.push("/SetQadhaSalah")
      }
    } catch (error) {
      console.error("Madhab Confirm Error:", error);
      Alert.alert("Error", "Could not save your selection. Please check your connection.");
    }
  };

  const madhabOptions = ["Hanafi", "Maliki", "Shafi'i", "Hanbali"]

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select Madhab</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Please select your Madhab:</Text>
        <View style={styles.buttonContainer}>
          {madhabOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.madhabButton, selectedMadhab === option && styles.selectedMadhabButton]}
              onPress={() => selectMadhab(option)}
            >
              <Text style={[styles.madhabButtonText, selectedMadhab === option && styles.selectedMadhabButtonText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        {selectedMadhab && (
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
    alignItems: "center",
  },
  madhabButton: {
    backgroundColor: "#EEEEEE",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginBottom: 12,
  },
  selectedMadhabButton: {
    backgroundColor: "#4BD4A2",
  },
  madhabButtonText: {
    fontSize: 16,
    color: "#777777",
    fontWeight: "500",
  },
  selectedMadhabButtonText: {
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

export default MadhabSelection