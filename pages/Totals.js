import { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Keyboard, StatusBar } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppContext } from "../AppContext";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchQadhaCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const user = auth().currentUser;
      if (user) {
        const userId = user.uid;
        const qadhaDocRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
        const qadhaDoc = await qadhaDocRef.get();
        
        if (qadhaDoc.exists) {
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
      
      setQadhaCounts((prev) => ({ ...prev, [salah]: safeValue }));

      const user = auth().currentUser;
      if (user) {
        const userId = user.uid;
        const qadhaDocRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
        
        await qadhaDocRef.set({ 
          [salah.toLowerCase()]: safeValue 
        }, { merge: true });
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
                  selectTextOnFocus={true}
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

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
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
});

export default Totals;