import { useContext, useState, useEffect, useCallback, useRef } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Platform, Keyboard, Alert, Linking, TouchableWithoutFeedback } from "react-native"
import { Calendar } from "react-native-calendars"
import { AppContext } from "../AppContext"
import moment from "moment"
import Icon from "react-native-vector-icons/Ionicons"
import auth from "@react-native-firebase/auth"
import firestore from "@react-native-firebase/firestore"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as Location from "expo-location"
import axios from "axios"
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DailyChart = () => {
  const { setFajr, setDhuhr, setAsr, setMaghrib, setIsha, setWitr, madhab, setMadhab } = useContext(AppContext)
  
  const insets = useSafeAreaInsets()
  const navigation = useNavigation()
  const user = auth().currentUser
  const userId = user ? user.uid : null

  const today = moment().format("YYYY-MM-DD")
  const [selectedDate, setSelectedDate] = useState(today)
  const [prayerStates, setPrayerStates] = useState({})
  const [ldailyPrayerCounts, lsetDailyPrayerCounts] = useState({})
  const [totalQadhaCounts, setTotalQadhaCounts] = useState({
    fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0, witr: 0,
  })
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isQadhaModalVisible, setIsQadhaModalVisible] = useState(false)
  const [prayerTimes, setPrayerTimes] = useState(null)
  const [isLoadingTimes, setIsLoadingTimes] = useState(false);
  const locationRef = useRef(null);
  const [monthCache, setMonthCache] = useState({});
  const [showHelp, setShowHelp] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);
  const [madhabReady, setMadhabReady] = useState(false);
  const [hijriData, setHijriData] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  useEffect(() => {
    handleDateSelect(today);
  }, []);

  useEffect(() => {
    setHijriData(null);
    fetchPrayerTimes(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const configureAndroidChannel = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('prayer_times', {
          name: 'Prayer Times',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#5CB390',
          sound: 'default',
        });
      }
    };

    configureAndroidChannel();
  }, []);

  useEffect(() => {
    const syncToken = async () => {
      if (userId) {
        try {
          const { status } = await Notifications.getPermissionsAsync();
          if (status !== 'granted') {
            await firestore().collection("users").doc(userId).update({
              fcmToken: firestore.FieldValue.delete(),
            });
            return;
          }

          const token = await messaging().getToken();
          
          await firestore().collection("users").doc(userId).set({
            fcmToken: token,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lastActive: firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          
          console.log("FCM Token synced successfully");
        } catch (e) {
          console.error("Failed to sync FCM token:", e);
        }
      }
    };

    syncToken();
  }, [userId]);

  useEffect(() => {
    if (userId) {
      const fetchMadhab = async () => {
        const userSnap = await firestore().collection("users").doc(userId).get()
        if (userSnap.exists()) {
          const userData = userSnap.data()
          if (userData.madhab) {
            setMadhab(userData.madhab)
          }
        }
        setMadhabReady(true)
      }
  
      fetchMadhab()
    }
  }, [userId])

  useEffect(() => {
    if (userId) {
      const fetchPrayerData = async () => {
        const dailyPrayerRef = firestore().collection("users").doc(userId).collection("dailyPrayers").doc(selectedDate)
        const docSnap = await dailyPrayerRef.get()

        if (docSnap.exists()) {
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
  
        if (totalQadhaSnap.exists()) {
          const data = totalQadhaSnap.data()
          setFajr(data.fajr || 0)
          setDhuhr(data.dhuhr || 0)
          setAsr(data.asr || 0)
          setMaghrib(data.maghrib || 0)
          setIsha(data.isha || 0)
          setWitr(data.witr || 0)

          setTotalQadhaCounts({
            fajr: data.fajr || 0,
            dhuhr: data.dhuhr || 0,
            asr: data.asr || 0,
            maghrib: data.maghrib || 0,
            isha: data.isha || 0,
            witr: data.witr || 0,
          })
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
      .collection("totalQadha")
      .doc("qadhaSummary")
      .onSnapshot((doc) => {
        if (doc.exists()) {
          const data = doc.data() || {};
          setTotalQadhaCounts({
            fajr:    Math.max(0, data.fajr    || 0),
            dhuhr:   Math.max(0, data.dhuhr   || 0),
            asr:     Math.max(0, data.asr     || 0),
            maghrib: Math.max(0, data.maghrib || 0),
            isha:    Math.max(0, data.isha    || 0),
            witr:    Math.max(0, data.witr    || 0),
          });
          setFajr(Math.max(0, data.fajr || 0));
          setDhuhr(Math.max(0, data.dhuhr || 0));
          setAsr(Math.max(0, data.asr || 0));
          setMaghrib(Math.max(0, data.maghrib || 0));
          setIsha(Math.max(0, data.isha || 0));
          setWitr(Math.max(0, data.witr || 0));
        }
      }, (error) => console.error("totalQadha Listen Error:", error));

    return () => unsubscribe();
  }, [userId]);

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

  const fetchPrayerTimes = async (dateToFetch) => {
    const mDate = moment(dateToFetch);
    const dayKey = mDate.format("DD-MM-YYYY");
    const monthKey = mDate.format("YYYY-MM");
    const cacheKey = `${madhab}-${monthKey}`;

    if (monthCache[cacheKey]?.[dayKey]?.hijri) {
      setPrayerTimes(monthCache[cacheKey][dayKey].timings);
      setHijriData(monthCache[cacheKey][dayKey].hijri);
      return;
    }

    setIsLoadingTimes(true);
    try {
      const userSnap = await firestore().collection("users").doc(userId).get();
      const userData = userSnap.data();
      const method = userData?.method || 3;
      const coords = { lat: userData?.latitude, lng: userData?.longitude };

      if (coords.lat && coords.lng) {
        const roundedLat = coords.lat.toFixed(1);
        const roundedLng = coords.lng.toFixed(1);
        const month = mDate.month() + 1;
        const year = mDate.year();
        const school = madhab === "Hanafi" ? 1 : 0;

        const calendarId = `${roundedLat}_${roundedLng}_${month}_${year}_${school}_${method}`;
        const calendarDoc = await firestore().collection("prayerCalendars").doc(calendarId).get();

        if (calendarDoc.exists()) {
          const data = calendarDoc.data();
          const days = data?.days;

          const hasHijriData = days?.[0]?.hijri !== undefined;

          if (days && Array.isArray(days) && hasHijriData) {
            const monthData = {};
            days.forEach((dayData, index) => {
              const dString = moment(`${year}-${month}-${index + 1}`, "YYYY-M-D").format("DD-MM-YYYY");
              monthData[dString] = { timings: dayData.timings, hijri: dayData.hijri };
            });

            setMonthCache(prev => ({ ...prev, [cacheKey]: monthData }));
            setPrayerTimes(monthData[dayKey].timings);
            setHijriData(monthData[dayKey].hijri);
            return; 
          }
        }

        const params = { 
          latitude: coords.lat, 
          longitude: coords.lng, 
          school: school, 
          method: method 
        };
        if (method === 15) params.shafaq = "general";

        const res = await axios.get(`https://api.aladhan.com/v1/calendar/${year}/${month}`, { params });

        const monthData = {};
        res.data.data.forEach(day => {
          monthData[day.date.gregorian.date] = {
            timings: day.timings,
            hijri: {
              day: day.date.hijri.day,
              month: { en: day.date.hijri.month.en },
              year: day.date.hijri.year
            }
          };
        });

        setMonthCache(prev => ({ ...prev, [cacheKey]: monthData }));
        setPrayerTimes(monthData[dayKey].timings);
        setHijriData(monthData[dayKey].hijri);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
    } finally {
      setIsLoadingTimes(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (!madhabReady) return;
      fetchPrayerTimes(selectedDate);
    }, [selectedDate, madhab, madhabReady])
  );

  useEffect(() => {
    const checkNotificationStatus = async () => {
      if (!userId) return;
      
      try {
        const hasSeen = await AsyncStorage.getItem('hasSeenNotificationPrompt');
        if (hasSeen) return;

        const { status } = await Notifications.getPermissionsAsync();
        const { status: locationStatus } = await Location.getForegroundPermissionsAsync();

        if (status !== 'granted' || locationStatus !== 'granted') {
          setShowNotificationPrompt(true);
          await AsyncStorage.setItem('hasSeenNotificationPrompt', 'true');
        }
      } catch (error) {
        console.error("Error checking notification status:", error);
      }
    };

    checkNotificationStatus();
  }, [userId]);

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

      const dayKey = moment(date).format("DD-MM-YYYY");
      const monthKey = moment(date).format("YYYY-MM");
      const cacheKey = `${madhab}-${monthKey}`;
      
      setSelectedDate(date)
      setIsModalVisible(false)

      if (monthCache[cacheKey]?.[dayKey]) {
        setHijriData(monthCache[cacheKey][dayKey].hijri);
      }
      
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

    const isPastDate = selectedDate !== today;

    if (isPastDate) {
      if (wasSelected) {
        await adjustTotalQadha(prayer, 1)
      } else {
        await adjustTotalQadha(prayer, -1)
      }
    }
  }

  const adjustTotalQadha = async (prayer, amount) => {
    const totalQadhaRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary")

    if (amount < 0) {
      const current = totalQadhaCounts[prayer] ?? 0;
      if (current <= 0) return;
    }

    await totalQadhaRef.set({
      [prayer]: firestore.FieldValue.increment(amount),
    }, { merge: true });
  };
  
  const adjustCount = async (prayer, amount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentCount = ldailyPrayerCounts[selectedDate]?.[prayer] || 0;
    const newCount = currentCount + amount;
    if (newCount < 0) return;
    if (amount > 0 && totalQadhaCounts[prayer] <= 0) return;

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
    if (!t) return "";
    const clean = t.replace(/\s*\(.*?\)/, "").trim();
    return moment(clean, "HH:mm").format("HH:mm");
  };

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

      batch.set(dailyRef, { prayers: updatedDayPrayers }, { merge: true });

      const isPastDate = selectedDate !== today;

      if (isPastDate) {
        const summaryRef = firestore().collection("users").doc(userId).collection("totalQadha").doc("qadhaSummary");
        unticked.forEach(prayer => {
          batch.set(summaryRef, {
            [prayer]: firestore.FieldValue.increment(-1),
          }, { merge: true });
        });
      }

      await batch.commit();
    } catch (error) {
      console.error("Mark All Error:", error);
      Alert.alert(
        "Save Failed",
        "Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleEnableLocation = async () => {
    const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
    
    if (status === "denied" && !canAskAgain) {
      Alert.alert(
        "Location Permission Required",
        "Please enable location access in Settings to see prayer times.",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Settings", 
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }
          }
        ]
      );
    } else {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      if (newStatus === "granted") {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        locationRef.current = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setLocationDenied(false);
        fetchPrayerTimes(selectedDate);
      }
    }
  };

  const setupNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          "Notification Permission Denied",
          "You can enable notifications later in the profile page.",
          [{ text: "OK" }]
        );
        return;
      }

      const token = await messaging().getToken();

      const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
      if (locStatus !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const rawLat = loc.coords.latitude;
      const rawLng = loc.coords.longitude;

      const reverseResult = await Location.reverseGeocodeAsync({
        latitude: rawLat,
        longitude: rawLng
      });

      const countryCode = reverseResult[0]?.isoCountryCode || "DEFAULT";
      const userMethod = getMethodByCountry(countryCode);

      const roundedLat = parseFloat(rawLat.toFixed(1));
      const roundedLng = parseFloat(rawLng.toFixed(1));

      locationRef.current = { latitude: roundedLat, longitude: roundedLng };

      await firestore().collection("users").doc(userId).set({
        fcmToken: token,
        madhab: madhab,
        method: userMethod,
        countryCode: countryCode,
        latitude: roundedLat,
        longitude: roundedLng,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastActive: firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      fetchPrayerTimes(selectedDate);

      Alert.alert(
        "Notifications Enabled! ",
        "You'll receive notifications for each prayer time based on your location.",
        [{ text: "Great!" }]
      );

      await AsyncStorage.setItem('hasSeenNotificationPrompt', 'true');

      console.log("Notification profile fully set up for:", userId);
    } catch (error) {
      console.error("Notification Setup Error:", error);
      Alert.alert(
        "Setup Error",
        "Something went wrong setting up notifications. Please try again later.",
        [{ text: "OK" }]
      );
    }
  };

  const prayersToTrack = ["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])];

  const isAllCompleted = prayersToTrack.every(prayer => prayerStates[selectedDate]?.[prayer] === true);

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = moment();
    const todayString = moment().format("YYYY-MM-DD");

    if (selectedDate !== todayString) return null;

    const clean = (t) => t?.replace(/\s*\(.*?\)/, "").trim();

    const times = {
      fajr: moment(clean(prayerTimes.Fajr), "HH:mm"),
      sunrise: moment(clean(prayerTimes.Sunrise), "HH:mm"),
      dhuhr: moment(clean(prayerTimes.Dhuhr), "HH:mm"),
      asr: moment(clean(prayerTimes.Asr), "HH:mm"),
      maghrib: moment(clean(prayerTimes.Maghrib), "HH:mm"),
      isha: moment(clean(prayerTimes.Isha), "HH:mm"),
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
      setSelectedDate(prev => prev);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.navigate("QiblahCompass")}
          style={{ position: 'absolute', left: 25, top: 65 }}
        >
          <Icon name="compass" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Salah</Text>
        <TouchableOpacity 
          onPress={() => setShowHelp(true)}
          style={{ position: 'absolute', right: 25, top: 65 }}
        >
          <Icon name="help-circle" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.card} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom - 30 }]}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setIsModalVisible(true)} activeOpacity={0.7}>
          <View style={styles.dateButtonContent}>
            <Icon name="calendar-outline" size={24} color="#5CB390" />
            <View style={styles.dateTextContainer}>
              <Text style={styles.dateButtonText}>{moment(selectedDate).format("D MMMM YYYY")}</Text>
              {hijriData && (
                <Text style={styles.hijriDateText}>
                  {`${hijriData.day} ${hijriData.month.en} ${hijriData.year}`}
                </Text>
              )}
            </View>
          </View>
          <Icon name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {locationDenied && (
          <TouchableOpacity 
            style={styles.locationAlert} 
            onPress={handleEnableLocation}
            activeOpacity={0.8}
          >
            <Icon name="location-outline" size={20} color="#DC2626" style={styles.alertIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.locationAlertTitle}>Location access needed</Text>
              <Text style={styles.locationAlertText}>Enable location to see prayer times and receive notifications</Text>
            </View>
            <Icon name="chevron-forward" size={18} color="#DC2626" />
          </TouchableOpacity>
        )}

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

                  {prayer !== "witr" && prayerTimes && (
                    <Text
                      style={{
                        fontSize: 12,
                        marginTop: 2,
                        color: prayerStates[selectedDate]?.[prayer] ? "#E8FFF6" : "#6B7280",
                      }}
                    >
                      {isLoadingTimes ? (
                        "Loading times..." 
                      ) : (
                        prayer === "fajr"
                          ? `${formatTime(prayerTimes.Fajr)} • Sunrise ${formatTime(prayerTimes.Sunrise)}`
                          : formatTime(prayerTimes[prayer.charAt(0).toUpperCase() + prayer.slice(1)])
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
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Select Date</Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Icon name="close-circle" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Calendar
                  key={calendarMonth}
                  current={calendarMonth}
                  onDayPress={(day) => {
                    handleDateSelect(day.dateString)
                    setIsModalVisible(false)
                  }}
                  onMonthChange={(month) => {
                    setCalendarMonth(month.dateString);
                  }}
                  markingType={"custom"}
                  markedDates={getMarkedDates()}
                  maxDate={today}
                  hideExtraDays={true}
                  renderHeader={(date) => {
                    let display = moment(calendarMonth);
                    if (date) {
                      const parsed = moment(date.toString());
                      if (parsed.isValid()) display = parsed;
                    }
                    return (
                      <TouchableOpacity
                        onPress={() => {
                          setIsModalVisible(false);
                          setTimeout(() => setShowMonthPicker(true), 1);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 4,
                          paddingHorizontal: 12,
                          backgroundColor: '#F3F4F6',
                          borderRadius: 20,
                        }}
                      >
                        <Text style={{ color: '#374151', fontWeight: '600', fontSize: 15 }}>
                          {display.format('MMMM YYYY')}
                        </Text>
                        <Icon name="chevron-down" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    );
                  }}
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showMonthPicker}
        transparent={true}
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => {
          setShowMonthPicker(false);
          setTimeout(() => setIsModalVisible(true), 1);
        }}
      >
        <TouchableWithoutFeedback onPress={() => {
          setShowMonthPicker(false);
          setTimeout(() => setIsModalVisible(true), 1);
        }}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                padding: 24,
                width: '85%',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 8,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <TouchableOpacity
                    onPress={() => {
                      const newYear = moment(calendarMonth).subtract(1, 'year').startOf('month').format('YYYY-MM-DD');
                      if (moment(newYear).year() >= 1900) {
                        setCalendarMonth(newYear);
                      }
                    }}
                    style={{ padding: 8 }}
                  >
                    <Icon name="chevron-back" size={22} color="#5CB390" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#1F2937' }}>
                    {moment(calendarMonth).year()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      const newYear = moment(calendarMonth).add(1, 'year').startOf('month').format('YYYY-MM-DD');
                      if (moment(newYear).isSameOrBefore(today, 'year')) {
                        setCalendarMonth(newYear);
                      }
                    }}
                    disabled={moment(calendarMonth).year() >= moment(today).year()}
                    style={{ padding: 8, opacity: moment(calendarMonth).year() >= moment(today).year() ? 0.3 : 1 }}
                  >
                    <Icon name="chevron-forward" size={22} color="#5CB390" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                  {moment.monthsShort().map((month, index) => {
                    const isSelected = moment(calendarMonth).month() === index;
                    const isFuture =
                      moment(calendarMonth).year() === moment(today).year() &&
                      index > moment(today).month();
                    return (
                      <TouchableOpacity
                        key={month}
                        disabled={isFuture}
                        onPress={() => {
                          const newMonth = moment(calendarMonth).month(index).startOf('month').format('YYYY-MM-DD');
                          setCalendarMonth(newMonth);
                          setShowMonthPicker(false);
                          setTimeout(() => setIsModalVisible(true), 1);
                        }}
                        style={{
                          width: '22%',
                          paddingVertical: 10,
                          alignItems: 'center',
                          backgroundColor: isSelected ? '#5CB390' : '#F3F4F6',
                          borderRadius: 10,
                          opacity: isFuture ? 0.3 : 1,
                        }}
                      >
                        <Text style={{
                          color: isSelected ? '#fff' : '#374151',
                          fontWeight: isSelected ? '700' : '500',
                          fontSize: 14,
                        }}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={isQadhaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsQadhaModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsQadhaModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
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
                  Enter the number of Qadha prayers you completed on {moment(selectedDate).format("MMMM D, YYYY")}.
                </Text>
          
                <View style={styles.qadhaView}>
                  <View style={styles.qadhaCountersContainer}>
                    {["fajr", "dhuhr", "asr", "maghrib", "isha", ...(madhab === "Hanafi" ? ["witr"] : [])].map((prayer) => {
                      const remainingQadha = totalQadhaCounts[prayer] ?? 0;
                      const addDisabled = remainingQadha <= 0;
                      return (
                        <View key={prayer} style={styles.qadhaCounterWrapper}>
                          <View style={styles.qadhaLabelContainer}>
                            <Icon name={getPrayerIcon(prayer)} size={20} color="#5CB390" style={styles.qadhaIcon} />
                            <View>
                              <Text style={styles.qadhaCounterLabel}>
                                {prayer.charAt(0).toUpperCase() + prayer.slice(1)}
                              </Text>
                              <Text style={styles.qadhaRemainingText}>
                                {remainingQadha > 0
                                  ? `${remainingQadha} remaining`
                                  : "All caught up!"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.qadhaCounterControls}>
                            <TouchableOpacity
                              style={styles.counterButton}
                              onPress={() => adjustCount(prayer, -1)}
                              activeOpacity={0.7}
                            >
                              <Icon name="remove" size={20} color="#5CB390" />
                            </TouchableOpacity>
                            <Text style={styles.qadhaCounterValue}>
                              {ldailyPrayerCounts[selectedDate]?.[prayer] ?? 0}
                            </Text>
                            <TouchableOpacity
                              style={[styles.counterButton, addDisabled && styles.counterButtonDisabled]}
                              onPress={() => adjustCount(prayer, 1)}
                              activeOpacity={addDisabled ? 1 : 0.7}
                              disabled={addDisabled}
                            >
                              <Icon name="add" size={20} color={addDisabled ? "#D1D5DB" : "#5CB390"} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowHelp(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalTitle}>How to use Daily Salah</Text>
                    <Text style={styles.modalSubtitle}>Manage your daily salah and qadha</Text>
                  </View>
                  <TouchableOpacity onPress={() => setShowHelp(false)}>
                    <Icon name="close-circle" size={28} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.helpItem}>
                    <View style={[styles.helpIconCircle, { backgroundColor: '#E8FFF6' }]}>
                      <Icon name="checkbox" size={24} color="#5CB390" />
                    </View>
                    <View style={styles.helpTextContainer}>
                      <Text style={styles.helpLabel}>Daily Tracking</Text>
                      <Text style={styles.helpDescription}>
                        Tap a salah after you perform it. The app checks at the end of the day which salah you didn't pray and adds qadha accordingly. Current salah is highlighted in green.
                      </Text>
                    </View>
                  </View>

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
                  <Text style={styles.prayQadhaButtonText}>Got it!</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {selectedDate !== today && (
        <TouchableOpacity 
          style={[styles.todayPill, { bottom: insets.bottom }]} 
          onPress={() => {
            setSelectedDate(today);
            setCalendarMonth(today)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }}
          activeOpacity={0.9}
        >
          <Icon name="arrow-back-circle" size={20} color="#FFFFFF" />
          <Text style={styles.todayPillText}>Back to Today</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showNotificationPrompt}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotificationPrompt(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.notificationPromptHeader}>
              <View style={styles.bellIconContainer}>
                <Icon name="notifications" size={32} color="#5CB390" />
              </View>
              <Text style={styles.notificationPromptTitle}>Enable Salah Notifications?</Text>
              <Text style={styles.notificationPromptSubtitle}>
                Never miss a prayer time
              </Text>
            </View>

            <View style={styles.notificationFeatures}>
              <View style={styles.featureItem}>
                <View style={styles.featureIconCircle}>
                  <Icon name="time-outline" size={20} color="#5CB390" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Automatic Reminders</Text>
                  <Text style={styles.featureDescription}>
                    Get notified when it's time for each of the 5 daily prayers
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconCircle}>
                  <Icon name="location-outline" size={20} color="#5CB390" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Location-Based Times</Text>
                  <Text style={styles.featureDescription}>
                    We need your location to calculate accurate prayer times for your area
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={styles.featureIconCircle}>
                  <Icon name="shield-checkmark-outline" size={20} color="#5CB390" />
                </View>
                <View style={styles.featureTextContainer}>
                  <Text style={styles.featureTitle}>Your Privacy Matters</Text>
                  <Text style={styles.featureDescription}>
                    Your location is only used to calculate prayer times, never shared
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.enableNotificationsButton} 
              onPress={() => {
                setShowNotificationPrompt(false);
                setupNotifications();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.enableNotificationsButtonText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.skipButton} 
              onPress={() => setShowNotificationPrompt(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  dateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  hijriDateText: {
    fontSize: 13,
    color: '#5CB390',
    fontWeight: '500',
    marginTop: 1,
  },
  locationAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  alertIcon: {
    marginRight: 12,
  },
  locationAlertTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#991B1B",
    marginBottom: 2,
  },
  locationAlertText: {
    fontSize: 12,
    color: "#DC2626",
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
    marginBottom: 0,
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
  qadhaRemainingText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 1,
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
  counterButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  qadhaCounterValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5CB390",
    minWidth: 40,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  notificationPromptHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bellIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8FFF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  notificationPromptTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  notificationPromptSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  notificationFeatures: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8FFF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  enableNotificationsButton: {
    backgroundColor: '#5CB390',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  enableNotificationsButtonText: {
    fontSize: 17,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  skipButton: {
    padding: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
})

export default DailyChart