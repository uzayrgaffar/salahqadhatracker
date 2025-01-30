import { useContext, useState } from "react"
import { View, TouchableOpacity, StyleSheet, Text } from "react-native"
import { AppContext } from "../AppContext"
import { useNavigation } from "@react-navigation/native"

const MadhabSelection = () => {
  const navigation = useNavigation()
  const { madhab, setMadhab, selectedLanguage, dop } = useContext(AppContext)
  const [selectedMadhab, setSelectedMadhab] = useState(null)

  const selectMadhab = (madhab) => {
    setSelectedMadhab(madhab)
  }

  const handleConfirm = () => {
    if (selectedMadhab) {
      setMadhab(selectedMadhab)
      navigation.navigate("SetQadhaSalah")
    }
  }

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

      <View style={styles.bottomContainer}>
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

export default MadhabSelection