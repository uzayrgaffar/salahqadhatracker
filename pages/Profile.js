import { useState, useEffect, useContext } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Alert, ScrollView, Modal, TextInput } from "react-native"
import { useNavigation } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { AppContext } from "../AppContext"
import Icon from "react-native-vector-icons/Ionicons"

const Profile = () => {
  const navigation = useNavigation()
  const { madhab, setMadhab } = useContext(AppContext)
  const [gender, setGender] = useState("")
  const [userDocRef, setUserDocRef] = useState(null)
  const [email, setEmail] = useState("")
  const [isReAuthVisible, setIsReAuthVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

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
    const user = auth().currentUser;
    if (!user) return;

    if (user.isAnonymous) {
      Alert.alert(
        "Delete Account",
        "Are you sure? All your data will be permanently lost and cannot be recovered.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Delete", 
            style: "destructive", 
            onPress: () => executeDeletion() 
          }
        ]
      );
      return;
    } 

    setIsReAuthVisible(true);
  };

  const executeDeletion = async () => {
    if (!auth().currentUser?.isAnonymous && !password.trim()) {
      Alert.alert("Error", "Please enter your password to continue.");
      return;
    }

    try {
      setLoading(true);
      const user = auth().currentUser;
      if (!user) {
        Alert.alert("Error", "No active session found. Please log in again.");
        return;
      }

      if (!user.isAnonymous) {
        const credential = auth.EmailAuthProvider.credential(user.email, password);
        await user.reauthenticateWithCredential(credential);
      }

      const userId = user.uid;
      const userDocRef = firestore().collection("users").doc(userId);
      const dailyPrayersRef = firestore().collection("users").doc(userId).collection("dailyPrayers");
      const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");

      const querySnapshot = await dailyPrayersRef.get();
      const batch = firestore().batch();
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      await totalQadhaRef.delete();
      await userDocRef.delete();

      setUserDocRef(null);
      setIsReAuthVisible(false);
      setPassword("");

      await user.delete();

      Alert.alert(
        "Success", 
        "Your account and all data have been permanently deleted.",
        [{
          text: "OK",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "SelectLanguage" }],
            });
          }
        }]
      );

    } catch (error) {
      console.error("Deletion Error:", error.code, error.message);

      let errorTitle = "Deletion Failed";
      let errorMessage = "An unexpected error occurred. Please try again.";

      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
          errorTitle = "Invalid Password";
          errorMessage = "The password you entered is incorrect. Please try again.";
          break;
          
        case 'auth/network-request-failed':
          errorTitle = "Network Error";
          errorMessage = "Please check your internet connection and try again.";
          break;

        case 'auth/too-many-requests':
          errorTitle = "Too Many Attempts";
          errorMessage = "This account has been temporarily disabled due to many failed attempts. Try again later.";
          break;

        case 'auth/requires-recent-login':
          errorTitle = "Security Timeout";
          errorMessage = "For security, please sign out and sign back in before deleting your account.";
          break;

        default:
          errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
        >
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

      <Modal visible={isReAuthVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Password</Text>
            <Text style={styles.modalSub}>Please enter your password to delete your account.</Text>
            
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Password"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                value={password}
                onChangeText={setPassword}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity 
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon 
                  name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]} 
                onPress={() => {
                  setIsReAuthVisible(false);
                  setPassword("");
                  setIsPasswordVisible(false);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.deleteBtn]} 
                onPress={executeDeletion}
                disabled={loading || !password}
              >
                <Text style={styles.deleteBtnText}>
                  {loading ? "Deleting..." : "Confirm Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#5CB390",
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
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#5CB390",
    alignItems: "center",
    justifyContent: "center",
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
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 20,
    paddingRight: 15,
  },
  modalInput: {
    flex: 1,
    padding: 12,
    color: '#000',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  deleteBtn: {
    backgroundColor: '#DC143C',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  deleteBtnText: {
    color: '#FFF',
    fontWeight: '600',
  }
})

export default Profile