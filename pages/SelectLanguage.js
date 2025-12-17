import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc } from "firebase/firestore";

const SelectLanguage = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {

      try {
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnapshot = await getDoc(userDocRef);

          if (userDocSnapshot.exists()) {
            const userData = userDocSnapshot.data();

            if (userData.dob && userData.dop && userData.gender && userData.madhab && userData.yearsMissed !== undefined) {
              navigation.replace("MainPages");
            } else {
              navigation.replace("SetDOB");
            }
          } else {
            navigation.replace("SetDOB");
          }
        } else {
          navigation.replace("Login");
        }
      } catch (error) {
        navigation.replace("Login");
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      unsubscribe();
      isMounted.current = false;
    };
  }, [navigation]);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={[styles.title]}>iQadha</Text>
      )}
    </View>
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