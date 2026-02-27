import { useState, useEffect, useContext } from "react"
import { View, TouchableOpacity, StyleSheet, Text, Alert, ScrollView, Modal, TextInput, Linking, Platform } from "react-native"
import { useNavigation } from "@react-navigation/native"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import messaging from "@react-native-firebase/messaging"
import { AppContext } from "../AppContext"
import Icon from "react-native-vector-icons/Ionicons"
import * as Location from "expo-location"
import * as Notifications from "expo-notifications"

const getMethodByCountry = (countryCode) => {
  switch (countryCode) {
    case "SA": return 4;
    case "PK": case "IN": case "BD": case "AF": return 1;
    case "US": case "CA": return 2;
    case "GB": case "IE": return 15;
    case "EG": return 5;
    case "TR": return 13;
    case "MY": return 17;
    case "ID": return 20;
    case "MA": return 21;
    case "JO": return 23;
    case "FR": return 12;
    case "RU": return 14;
    default: return 3;
  }
};

const METHODS = [
  { id: 1,  name: "University of Islamic Sciences, Karachi", region: "Pakistan, India, Bangladesh, Afghanistan" },
  { id: 2,  name: "Islamic Society of North America (ISNA)", region: "USA, Canada" },
  { id: 3,  name: "Muslim World League", region: "Global Default" },
  { id: 4,  name: "Umm Al-Qura University, Makkah", region: "Saudi Arabia" },
  { id: 5,  name: "Egyptian General Authority of Survey", region: "Egypt" },
  { id: 12, name: "Union des Mosquées de France", region: "France" },
  { id: 13, name: "Diyanet İşleri Başkanlığı", region: "Turkey" },
  { id: 14, name: "Spiritual Administration of Muslims of Russia", region: "Russia" },
  { id: 15, name: "Moonsighting Committee Worldwide", region: "UK, Ireland" },
  { id: 17, name: "JAKIM", region: "Malaysia" },
  { id: 20, name: "Kemenag", region: "Indonesia" },
  { id: 21, name: "Moroccan Ministry of Habous and Islamic Affairs", region: "Morocco" },
  { id: 23, name: "Jordan", region: "Jordan" },
];

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
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);
  const [method, setMethod] = useState(null);
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [countryCode, setCountryCode] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth().onAuthStateChanged((user) => {
      if (user) {
        setEmail(user.email)
        const docRef = firestore().collection("users").doc(user.uid)
        setUserDocRef(docRef)
        docRef.get().then((docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data()
            setGender(data.gender || "")
            setMadhab(data.madhab || "")
            setMethod(data.method || null)
            setCountryCode(data.countryCode || null)
          }
        })
      } else {
        navigation.replace("SelectLanguage")
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    checkCurrentPermissions();
  }, []);

  const checkCurrentPermissions = async () => {
    setCheckingPermissions(true);
    try {
      const { status: locStatus } = await Location.getForegroundPermissionsAsync();
      const locGranted = locStatus === "granted";
      setLocationEnabled(locGranted);

      if (locGranted) {
        const { status: notifStatus } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(notifStatus === "granted");
      } else {
        setNotificationsEnabled(false);
      }
    } catch (e) {
      console.error("Permission check error:", e);
    } finally {
      setCheckingPermissions(false);
    }
  };

  const handleLocationToggle = async () => {
    if (locationEnabled) {
      Alert.alert(
        "Disable Location",
        "To turn off location access, please go to your device Settings. You will lose access to salah times, notifications and qiblah direction if you disable location.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: async () => {
              const user = auth().currentUser;
              if (user) {
                await firestore().collection("users").doc(user.uid).update({
                  latitude: firestore.FieldValue.delete(),
                  longitude: firestore.FieldValue.delete(),
                  timezone: firestore.FieldValue.delete(),
                  countryCode: firestore.FieldValue.delete(),
                  method: firestore.FieldValue.delete(),
                });
                setCountryCode(null);
              }
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    } else {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      if (status === "denied" && !canAskAgain) {
        Alert.alert(
          "Location Permission Required",
          "Please enable location access in Settings to see prayer times and receive notifications.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      } else {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        const granted = newStatus === "granted";
        setLocationEnabled(granted);
        if (!granted) {
          setNotificationsEnabled(false);
        } else {
          try {
            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const rawLat = loc.coords.latitude;
            const rawLng = loc.coords.longitude;

            const reverseResult = await Location.reverseGeocodeAsync({ latitude: rawLat, longitude: rawLng });
            const newCountryCode = reverseResult[0]?.isoCountryCode || "DEFAULT";
            const newMethod = getMethodByCountry(newCountryCode);
            const roundedLat = parseFloat(rawLat.toFixed(1));
            const roundedLng = parseFloat(rawLng.toFixed(1));

            const user = auth().currentUser;
            if (user) {
              await firestore().collection("users").doc(user.uid).set({
                latitude: roundedLat,
                longitude: roundedLng,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                countryCode: newCountryCode,
                method: newMethod,
              }, { merge: true });

              setCountryCode(newCountryCode);
              setMethod(newMethod);
            }
          } catch (e) {
            console.error("Failed to restore location data:", e);
          }
        }
      }
    }
  };

  const handleNotificationToggle = async () => {
    if (notificationsEnabled) {
      Alert.alert(
        "Disable Notifications",
        "To turn off notifications, please go to your device Settings.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Open Settings",
            onPress: async () => {
              const user = auth().currentUser;
              if (user) {
                await firestore().collection("users").doc(user.uid).update({
                  fcmToken: firestore.FieldValue.delete(),
                });
              }
              if (Platform.OS === "ios") {
                Linking.openURL("app-settings:");
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    } else {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === "denied") {
        Alert.alert(
          "Notification Permission Required",
          "Please enable notifications in Settings to receive prayer time reminders.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === "ios") {
                  Linking.openURL("app-settings:");
                } else {
                  Linking.openSettings();
                }
              },
            },
          ]
        );
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        const granted = status === "granted";
        setNotificationsEnabled(granted);
        if (granted) {
          try {
            const token = await messaging().getToken();
            const user = auth().currentUser;
            if (user) {
              await firestore().collection("users").doc(user.uid).update({ fcmToken: token });
            }
          } catch (e) {
            console.error("Failed to restore FCM token:", e);
          }
        }
      }
    }
  };

  const selectMadhab = async (newMadhab) => {
    if (!userDocRef) return
    try {
      await userDocRef.update({ madhab: newMadhab })
      setMadhab(newMadhab)
    } catch (error) {
      Alert.alert("Error", "Failed to update madhab")
    }
  }

  const selectMethod = async (newMethod) => {
    if (!userDocRef) return
    try {
      await userDocRef.update({ method: newMethod })
      setMethod(newMethod)
    } catch (error) {
      Alert.alert("Error", "Failed to update calculation method")
    }
  }

  const showConfirmation = () => {
    Alert.alert(
      "Confirmation",
      `Are you sure you want to setup your account again? This will delete your daily salah and qadha history`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            const user = auth().currentUser;
            if (user) {
              try {
                const dailyPrayersRef = firestore()
                  .collection("users")
                  .doc(user.uid)
                  .collection("dailyPrayers");
                const querySnapshot = await dailyPrayersRef.get();
                const batch = firestore().batch();
                querySnapshot.forEach((doc) => {
                  batch.delete(doc.ref);
                });
                await batch.commit();
              } catch (error) {
                console.error("Failed to delete dailyPrayers:", error);
              }
            }
            navigation.navigate("Setup");
          },
        },
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

  const PermissionRow = ({ icon, label, description, enabled, onToggle, disabled }) => (
    <View style={[styles.permissionRow, disabled && styles.permissionRowDisabled]}>
      <View style={styles.permissionRowLeft}>
        <View style={[styles.permissionIcon, enabled && styles.permissionIconActive, disabled && styles.permissionIconDisabled]}>
          <Icon name={icon} size={18} color={disabled ? "#D1D5DB" : enabled ? "#5CB390" : "#9CA3AF"} />
        </View>
        <View style={styles.permissionTextBlock}>
          <Text style={[styles.permissionLabel, disabled && styles.permissionLabelDisabled]}>{label}</Text>
          <Text style={[styles.permissionDescription, disabled && styles.permissionDescriptionDisabled]}>{description}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={disabled ? undefined : onToggle}
        activeOpacity={disabled ? 1 : 0.7}
        style={[styles.toggleTrack, enabled && !disabled ? styles.toggleTrackOn : styles.toggleTrackOff, disabled && styles.toggleTrackDisabled]}
      >
        <View style={[styles.toggleThumb, enabled && !disabled ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.navigate("QiblahCompass")}
            style={{ position: 'absolute', left: 25, top: 65 }}
          >
            <Icon name="compass" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {email ? email.charAt(0).toUpperCase() : "A"}
              </Text>
            </View>
            <Text style={styles.emailText}>{email || "Anonymous Account"}</Text>
          </View>

          {/* Permissions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Permissions</Text>
            <Text style={styles.sectionDescription}>Manage location and notification access</Text>

            <View style={styles.permissionsCard}>
              <PermissionRow
                icon="location-outline"
                label="Location"
                description="Required for accurate prayer times"
                enabled={locationEnabled}
                onToggle={handleLocationToggle}
                disabled={checkingPermissions}
              />

              <View style={styles.permissionDivider} />

              <PermissionRow
                icon="notifications-outline"
                label="Notifications"
                description={locationEnabled ? "Get reminded at each prayer time" : "Enable location first"}
                enabled={notificationsEnabled}
                onToggle={handleNotificationToggle}
                disabled={checkingPermissions || !locationEnabled}
              />
            </View>
          </View>

          {/* Madhab Section */}
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

          {/* Calculation Method Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Salah Time Method</Text>
            
            {locationEnabled && (
              <Text style={styles.sectionDescription}>
                <Text style={{ fontWeight: "600", color: "#5CB390" }}>
                  {countryCode ? METHODS.find(m => m.id === getMethodByCountry(countryCode))?.name : "Not set"}
                </Text>
                {" "}is the default for your location - change it here if needed.
              </Text>
            )}
            
            {!locationEnabled && (
              <Text style={{ fontSize: 12, color: "#DC2626", marginBottom: 12 }}>
                Enable location to change your calculation method
              </Text>
            )}

            <View style={[!locationEnabled && { opacity: 0.4 }]}>
              <TouchableOpacity
                style={[styles.dropdownButton, methodDropdownOpen && styles.dropdownButtonOpen]}
                onPress={() => locationEnabled && setMethodDropdownOpen(prev => !prev)}
                activeOpacity={locationEnabled ? 0.7 : 1}
              >
                <View style={styles.dropdownButtonLeft}>
                  <Icon name="calculator-outline" size={18} color="#5CB390" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.dropdownButtonText}>
                      {method ? METHODS.find(m => m.id === method)?.name : "Select a method"}
                    </Text>
                    {method && (
                      <Text style={styles.dropdownButtonRegion}>
                        {METHODS.find(m => m.id === method)?.region}
                      </Text>
                    )}
                  </View>
                </View>
                <Icon
                  name={methodDropdownOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              {methodDropdownOpen && locationEnabled && (
                <View style={styles.dropdownList}>
                  {METHODS.map((m, index) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        styles.dropdownItem,
                        method === m.id && styles.dropdownItemSelected,
                        index < METHODS.length - 1 && styles.dropdownItemBorder,
                      ]}
                      onPress={() => {
                        selectMethod(m.id);
                        setMethodDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.dropdownItemText}>
                        <Text style={[styles.dropdownItemName, method === m.id && styles.dropdownItemNameSelected]}>
                          {m.name}
                        </Text>
                        <Text style={[styles.dropdownItemRegion, method === m.id && styles.dropdownItemRegionSelected]}>
                          {m.region}
                        </Text>
                      </View>
                      {method === m.id && (
                        <Icon name="checkmark" size={18} color="#5CB390" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
                  {loading ? "Deleting..." : "Delete"}
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
    marginBottom: 12,
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
  permissionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
  },
  permissionRowDisabled: {
    opacity: 0.5,
  },
  permissionRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  permissionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  permissionIconActive: {
    backgroundColor: "#E8F8F3",
  },
  permissionIconDisabled: {
    backgroundColor: "#F3F4F6",
  },
  permissionTextBlock: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  permissionLabelDisabled: {
    color: "#9CA3AF",
  },
  permissionDescription: {
    fontSize: 13,
    color: "#6B7280",
  },
  permissionDescriptionDisabled: {
    color: "#D1D5DB",
  },
  permissionDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginHorizontal: 18,
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    padding: 3,
  },
  toggleTrackOn: {
    backgroundColor: "#5CB390",
  },
  toggleTrackOff: {
    backgroundColor: "#E5E7EB",
  },
  toggleTrackDisabled: {
    backgroundColor: "#E5E7EB",
  },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  toggleThumbOff: {
    alignSelf: "flex-start",
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
    marginTop: 1,
    flexShrink: 0,
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
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  dropdownButtonOpen: {
    borderColor: "#5CB390",
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  dropdownButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  dropdownButtonRegion: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderTopWidth: 0,
    borderColor: "#5CB390",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemSelected: {
    backgroundColor: "#E8F8F3",
  },
  dropdownItemText: {
    flex: 1,
    marginRight: 8,
  },
  dropdownItemName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4B5563",
  },
  dropdownItemNameSelected: {
    color: "#1F2937",
    fontWeight: "600",
  },
  dropdownItemRegion: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  dropdownItemRegionSelected: {
    color: "#5CB390",
  },
})

export default Profile