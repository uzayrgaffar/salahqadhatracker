import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from "firebase/firestore";

const SelectLanguage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const isMounted = useRef(true);

  useEffect(() => {
    // Setup fade-in animation on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePress = async () => {
    if (loading) return; // Prevent multiple presses
    
    setLoading(true);
    const user = auth.currentUser;

    try {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          const userData = userDocSnapshot.data();
          navigation.replace(userData.dob && userData.yearsMissed !== undefined ? "MainPages" : "SetDOB");
        } else {
          navigation.replace("SetDOB");
        }
      } else {
        navigation.replace("Login");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      navigation.replace("Login");
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.7} // Optional: slight feedback on press
    >
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
            iQadha
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
            Tap anywhere to continue
          </Animated.Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#5CB390',
  },
  title: {
    color: '#EEEEEE',
    fontSize: 70,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#EEEEEE',
    fontSize: 24,
    marginTop: 20,
  },
});

export default SelectLanguage;