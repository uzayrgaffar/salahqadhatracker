import { useContext, useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from "react-native"
import { Calendar } from "react-native-calendars"
import { AppContext } from "../AppContext"
import moment from "moment"
import Icon from "react-native-vector-icons/Ionicons"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Location from "expo-location"
import axios from "axios"
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

const DailyChart = () => {
  const { setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr, madhab, setMadhab } = useContext(AppContext)
  
  const insets = useSafeAreaInsets()
  const user = auth().currentUser
  const userId = user ? user.uid : null

  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const [prayerStates, setPrayerStates] = useState({})
  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({})
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isQadhaModalVisible, setIsQadhaModalVisible] = useState(false)
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const locationRef = useRef(null);
  const [monthCache, setMonthCache] = useState({});
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const configureAndroidChannel = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('prayer_times', {
          name: 'Prayer Times',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5CB390',
          sound: 'default', // You can change this to a custom file later
        });
      }
    };

    configureAndroidChannel();
  }, []);

  useEffect(() => {
    if (userId) {
      const fetchMadhab = async () => {
        const userSnap = await firestore().collection("users").doc(userId).get()
  
        if (userSnap.exists) {
          const userData = userSnap.data()
          if (userData.madhab) {
            setMadhab(userData.madhab)
          }
        }
      }
  
      fetchMadhab()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      const fetchPrayerData = async () => {
        const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
        const docSnap = await dailyPrayerRef.get()

        if (docSnap.exists) {
          const data = docSnap.data() || {}

          setPrayerStates(prev => ({
            ...prev,
            [selectedDate]: data.prayers || {
              fajr: false,
              dhuhr: false,
              asr: false,
              maghrib: false,
              isha: false,
              witr: false,
            }
          }))

          lsetDailyPrayerCounts(prev => ({
            ...prev,
            [selectedDate]: data.counts || {
              fajr: 0,
              dhuhr: 0,
              asr: 0,
              maghrib: 0,
              isha: 0,
              witr: 0,
            }
          }))
        } else {
          await dailyPrayerRef.set({
            prayers: {
              fajr: false,
              dhuhr: false,
              asr: false,
              maghrib: false,
              isha: false,
              witr: false,
            },
            counts: {
              fajr: 0,
              dhuhr: 0,
              asr: 0,
              maghrib: 0,
              isha: 0,
              witr: 0,
            },
          })
        }
      }
      fetchPrayerData()
    }
  }, [userId, selectedDate])

  useEffect(() => {
    const fetchPrayerCounts = async () => {
      if (userId) {
        const totalQadhaSnap = await firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary").get()
  
        if (totalQadhaSnap.exists) {
          const data = totalQadhaSnap.data()
          setFajr(data.fajr || 0)
          setDhuhr(data.dhuhr || 0)
          setAsr(data.asr || 0)
          setMaghrib(data.maghrib || 0)
          setIsha(data.isha || 0)
          setWitr(data.witr || 0)
        }
      }
    }
  
    fetchPrayerCounts()
  }, [userId])

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection("users")
      .doc(userId)
      .collection("dailyPrayers")
      .onSnapshot((querySnapshot) => {
        const allStates = {};
        const allCounts = {};
        
        querySnapshot.forEach((doc) => {
          const data = doc.data() || {};

          allStates[doc.id] = data.prayers || {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
            witr: false,
          };

          allCounts[doc.id] = data.counts || {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          };
        });

        setPrayerStates(allStates);
        lsetDailyPrayerCounts(allCounts);
      }, (error) => console.error("Firestore Listen Error:", error));

    return () => unsubscribe();
  }, [userId]);

  const fetchPrayerTimes = async (dateToFetch) => {
    const monthKey = moment(dateToFetch).format("YYYY-MM");
    const dayKey = moment(dateToFetch).format("DD-MM-YYYY");
    const cacheKey = `${madhab}-${monthKey}`;

    if (monthCache[cacheKey] && monthCache[cacheKey][dayKey]) {
      setPrayerTimes(monthCache[cacheKey][dayKey]);
      return;
    }

    setIsLoadingTimes(true);
    try {
      let coords = locationRef.current;
      if (!coords) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          locationRef.current = coords;
        }
      }

      if (coords) {
        const year = moment(dateToFetch).format("YYYY");
        const month = moment(dateToFetch).format("MM");
        const school = madhab === "Hanafi" ? 1 : 0;

        const res = await axios.get(
          `https://api.aladhan.com/v1/calendar/${year}/${month}`,
          {
            params: {
              latitude: coords.latitude,
              longitude: coords.longitude,
              school: school,
            },
          }
        );

        const monthData = {};
        res.data.data.forEach((day) => {
          monthData[day.date.gregorian.date] = day.timings;
        });

        setMonthCache((prev) => ({ ...prev, [cacheKey]: monthData }));
        setPrayerTimes(monthData[dayKey]);
      }
    } catch (e) {
      console.error("Error fetching prayer times:", e);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchPrayerTimes(selectedDate);
    }, [selectedDate, madhab])
  );

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // 1. Request Permission (Required for iOS)
        const authStatus = await messaging().requestPermission();
        const enabled = 
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          // 2. Get the Token
          const token = await messaging().getToken();
          
          // 3. Get current location
          // If locationRef isn't ready yet, we wait for it
          const coords = locationRef.current; 

          if (userId && coords) {
            await firestore().collection("users").doc(userId).set({
              fcmToken: token,
              madhab: madhab,
              latitude: coords.latitude,
              longitude: coords.longitude,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              lastActive: firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            console.log("Notification profile updated for:", userId);
          }
        }
      } catch (error) {
        console.error("Notification Setup Error:", error);
      }
    };

    if (userId) {
      setupNotifications();
    }
  }, [userId, madhab]); // Re-runs if user logs in or changes Madhab

  useEffect(() => {
    const unsubscribe = messaging().onTokenRefresh(token => {
      if (userId) {
        firestore().collection("users").doc(userId).update({ fcmToken: token });
      }
    });
    return unsubscribe;
  }, [userId]);
  
  const handleDateSelect = (date) => {
    if (moment(date).isSameOrBefore(today)) {
      setSelectedDate(date)
      setIsModalVisible(false)
      if (!prayerStates[date]) {
        setPrayerStates((prevStates) => ({
          ...prevStates,
          [date]: {
            fajr: false,
            dhuhr: false,
            asr: false,
            maghrib: false,
            isha: false,
            witr: false,
          },
        }))
      }
      if (!ldailyPrayerCounts[date]) {
        lsetDailyPrayerCounts((prevCounts) => ({
          ...prevCounts,
          [date]: {
            fajr: 0,
            dhuhr: 0,
            asr: 0,
            maghrib: 0,
            isha: 0,
            witr: 0,
          },
        }))
      }
    }
  }
  
  const handlePrayerSelect = async (prayer) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const wasSelected = prayerStates[selectedDate]?.[prayer] || false
    const updatedStates = {
      ...prayerStates,
      [selectedDate]: {
        ...prayerStates[selectedDate],
        [prayer]: !wasSelected,
      },
    }
    setPrayerStates(updatedStates)

    const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
    await dailyPrayerRef.set({
      prayers: updatedStates[selectedDate],
    }, { merge: true });

    if (wasSelected) {
      await adjustTotalQadha(prayer, 1)
    } else {
      await adjustTotalQadha(prayer, -1)
    }
  }

  const adjustTotalQadha = async (prayer, amount) => {
    const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary")

    await totalQadhaRef.set({
      [prayer]: firestore.FieldValue.increment(amount),
    }, { merge: true });
  };
  
  const adjustCount = async (prayer, amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentCount = ldailyPrayerCounts[selectedDate]?.[prayer] || 0;
    const newCount = currentCount + amount;
    if (newCount < 0) return;

    lsetDailyPrayerCounts(prev => ({
      ...prev,
      [selectedDate]: { ...prev[selectedDate], [prayer]: newCount }
    }));

    const batch = firestore().batch();
    const dailyRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate);
    const summaryRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");

    batch.update(dailyRef, { [`counts.${prayer}`]: newCount });
    batch.set(summaryRef, {
      [prayer]: firestore.FieldValue.increment(-amount),
    }, { merge: true });

    await batch.commit();
  };

  const getMarkedDates = () => {
    const markedDates = {}
    Object.keys(prayerStates).forEach((date) => {
      const selectedPrayers = prayerStates[date] || {}
      const selectedCount = Object.values(selectedPrayers).filter((value) => value).length
      const color =
        selectedCount === 0
          ? "#E5E7EB"
          : selectedCount === 1
            ? "#9CA3AF"
            : selectedCount === 2
              ? "#6B7280"
              : selectedCount === 3
                ? "#4B8B6F"
                : selectedCount === 4
                  ? "#34A853"
                  : selectedCount === 5
                    ? "#1F9D55"
                    : selectedCount === 6
                      ? "#0F7C3A"
                      : "#E5E7EB"

      markedDates[date] = {
        customStyles: {
          container: {
            backgroundColor: color,
          },
          text: {
            color: selectedCount === 0 ? "#6B7280" : "white",
            fontWeight: selectedCount > 0 ? "600" : "400",
          },
        },
      }
    })
    return markedDates
  }

  const getPrayerIcon = (prayer) => {
    const icons = {
      fajr: "sunny-outline",
      dhuhr: "partly-sunny-outline",
      asr: "sunny-outline",
      maghrib: "moon-outline",
      isha: "moon-outline",
      witr: "moon-outline",
    }
    return icons[prayer] || "checkmark-circle-outline"
  }

  const formatTime = (t) => {
    if (!t) return ""
    return moment(t, "HH:mm").format("HH:mm")
  }

  const handleMarkAll = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const prayersToMark = ["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])];
    const currentDayState = prayerStates[selectedDate] || {};
    
    const unticked = prayersToMark.filter(p => !currentDayState[p]);
    if (unticked.length === 0) return;

    const updatedDayPrayers = { ...currentDayState };
    unticked.forEach(p => { updatedDayPrayers[p] = true; });

    setPrayerStates(prev => ({
      ...prev,
      [selectedDate]: updatedDayPrayers
    }));

    try {
      const batch = firestore().batch();
      const dailyRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate);
      const summaryRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");

      batch.update(dailyRef, { prayers: updatedDayPrayers });

      unticked.forEach(prayer => {
        batch.set(summaryRef, {
          [prayer]: firestore.FieldValue.increment(-1),
        }, { merge: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Mark All Error:", error);
    }
  };

  const prayersToTrack = ["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])];

  const isAllCompleted = prayersToTrack.every(prayer => prayerStates[selectedDate]?.[prayer] === true);

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = moment();
    const todayString = moment().format("YYYY-MM-DD");

    if (selectedDate !== todayString) return null;

    const times = {
      fajr: moment(prayerTimes.Fajr, "HH:mm"),
      sunrise: moment(prayerTimes.Sunrise, "HH:mm"),
      dhuhr: moment(prayerTimes.Dhuhr, "HH:mm"),
      asr: moment(prayerTimes.Asr, "HH:mm"),
      maghrib: moment(prayerTimes.Maghrib, "HH:mm"),
      isha: moment(prayerTimes.Isha, "HH:mm"),
    };

    if (now.isBetween(times.fajr, times.sunrise)) return "fajr";
    if (now.isBetween(times.dhuhr, times.asr)) return "dhuhr";
    if (now.isBetween(times.asr, times.maghrib)) return "asr";
    if (now.isBetween(times.maghrib, times.isha)) return "maghrib";
    if (now.isAfter(times.isha)) return "isha";

    return null;
  };

  const currentPrayer = getCurrentPrayer();

  useEffect(() => {
    const interval = setInterval(() => {
      // force rerender every minute
      setSelectedDate(prev => prev);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Daily Chart</Text>
        <TouchableOpacity 
          onPress={() => setShowHelp(true)}
          style={{ position: 'absolute', right: 20, top: 65 }}
        >
          <Icon name="help-circle" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom - 30 }]}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setIsModalVisible(true)} activeOpacity={0.7}>
          <View style={styles.dateButtonContent}>
            <Icon name="calendar-outline" size={24} color="#5CB390" />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateButtonLabel}>Selected Date</Text>
              <Text style={styles.dateButtonText}>{moment(selectedDate).format("MMMM D, YYYY")}</Text>
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily Prayers</Text>
          
          {!isAllCompleted && (
            <TouchableOpacity onPress={handleMarkAll} activeOpacity={0.7}>
              <Text style={styles.markAllText}>Mark All Salah Completed</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.prayersContainer}>
          {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
            <TouchableOpacity
              key={prayer}
              style={[
                styles.prayerButton, 
                prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButton, 
                (
                  currentPrayer === prayer ||
                  (currentPrayer === "isha" && prayer === "witr")
                ) && styles.currentPrayerGlow
              ]}
              onPress={() => handlePrayerSelect(prayer)}
              activeOpacity={0.7}
            >
              <View style={styles.prayerButtonLeft}>
                <View style={[styles.prayerIconContainer, prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerIconContainer]}>
                  <Icon 
                    name={getPrayerIcon(prayer)} 
                    size={20} 
                    color={prayerStates[selectedDate]?.[prayer] ? "#FFFFFF" : "#6B7280"} 
                  />
                </View>
                <View>
                  <Text
                    style={[
                      styles.prayerButtonText,
                      prayerStates[selectedDate]?.[prayer] && styles.selectedPrayerButtonText,
                    ]}
                  >
                    {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                  </Text>

                  {prayer !== "witr" && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        color: prayerStates[selectedDate]?.[prayer] ? "#E8FFF6" : "#6B7280",
                      }}
                    >
                      {isLoadingTimes ? (
                        "Salah Times Loading..." 
                      ) : prayerTimes ? (
                        prayer === "fajr"
                          ? `${formatTime(prayerTimes.Fajr)} • Sunrise ${formatTime(prayerTimes.Sunrise)}`
                          : formatTime(prayerTimes[prayer.charAt(0).toUpperCase() + prayer.slice(1)])
                      ) : (
                        "--:--"
                      )}
                    </Text>
                  )}
                </View>
              </View>
              {prayerStates[selectedDate]?.[prayer] && (
                <Icon name="checkmark-circle" size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.prayQadhaButton} 
          onPress={() => setIsQadhaModalVisible(true)}
          activeOpacity={0.8}
        >
          <Icon name="add-circle-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.prayQadhaButtonText}>Pray Qadha</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Icon name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={selectedDate}
              onDayPress={(day) => {
                handleDateSelect(day.dateString)
                setIsModalVisible(false)
              }}
              markingType={"custom"}
              markedDates={getMarkedDates()}
              theme={{
                backgroundColor: "#ffffff",
                calendarBackground: "#ffffff",
                textSectionTitleColor: "#9CA3AF",
                selectedDayBackgroundColor: "#5CB390",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#5CB390",
                dayTextColor: "#1F2937",
                textDisabledColor: "#D1D5DB",
                dotColor: "#5CB390",
                selectedDotColor: "#ffffff",
                arrowColor: "#5CB390",
                monthTextColor: "#1F2937",
                indicatorColor: "#5CB390",
                textDayFontFamily: "System",
                textMonthFontFamily: "System",
                textDayHeaderFontFamily: "System",
                textDayFontWeight: "400",
                textMonthFontWeight: "700",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 15,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 14,
              }}
            />

            <View style={styles.colorKeyContainer}>
              <Text style={styles.colorKeyTitle}>Prayer Completion</Text>
              <View style={styles.colorKeyRow}>
                {[
                  { color: "#E5E7EB", label: "0", textColor: "#6B7280" },
                  { color: "#9CA3AF", label: "1" },
                  { color: "#6B7280", label: "2" },
                  { color: "#4B8B6F", label: "3" },
                  { color: "#34A853", label: "4" },
                  { color: "#1F9D55", label: "5" },
                  ...(madhab === "Hanafi" ? [{ color: "#0F7C3A", label: "6" }] : []),
                ].map((item) => (
                  <View key={item.color} style={styles.colorKeyItem}>
                    <View style={[styles.colorBox, { backgroundColor: item.color }]}>
                      <Text style={[styles.colorBoxText, { color: item.textColor || "#FFFFFF" }]}>{item.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isQadhaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsQadhaModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 10 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Qadha Salah</Text>
                <TouchableOpacity onPress={() => {
                  Keyboard.dismiss()
                  setIsQadhaModalVisible(false)
                }}>
                  <Icon name="close-circle" size={28} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalText}>
                Enter the number of Qadha prayers you completed today
              </Text>
        
              <View style={styles.qadhaView}>
                <View style={styles.qadhaCountersContainer}>
                  {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => (
                    <View key={prayer} style={styles.qadhaCounterWrapper}>
                      <View style={styles.qadhaLabelContainer}>
                        <Icon name={getPrayerIcon(prayer)} size={20} color="#5CB390" style={styles.qadhaIcon} />
                        <Text style={styles.qadhaCounterLabel}>
                          {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                        </Text>
                      </View>
                      <View style={styles.qadhaCounterControls}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => adjustCount(prayer, -1)}
                          activeOpacity={0.7}
                        >
                          <Icon name="remove" size={20} color="#5CB390" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.qadhaCounterInput}
                          keyboardType="numeric"
                          value={String(ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0)}
                          onChangeText={(text) => {
                            const newValue = parseInt(text, 10) || 0
                            adjustCount(prayer, newValue - (ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0))
                          }}
                        />
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={() => adjustCount(prayer, 1)}
                          activeOpacity={0.7}
                        >
                          <Icon name="add" size={20} color="#5CB390" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>How to use Daily Chart</Text>
                <Text style={styles.modalSubtitle}>Manage your daily salah and qadha</Text>
              </View>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Icon name="close-circle" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Section 1: Daily Tracking */}
              <View style={styles.helpItem}>
                <View style={[styles.helpIconCircle, { backgroundColor: '#E8FFF6' }]}>
                  <Icon name="checkbox" size={24} color="#5CB390" />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpLabel}>Daily Tracking</Text>
                  <Text style={styles.helpDescription}>
                    Tap a salah after you perform it. The app adds today's salah to your total qadha count automatically at the start of the day. Current salah is highlighted in green.
                  </Text>
                </View>
              </View>

              {/* Section 2: Calendar */}
              <View style={styles.helpItem}>
                <View style={[styles.helpIconCircle, { backgroundColor: '#F3F4F6' }]}>
                  <Icon name="calendar" size={24} color="#6B7280" />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpLabel}>Calendar & History</Text>
                  <Text style={styles.helpDescription}>
                    Tap the date to look back. Darker green dates mean more prayers were completed. You can log missed prayers for any past date!
                  </Text>
                </View>
              </View>

              {/* Section 3: Extra Qadha */}
              <View style={styles.helpItem}>
                <View style={[styles.helpIconCircle, { backgroundColor: '#EEF2FF' }]}>
                  <Icon name="add-circle" size={24} color="#4F46E5" />
                </View>
                <View style={styles.helpTextContainer}>
                  <Text style={styles.helpLabel}>Praying Extra Qadha</Text>
                  <Text style={styles.helpDescription}>
                    If you pray any qadha prayers today, use the "Pray Qadha" button to log them.
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={[styles.prayQadhaButton, { marginTop: 20 }]} 
              onPress={() => setShowHelp(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.prayQadhaButtonText}>Got it, thanks!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {selectedDate !== today && (
        <TouchableOpacity 
          style={[styles.todayPill, { bottom: insets.bottom }]} 
          onPress={() => {
            setSelectedDate(today);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          activeOpacity={0.9}
        >
          <Icon name="arrow-back-circle" size={20} color="#FFFFFF" />
          <Text style={styles.todayPillText}>Back to Today</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

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
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  dateButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dateTextContainer: {
    marginLeft: 12,
  },
  dateButtonLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E8F8F3",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  infoIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  description: {
    flex: 1,
    fontSize: 14,
    color: "#2F7F6F",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 12,
  },
  prayersContainer: {
    gap: 10,
    marginBottom: 20,
  },
  prayerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  selectedPrayerButton: {
    backgroundColor: "#5CB390",
    borderColor: "#5CB390",
  },
  prayerButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  prayerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  selectedPrayerIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  prayerButtonText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  selectedPrayerButtonText: {
    color: "#FFFFFF",
  },
  prayQadhaButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2F7F6F",
    padding: 18,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 8,
  },
  prayQadhaButtonText: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: 100,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F2937",
  },
  modalText: {
    fontSize: 15,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 22,
  },
  colorKeyContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  colorKeyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  colorKeyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorKeyItem: {
    alignItems: "center",
  },
  colorBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  colorBoxText: {
    fontSize: 13,
    fontWeight: "700",
  },
  qadhaView: {
    flexGrow: 0,
  },
  qadhaCountersContainer: {
    gap: 12,
  },
  qadhaCounterWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
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
  qadhaIcon: {
    marginRight: 10,
  },
  qadhaCounterLabel: {
    fontSize: 16,
    color: "#374151",
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
  qadhaCounterInput: {
    fontSize: 16,
    color: "#5CB390",
    borderWidth: 2,
    borderColor: "#5CB390",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 60,
    textAlign: "center",
    fontWeight: "600",
    backgroundColor: "#FFFFFF",
    width: 50,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  markAllText: {
    color: "#5CB390",
    fontWeight: "600",
    fontSize: 14,
  },
  todayPill: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#2F7F6F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    zIndex: 999,
  },
  todayPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
    padding: 15,
    borderRadius: 12,
  },
  helpTextContainer: {
    flex: 1,
  },
  helpDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  helpIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  helpLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  currentPrayerGlow: {
    shadowColor: "#5CB390",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    borderColor: "#5CB390",
  },
})

export default DailyChart