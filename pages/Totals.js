// import React, { useContext, useEffect, useState, useCallback } from "react";
// import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Keyboard, StatusBar } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { AppContext } from "../AppContext";
// import { doc, getDoc, updateDoc } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { db } from "../FirebaseConfig";

// const Totals = () => {
//   const navigation = useNavigation();
//   const { madhab } = useContext(AppContext);
//   const [qadhaCounts, setQadhaCounts] = useState({
//     Fajr: 0,
//     Dhuhr: 0,
//     Asr: 0,
//     Maghrib: 0,
//     Isha: 0,
//     Witr: madhab === "Hanafi" ? 0 : null, 
//   });
//   const [isLoading, setIsLoading] = useState(true);

//   // Memoized fetch function to prevent unnecessary re-renders
//   const fetchQadhaCounts = useCallback(async () => {
//     try {
//       setIsLoading(true);
//       const auth = getAuth();
//       const user = auth.currentUser;
//       if (user) {
//         const userId = user.uid;
//         const qadhaDocRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
//         const qadhaDoc = await getDoc(qadhaDocRef);
        
//         if (qadhaDoc.exists()) {
//           const data = qadhaDoc.data();
//           const newCounts = {
//             Fajr: data.fajr || 0,
//             Dhuhr: data.dhuhr || 0,
//             Asr: data.asr || 0,
//             Maghrib: data.maghrib || 0,
//             Isha: data.isha || 0,
//             ...(madhab === "Hanafi" ? { Witr: data.witr || 0 } : {}),
//           };
          
//           setQadhaCounts(newCounts);
//         }
//       }
//     } catch (error) {
//       console.error("Error fetching Qadha counts:", error);
//       Alert.alert("Error", "Unable to fetch Qadha counts. Please try again.");
//     } finally {
//       setIsLoading(false);
//     }
//   }, [madhab]);

//   // Fetch counts on component mount and when madhab changes
//   useEffect(() => {
//     fetchQadhaCounts();
//   }, [fetchQadhaCounts]);

//   // Improved adjustQadha method with error handling
//   const adjustQadha = async (salah, newValue) => {
//     try {
//       const numValue = parseInt(newValue, 10) || 0;
//       const safeValue = Math.max(0, numValue);
      
//       // Optimistic UI update
//       setQadhaCounts((prev) => ({ ...prev, [salah]: safeValue }));

//       const auth = getAuth();
//       const user = auth.currentUser;
//       if (user) {
//         const userId = user.uid;
//         const qadhaDocRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
        
//         await updateDoc(qadhaDocRef, { 
//           [salah.toLowerCase()]: safeValue 
//         });
//       }
//     } catch (error) {
//       console.error("Error updating Qadha count:", error);
//       Alert.alert("Error", "Failed to update Qadha count. Please try again.");
      
//       // Revert the optimistic update
//       setQadhaCounts((prev) => ({ ...prev, [salah]: qadhaCounts[salah] }));
//     }
//   };

//   const confirmSelection = () => {
//     Keyboard.dismiss();
//     navigation.navigate("MainPages");
//   };

//   // Loading state
//   if (isLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <StatusBar barStyle="light-content" backgroundColor="#5CB390" />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#5CB390" />
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Total Qadha Salah</Text>
//         <Text style={styles.headerSubtitle}>Update your missed prayers</Text>
//       </View>
      
//       <View style={styles.contentContainer}>
//         <View style={styles.card}>
//           <Text style={styles.cardTitle}>
//             Prayer Counts
//           </Text>
//           <Text style={styles.cardDescription}>
//             Adjust the number of each prayer you need to make up
//           </Text>

//           <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
//             {Object.entries(qadhaCounts).map(([salah, count], index) =>
//               count !== null ? (
//                 <View key={salah} style={[
//                   styles.prayerItem,
//                   index === Object.entries(qadhaCounts).length - 1 && { borderBottomWidth: 0 }
//                 ]}>
//                   <View style={styles.prayerInfo}>
//                     <View style={[styles.prayerDot, { backgroundColor: getPrayerColor(salah) }]} />
//                     <Text style={styles.prayerName}>
//                       {salah.charAt(0).toUpperCase() + salah.slice(1)}
//                     </Text>
//                   </View>
//                   <View style={styles.inputContainer}>
//                     <TouchableOpacity 
//                       style={styles.counterButton}
//                       onPress={() => adjustQadha(salah, Math.max(0, parseInt(count, 10) - 1))}
//                     >
//                       <Text style={styles.counterButtonText}>−</Text>
//                     </TouchableOpacity>
//                     <TextInput
//                       style={styles.counterInput}
//                       keyboardType="numeric"
//                       value={String(count)}
//                       onChangeText={(text) => adjustQadha(salah, text)}
//                     />
//                     <TouchableOpacity 
//                       style={styles.counterButton}
//                       onPress={() => adjustQadha(salah, parseInt(count, 10) + 1)}
//                     >
//                       <Text style={styles.counterButtonText}>+</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>
//               ) : null
//             )}
//           </ScrollView>

//           <TouchableOpacity
//             style={styles.confirmButton}
//             onPress={confirmSelection}
//           >
//             <Text style={styles.confirmButtonText}>Save Changes</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </View>
//   );
// };

// // Helper function to get a unique color for each prayer
// const getPrayerColor = (prayer) => {
//   const colors = {
//     Fajr: "#FF725C",    // Coral
//     Dhuhr: "#FFB700",   // Amber
//     Asr: "#19A974",     // Green
//     Maghrib: "#357EDD", // Blue
//     Isha: "#5E2CA5",    // Purple
//     Witr: "#FF6300"     // Orange
//   };
  
//   return colors[prayer] || "#5CB390";
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#5CB390",
//   },
//   loadingContainer: {
//     flex: 1,
//     backgroundColor: "#5CB390",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "600",
//   },
//   header: {
//     paddingTop: 60,
//     paddingBottom: 30,
//     paddingHorizontal: 24,
//   },
//   headerTitle: {
//     fontSize: 32,
//     fontWeight: "700",
//     color: "#FFFFFF",
//     marginBottom: 8,
//   },
//   headerSubtitle: {
//     fontSize: 16,
//     color: "rgba(255, 255, 255, 0.8)",
//     fontWeight: "500",
//   },
//   contentContainer: {
//     flex: 1,
//     backgroundColor: "#F7F9FC",
//     borderTopLeftRadius: 30,
//     borderTopRightRadius: 30,
//     paddingTop: 24,
//     paddingHorizontal: 20,
//     paddingBottom: 30,
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 20,
//     padding: 24,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 12,
//     elevation: 8,
//     flex: 1,
//   },
//   cardTitle: {
//     fontSize: 22,
//     fontWeight: "700",
//     color: "#333333",
//     marginBottom: 8,
//   },
//   cardDescription: {
//     fontSize: 14,
//     color: "#777777",
//     marginBottom: 24,
//   },
//   scrollView: {
//     marginBottom: 24,
//   },
//   prayerItem: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: "#F0F0F0",
//   },
//   prayerInfo: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   prayerDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//     marginRight: 12,
//   },
//   prayerName: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333333",
//   },
//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   counterButton: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: "#F0F0F0",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   counterButtonText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#5CB390",
//   },
//   counterInput: {
//     width: 50,
//     height: 40,
//     borderRadius: 8,
//     backgroundColor: "#FFFFFF",
//     borderWidth: 1,
//     borderColor: "#E0E0E0",
//     textAlign: "center",
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#333333",
//     marginHorizontal: 8,
//   },
//   confirmButton: {
//     backgroundColor: "#5CB390",
//     borderRadius: 12,
//     height: 56,
//     justifyContent: "center",
//     alignItems: "center",
//     shadowColor: "#5CB390",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     elevation: 6,
//   },
//   confirmButtonText: {
//     color: "#FFFFFF",
//     fontSize: 18,
//     fontWeight: "700",
//   },
// });

// export default Totals;

import React, { useContext, useEffect, useState, useCallback } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  TextInput,
  Keyboard,
  StatusBar
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";

const Totals = () => {
  const navigation = useNavigation();
  const { madhab } = useContext(AppContext);
  const [qadhaCounts, setQadhaCounts] = useState({
    Fajr: 0,
    Dhuhr: 0,
    Asr: 0,
    Maghrib: 0,
    Isha: 0,
    Witr: madhab === "Hanafi" ? 0 : null, 
  });
  const [isLoading, setIsLoading] = useState(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchQadhaCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const qadhaDocRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
        const qadhaDoc = await getDoc(qadhaDocRef);
        
        if (qadhaDoc.exists()) {
          const data = qadhaDoc.data();
          const newCounts = {
            Fajr: data.fajr || 0,
            Dhuhr: data.dhuhr || 0,
            Asr: data.asr || 0,
            Maghrib: data.maghrib || 0,
            Isha: data.isha || 0,
            ...(madhab === "Hanafi" ? { Witr: data.witr || 0 } : {}),
          };
          
          setQadhaCounts(newCounts);
        }
      }
    } catch (error) {
      console.error("Error fetching Qadha counts:", error);
      Alert.alert("Error", "Unable to fetch Qadha counts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [madhab]);

  useEffect(() => {
    fetchQadhaCounts();
  }, [fetchQadhaCounts]);

  // Improved adjustQadha method with error handling
  const adjustQadha = async (salah, newValue) => {
    try {
      const numValue = parseInt(newValue, 10) || 0;
      const safeValue = Math.max(0, numValue);
      
      // Optimistic UI update
      setQadhaCounts((prev) => ({ ...prev, [salah]: safeValue }));

      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const qadhaDocRef = doc(db, "users", userId, "totalQadha", "qadhaSummary");
        
        await updateDoc(qadhaDocRef, { 
          [salah.toLowerCase()]: safeValue 
        });
      }
    } catch (error) {
      console.error("Error updating Qadha count:", error);
      Alert.alert("Error", "Failed to update Qadha count. Please try again.");
      
      setQadhaCounts((prev) => ({ ...prev, [salah]: qadhaCounts[salah] }));
    }
  };

  const confirmSelection = () => {
    Keyboard.dismiss();
    navigation.replace("MainPages");
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#5CB390" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5CB390" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Total Qadha Salah</Text>
      </View>
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Feel free to adjust your Qadha Salah totals as needed. You can revisit this page anytime from the progress page.
          </Text>

          {Object.entries(qadhaCounts).map(([salah, count], index) =>
            count !== null ? (
              <View key={salah} style={[
                styles.prayerItem,
                index === Object.entries(qadhaCounts).length - 1 && { borderBottomWidth: 0 }
              ]}>
                <Text style={styles.prayerName}>
                  {salah.charAt(0).toUpperCase() + salah.slice(1)}:
                </Text>
                <TextInput
                  style={styles.counterInput}
                  keyboardType="numeric"
                  value={String(count)}
                  onChangeText={(text) => adjustQadha(salah, text)}
                />
              </View>
            ) : null
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmSelection}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5CB390",
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
    marginBottom: 20,
    textAlign: "center",
  },
  prayerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  prayerName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#777777",
  },
  counterInput: {
    width: 60,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#5CB390",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    color: "#5CB390",
    paddingHorizontal: 8,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: "#5CB390",
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
});

export default Totals;