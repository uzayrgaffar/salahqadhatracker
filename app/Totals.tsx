import { useContext, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Keyboard, StatusBar } from "react-native";
import { AppContext } from "../AppContext";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from "expo-router";
import Icon from "react-native-vector-icons/Ionicons";

const Totals = () => {
  const router = useRouter()
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
          const newCounts: any = {
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

  const adjustQadha = async (salah, amount) => {
    try {
      const current = qadhaCounts[salah] ?? 0;
      const newValue = Math.max(0, current + amount);

      setQadhaCounts((prev) => ({ ...prev, [salah]: newValue }));

      const user = auth().currentUser;
      if (user) {
        const userId = user.uid;
        const qadhaDocRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
        await qadhaDocRef.set({ [salah.toLowerCase()]: newValue }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating Qadha count:", error);
      Alert.alert("Error", "Failed to update Qadha count. Please try again.");
      setQadhaCounts((prev) => ({ ...prev, [salah]: qadhaCounts[salah] }));
    }
  };

  const handleTextChange = async (salah, text) => {
    const numValue = parseInt(text, 10) || 0;
    const safeValue = Math.max(0, numValue);

    setQadhaCounts((prev) => ({ ...prev, [salah]: safeValue }));

    const user = auth().currentUser;
    if (user) {
      const userId = user.uid;
      const qadhaDocRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
      await qadhaDocRef.set({ [salah.toLowerCase()]: safeValue }, { merge: true });
    }
  };

  const getPrayerIcon = (prayer) => {
    const icons = {
      Fajr: "sunny-outline",
      Dhuhr: "partly-sunny-outline",
      Asr: "sunny-outline",
      Maghrib: "moon-outline",
      Isha: "moon-outline",
      Witr: "moon-outline",
    }
    return icons[prayer] || "checkmark-circle-outline"
  }

  const totalRemaining = Object.values(qadhaCounts).reduce((sum, v) => sum + (v ?? 0), 0);

  const confirmSelection = () => {
    Keyboard.dismiss();
    router.replace("/DailyChart")
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

      <ScrollView
        style={styles.card}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || 20) + 100 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerLabel}>Total Remaining</Text>
          <Text style={styles.totalBannerValue}>{totalRemaining}</Text>
          <Text style={styles.totalBannerSubtitle}>Adjust your total qadha salah as needed</Text>
        </View>

        <View style={styles.qadhaCountersContainer}>
          {Object.entries(qadhaCounts).map(([salah, count]) =>
            count !== null ? (
              <View key={salah} style={styles.qadhaCounterWrapper}>
                <View style={styles.qadhaLabelContainer}>
                  <View style={styles.qadhaIconContainer}>
                    <Icon name={getPrayerIcon(salah)} size={20} color="#5CB390" />
                  </View>
                  <View>
                    <Text style={styles.qadhaCounterLabel}>{salah}</Text>
                  </View>
                </View>
                <View style={styles.qadhaCounterControls}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => adjustQadha(salah, -1)}
                    activeOpacity={0.7}
                  >
                    <Icon name="remove" size={20} color="#5CB390" />
                  </TouchableOpacity>
                  <TextInput
                    selectTextOnFocus={true}
                    style={styles.qadhaCounterValue}
                    keyboardType="numeric"
                    value={String(count)}
                    onChangeText={(text) => handleTextChange(salah, text)}
                  />
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={() => adjustQadha(salah, 1)}
                    activeOpacity={0.7}
                  >
                    <Icon name="add" size={20} color="#5CB390" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : null
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomContainer, { bottom: (insets.bottom || 20) + 20 }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={confirmSelection}
          activeOpacity={0.8}
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
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    padding: 20,
  },
  totalBanner: {
    backgroundColor: "#E8F8F3",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#5CB390",
  },
  totalBannerLabel: {
    fontSize: 12,
    color: "#5CB390",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  totalBannerValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#2F7F6F",
    marginTop: 4,
    lineHeight: 56,
  },
  totalBannerSubtitle: {
    fontSize: 14,
    color: "#5cb390",
    marginTop: 4,
  },
  qadhaCountersContainer: {
    gap: 12,
  },
  qadhaCounterWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  qadhaLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  qadhaIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  qadhaCounterLabel: {
    fontSize: 16,
    color: "#1F2937",
    fontWeight: "600",
  },
  qadhaCounterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F8F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#5CB390",
  },
  qadhaCounterValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#5CB390",
    minWidth: 50,
    textAlign: "center",
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
});

export default Totals;