import { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Dimensions } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const SelectLanguage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [verse, setVerse] = useState({ arabic: '', english: '', ref: '' });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchVerse();
  }, []);

  const fetchVerse = async () => {
    try {
      const verseDoc = await firestore().collection("appData").doc("dailyVerse").get();
      const now = Date.now();

      if (verseDoc.exists()) {
        const data = verseDoc.data();
        const age = now - data.fetchedAt;

        if (age < 60 * 60 * 1000 && data.arabic) {
          setVerse({ arabic: data.arabic, english: data.english, ref: data.ref });
          Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
          return;
        }
      }

      const versesDoc = await firestore().collection("appData").doc("verses").get();
      const salahFastingVerses = versesDoc.exists() ? versesDoc.data().verses : ["2:43", "2:110", "2:183", "2:185", "4:103", "29:45"];

      const randomRef = salahFastingVerses[Math.floor(Math.random() * salahFastingVerses.length)];

      const response = await fetch(
        `https://api.alquran.cloud/v1/ayah/${randomRef}/editions/quran-uthmani,en.sahih`
      );
      const json = await response.json();

      if (json.status === "OK") {
        const newVerse = {
          arabic: json.data[0].text,
          english: json.data[1].text,
          ref: `${json.data[0].surah.englishName} ${json.data[0].numberInSurah}`,
          fetchedAt: now,
        };

        await firestore().collection("appData").doc("dailyVerse").set(newVerse);
        setVerse({ arabic: newVerse.arabic, english: newVerse.english, ref: newVerse.ref });
        Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
      }
    } catch (error) {
      console.error("Verse fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePressAnywhere = async () => {  
    setLoading(true);

    const user = auth().currentUser;
    try {
      if (user) {
        const userDocRef = firestore().collection("users").doc(user.uid);
        const userDocSnapshot = await userDocRef.get();
        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();

          if (userData.setupComplete) {
            router.replace('/DailyChart');
          } else if (userData.madhab) {
            await userDocRef.set({ setupComplete: true }, { merge: true });
            router.replace('/DailyChart');
          } else {
            router.replace('/Setup');
          }
        } else {
          router.replace('/Setup');
        }
      } else {
        router.replace('/SignUp');
      }
    } catch (error) {
      router.replace('/SignUp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      activeOpacity={1} 
      style={styles.container} 
      onPress={handlePressAnywhere}
    >
      <Text style={styles.logoText}>iQadha</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#EEEEEE" style={{ marginTop: 50 }} />
      ) : (
        <Animated.View style={[styles.verseContainer, { opacity: fadeAnim }]}>
          <Text style={styles.arabicText}>{verse.arabic}</Text>
          <Text style={styles.englishText}>"{verse.english}"</Text>
          <Text style={styles.reference}>— {verse.ref}</Text>
          
          <Text style={styles.tapText}>Tap anywhere to continue</Text>
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
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  }
});

export default SelectLanguage;