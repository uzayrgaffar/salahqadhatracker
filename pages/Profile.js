import { useState, useEffect, useContext } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { AppContext } from "../AppContext"

const Profile = () => {
  const navigation = useNavigation()
  const {madhab, setMadhab} = useContext(AppContext)
  const [gender, setGender] = useState("")
  const [userDocRef, setUserDocRef] = useState(null)
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email)
        const docRef = firestore().collection("users").doc(user.uid)
        setUserDocRef(docRef)
        // Fetch user data
        docRef.get().then((docSnap) => {
          if (docSnap.exists) {
            const data = docSnap.data()
            setGender(data.gender || "")
            setMadhab(data.madhab || "")
          }
        })
      } else {
        navigation.replace("SelectLanguage")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  const selectGender = async (newGender) => {
    if (!userDocRef) return
    try {
      await userDocRef.update({ gender: newGender })
      setGender(newGender)
    } catch (error) {
      Alert.alert("Error", "Failed to update gender")
    }
  }

  const selectMadhab = async (newMadhab) => {
    if (!userDocRef) return
    try {
      await userDocRef.update({ madhab: newMadhab })
      setMadhab(newMadhab)
    } catch (error) {
      Alert.alert("Error", "Failed to update madhab")
    }
  }

  const showConfirmation = () => {
    Alert.alert(
      "Confirmation",
      `Are you sure you want to setup your account again?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => navigation.navigate("SetDOB") }
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
              const user = auth().currentUser;
              if (!user) throw new Error("No authenticated user found");
  
              const userId = user.uid;
              const userDocRef = firestore().collection("users").doc(userId);
              const dailyPrayersRef = firestore().collection("users").doc(userId).collection("dailyPrayers");
              const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
  
              const deleteCollection = async (collectionRef) => {
                const querySnapshot = await collectionRef.get();
                const batch = firestore().batch();
                querySnapshot.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
              };
  
              await deleteCollection(dailyPrayersRef);
              await totalQadhaRef.delete();
              await userDocRef.delete();
              await user.delete();
  
              Alert.alert("Account Deleted", "Your account and all data have been successfully deleted.");
              navigation.replace("SelectLanguage");
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert("Error", "Failed to delete account. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };  

  return (
    <View style={styles.safeArea}>
      <View style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <View style={styles.content}>
          <Text style={styles.emailText}>{email || "Anonymous Account"}</Text>
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
                    {madhab === mad}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.qadhaButton, !(gender && madhab) && styles.disabledQadhaButton]}
              disabled={!(madhab)}
              onPress={showConfirmation}
            >
              <Text style={styles.qadhaButtonText}>Reset Account Setup</Text>
            </TouchableOpacity>

            {auth().currentUser && !auth().currentUser?.isAnonymous && (
              <TouchableOpacity
                style={styles.qadhaButton2}
                onPress={() => {
                  Alert.alert(
                    "Sign Out",
                    "Are you sure you want to sign out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Yes", onPress: () => auth().signOut() }
                    ]
                  )
                }}
              >
                <Text style={styles.qadhaButtonText}>Sign Out</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.qadhaButton3}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.qadhaButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
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
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
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
  emailText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
})

export default Profile