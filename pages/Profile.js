import { useState, useEffect } from "react"
import { View, TouchableOpacity, StyleSheet, Text, ScrollView, SafeAreaView, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { ChevronRight } from "lucide-react-native"
import { auth, db } from "../FirebaseConfig"
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { onAuthStateChanged, deleteUser } from "firebase/auth"

const Profile = () => {
  const navigation = useNavigation()
  const [gender, setGender] = useState("")
  const [madhab, setMadhab] = useState("")
  const [userDocRef, setUserDocRef] = useState(null)

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const docRef = doc(db, "users", user.uid)
        setUserDocRef(docRef)
        // Fetch user data
        getDoc(docRef).then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setGender(data.gender || "")
            setMadhab(data.madhab || "")
          }
        })
      } else {
        navigation.navigate("SelectLanguage")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const selectGender = async (newGender) => {
    if (!userDocRef) return
    try {
      await updateDoc(userDocRef, { gender: newGender })
      setGender(newGender)
    } catch (error) {
      Alert.alert("Error", "Failed to update gender")
    }
  }

  const selectMadhab = async (newMadhab) => {
    if (!userDocRef) return
    try {
      await updateDoc(userDocRef, { madhab: newMadhab })
      setMadhab(newMadhab)
    } catch (error) {
      Alert.alert("Error", "Failed to update madhab")
    }
  }

  const showConfirmation = () => {
    Alert.alert(
      "Confirmation",
      `You have selected:
      
      Gender: ${gender}
      Madhab: ${madhab}
      
      You can change these selections later at any time. Are you sure you want to advance?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => navigation.navigate("SetQadhaSalah") }
      ]
    )
  }

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account and all associated data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              const user = auth.currentUser
              if (user && userDocRef) {
                await deleteDoc(userDocRef)
                await deleteUser(user)
                Alert.alert("Account Deleted", "Your account and all data have been successfully deleted.")
                navigation.navigate("SelectLanguage")
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete account. Please try again.")
            }
          },
          style: "destructive"
        }
      ]
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.content}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gender</Text>
              <View style={styles.optionsContainer}>
                {["Male", "Female"].map((gen) => (
                  <TouchableOpacity
                    key={gen}
                    style={[styles.option, gender === gen && styles.selectedOption]}
                    onPress={() => selectGender(gen)}
                  >
                    <Text style={[styles.optionText, gender === gen && styles.selectedOptionText]}>{gen}</Text>
                    {gender === gen && <ChevronRight color="#FFFFFF" size={20} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Madhab</Text>
              <View style={styles.optionsContainer}>
                {["Hanafi", "Maliki", "Shafi'i", "Hanbali"].map((mad) => (
                  <TouchableOpacity
                    key={mad}
                    style={[styles.option, madhab === mad && styles.selectedOption]}
                    onPress={() => selectMadhab(mad)}
                  >
                    <Text style={[styles.optionText, madhab === mad && styles.selectedOptionText]}>{mad}</Text>
                    {madhab === mad && <ChevronRight color="#FFFFFF" size={20} />}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.qadhaButton, !(gender && madhab) && styles.disabledQadhaButton]}
              disabled={!(gender && madhab)}
              onPress={showConfirmation}
            >
              <Text style={styles.qadhaButtonText}>Reset Qadha Salah</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qadhaButton2}
              onPress={() => {
                Alert.alert(
                  "Sign Out",
                  "Are you sure you want to sign out?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Yes", onPress: () => auth.signOut() }
                  ]
                )
              }}
            >
              <Text style={styles.qadhaButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.qadhaButton3}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.qadhaButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5CB390",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  selectedOption: {
    backgroundColor: "#4BD4A2",
  },
  optionText: {
    fontSize: 16,
    color: "#777777",
  },
  selectedOptionText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  qadhaButton: {
    backgroundColor: "#FBC742",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  qadhaButton2: {
    backgroundColor: "red",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  qadhaButton3: {
    backgroundColor: "crimson",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  disabledQadhaButton: {
    backgroundColor: "#EEEEEE",
  },
  qadhaButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
})

export default Profile