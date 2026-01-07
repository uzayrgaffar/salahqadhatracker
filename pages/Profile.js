import { useState, useEffect, useContext } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Alert, ScrollView } from "react-native"
import { useNavigation } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { AppContext } from "../AppContext"
import Icon from "react-native-vector-icons/Ionicons"

const Profile = () => {
  const navigation = useNavigation()
  const {madhab, setMadhab} = useContext(AppContext)
  const [gender, setGender] = useState("")
  const [userDocRef, setUserDocRef] = useState(null)
  const [email, setEmail] = useState("")

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email)
        const docRef = firestore().collection("users").doc(user.uid)
        setUserDocRef(docRef)
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
              const user = auth().currentUser
              if (!user) throw new Error("No authenticated user found")
  
              const userId = user.uid
              const userDocRef = firestore().collection("users").doc(userId)
              const dailyPrayersRef = firestore().collection("users").doc(userId).collection("dailyPrayers")
              const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary")
  
              const deleteCollection = async (collectionRef) => {
                const querySnapshot = await collectionRef.get()
                const batch = firestore().batch()
                querySnapshot.forEach((doc) => batch.delete(doc.ref))
                await batch.commit()
              }
  
              await deleteCollection(dailyPrayersRef)
              await totalQadhaRef.delete()
              await userDocRef.delete()
              await user.delete()
  
              Alert.alert("Account Deleted", "Your account and all data have been successfully deleted.")
              navigation.replace("SelectLanguage")
            } catch (error) {
              console.error("Error deleting account:", error)
              Alert.alert("Error", "Failed to delete account. Please try again.")
            }
          },
          style: "destructive"
        }
      ]
    )
  }

  return (
    <View style={styles.safeArea}>
      <View style={styles.scrollView}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>
          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Account Info Card */}
          <View style={styles.card}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {email ? email.charAt(0).toUpperCase() : "A"}
                </Text>
              </View>
            </View>
            <Text style={styles.emailText}>{email || "Anonymous Account"}</Text>
          </View>

          {/* Madhab Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Madh'hab Selection</Text>
            <Text style={styles.sectionDescription}>Choose your school of thought</Text>
            
            <View style={styles.optionsGrid}>
              {["Hanafi", "Maliki", "Shafi'i", "Hanbali"].map((mad) => (
                <TouchableOpacity
                  key={mad}
                  style={[styles.optionCard, madhab === mad && styles.selectedOptionCard]}
                  onPress={() => selectMadhab(mad)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radioOuter, madhab === mad && styles.radioOuterSelected]}>
                    {madhab === mad && <View style={styles.radioInner} />}
                  </View>
                  <Text style={[styles.optionCardText, madhab === mad && styles.selectedOptionCardText]}>
                    {mad}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Actions Section */}
          <View style={styles.actionsSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton, !madhab && styles.disabledButton]}
              disabled={!madhab}
              onPress={showConfirmation}
              activeOpacity={0.8}
            >
              <Icon name="refresh-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Reset Account Setup</Text>
            </TouchableOpacity>

            {auth().currentUser && !auth().currentUser?.isAnonymous && (
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
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
                activeOpacity={0.8}
              >
                <Icon name="log-out-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.actionButtonText}>Sign Out</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDeleteAccount}
              activeOpacity={0.8}
            >
              <Icon name="trash-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.actionButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
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
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#5CB390",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#5CB390",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  emailText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#E8F8F3",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#5CB390",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  optionsGrid: {
    gap: 12,
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedOptionCard: {
    backgroundColor: "#E8F8F3",
    borderColor: "#5CB390",
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: "#5CB390",
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#5CB390",
  },
  optionCardText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#4B5563",
  },
  selectedOptionCardText: {
    color: "#1F2937",
    fontWeight: "600",
  },
  actionsSection: {
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  primaryButton: {
    backgroundColor: "#2F7F6F",
  },
  secondaryButton: {
    backgroundColor: "#6B7280",
  },
  dangerButton: {
    backgroundColor: "#DC143C",
  },
  disabledButton: {
    backgroundColor: "#D1D5DB",
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
})

export default Profile