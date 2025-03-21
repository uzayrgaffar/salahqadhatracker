// SignUp.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Linking } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../FirebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { doc, setDoc, Timestamp } from "firebase/firestore";

const SignUp = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Input Error", "Email and password cannot be empty");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Input Error", "Please enter a valid email address");
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert("Input Error", "Password must be at least 6 characters long");
      return false;
    }
    
    return true;
  };

  const handleAuthError = (error) => {
    let message = "Something went wrong. Please try again.";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = "This email is already registered. Please sign in instead.";
        break;
      case 'auth/weak-password':
        message = "Password is too weak. It should be at least 6 characters.";
        break;
      default:
        message = `Authentication error (${error.code}). Please try again.`;
        break;
    }
    
    Alert.alert("Authentication Error", message);
  };

  const signUp = async () => {
    if (!validateInputs()) return;

    Alert.alert(
      "Data Usage Consent",
      "To provide and improve app functionality, we collect and store certain data. Your information will never be sold or shared with third parties. You can review our Privacy Policy for more details.",
      [
        {
          text: "Privacy Policy",
          onPress: () => Linking.openURL("https://www.termsfeed.com/live/60b07c67-c303-41bc-9f7c-e39397a3fc1e"),
        },
        {
          text: "Decline",
          style: "cancel",
          onPress: () => console.log("User declined consent"),
        },
        {
          text: "Accept",
          onPress: async () => {
            setLoading(true);
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;
              
              const userDocRef = doc(db, "users", user.uid);
              await setDoc(userDocRef, {
                email: user.email,
                createdAt: Timestamp.now()
              });
                
              setLoading(false);
              navigation.navigate("SetDOB");
            } catch (error) {
              handleAuthError(error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
        />

        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={signUp} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Create Account</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.switchButtonText}>Already have an account? Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#5CB390",
    borderWidth: 1,
    marginVertical: 10,
    padding: 15,
    borderRadius: 4,
  },
  signInButton: {
    backgroundColor: "#5CB390",
    padding: 15,
    borderRadius: 4,
    marginVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 15,
    padding: 10,
  },
  switchButtonText: {
    color: "#5CB390",
    fontSize: 16,
  }
});

export default SignUp;