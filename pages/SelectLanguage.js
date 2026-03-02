import { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SelectLanguage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState({ arabic: '', english: '', ref: '' });
  const [destination, setDestination] = useState(null);
  const [held, setHeld] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVerse();
    resolveDestination();
  }, []);

  useEffect(() => {
    if (loading || !destination || held) return;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        navigation.replace(destination);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, loading, destination, held]);

  const resolveDestination = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const userDocSnapshot = await firestore().collection("users").doc(user.uid).get();
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          if (userData.setupComplete || userData.madhab) {
            setDestination("MainPages");
          } else {
            setDestination("Setup");
          }
        } else {
          setDestination("Setup");
        }
      } else {
        setDestination("SignUp");
      }
    } catch (error) {
      setDestination("SignUp");
    }
  };

  const fetchVerse = async () => {
    try {
      const verseDoc = await firestore().collection("appData").doc("dailyVerse").get();
      const now = Date.now();

      if (verseDoc.exists()) {
        const data = verseDoc.data();
        if (now - data.fetchedAt < 3600000 && data.arabic) {
          setVerse({ arabic: data.arabic, english: data.english, ref: data.ref });
          setLoading(false);
          Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
          return;
        }
      }

      const versesDoc = await firestore().collection("appData").doc("verses").get();
      const pool = versesDoc.exists()
        ? versesDoc.data().verses
        : ["2:43", "2:110", "2:183", "2:185", "4:103", "29:45"];

      const randomRef = pool[Math.floor(Math.random() * pool.length)];

      const response = await fetch(`https://api.alquran.cloud/v1/ayah/${randomRef}/editions/quran-uthmani,en.sahih`);
      const json = await response.json();

      if (json.status === "OK") {
        const newVerse = {
          arabic: json.data[0].text,
          english: json.data[1].text,
          ref: `${json.data[0].surah.englishName} ${json.data[0].numberInSurah}`,
          fetchedAt: now,
        };

        await firestore().collection("appData").doc("dailyVerse").set(newVerse);
        setVerse(newVerse);
      }
    } catch (error) {
      console.error("Verse fetch error:", error);
    } finally {
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      style={styles.container}
      onPressIn={() => setHeld(true)}
      onPressOut={() => {
        setHeld(false);
        if (!loading && destination) {
          navigation.replace(destination);
        }
      }}
    >
      <Text style={styles.logoText}>iQadha</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#EEEEEE" style={{ marginTop: 50 }} />
      ) : (
        <Animated.View style={[styles.verseContainer, { opacity: fadeAnim }]}>
          <Text style={styles.arabicText}>{verse.arabic}</Text>
          <Text style={styles.englishText}>"{verse.english}"</Text>
          <Text style={styles.reference}>— {verse.ref}</Text>
          <Text style={styles.tapText}>
            {held ? "Release to continue" : `Continuing in ${countdown}...`}
          </Text>
          <Text style={styles.holdText}>Hold to stay on this screen</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5CB390',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoText: {
    color: '#EEEEEE',
    fontSize: 50,
    fontWeight: 'bold',
    position: 'absolute',
    top: 80,
  },
  verseContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 25,
    borderRadius: 20,
    width: width * 0.9,
  },
  arabicText: {
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 35,
  },
  englishText: {
    fontSize: 16,
    color: '#EEEEEE',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  reference: {
    fontSize: 14,
    color: '#EEEEEE',
    marginTop: 15,
    fontWeight: '600',
  },
  tapText: {
    marginTop: 40,
    color: '#EEEEEE',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  holdText: {
    marginTop: 8,
    color: '#EEEEEE',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
});

export default SelectLanguage;