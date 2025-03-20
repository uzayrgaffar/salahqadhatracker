import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, Linking } from 'react-native';
import { auth, db } from '../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Basic validation function
  const validateInputs = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Input Error", "Email and password cannot be empty");
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Input Error", "Please enter a valid email address");
      return false;
    }
    
    // Password length validation
    if (password.length < 6) {
      Alert.alert("Input Error", "Password must be at least 6 characters long");
      return false;
    }
    
    return true;
  };

  const handleAuthError = (error) => {
    console.log("Auth error:", error.code);
    let message = "Something went wrong. Please try again.";
    
    // Authentication error codes
    switch (error.code) {
      // Email-related errors
      case 'auth/invalid-email':
        message = "Invalid email format. Please enter a valid email address.";
        break;
      case 'auth/user-disabled':
        message = "This account has been disabled. Please contact support.";
        break;
      case 'auth/user-not-found':
        message = "No account found with this email. Please sign up.";
        setIsSignUp(true);
        break;
      case 'auth/email-already-in-use':
        message = "This email is already registered. Please sign in instead.";
        setIsSignUp(false);
        break;
      
      // Password-related errors
      case 'auth/wrong-password':
        message = "Incorrect password. Please try again.";
        break;
      case 'auth/weak-password':
        message = "Password is too weak. It should be at least 6 characters.";
        break;
      case 'auth/missing-password':
        message = "Please enter a password.";
        break;
      
      // Account-related errors
      case 'auth/account-exists-with-different-credential':
        message = "An account already exists with the same email but different sign-in credentials.";
        break;
      case 'auth/operation-not-allowed':
        message = "This operation is not allowed. Please contact support.";
        break;
      
      // Network and rate-limiting errors
      case 'auth/network-request-failed':
        message = "Network error. Please check your internet connection.";
        break;
      case 'auth/too-many-requests':
        message = "Too many failed login attempts. Please try again later or reset your password.";
        break;
      case 'auth/internal-error':
        message = "An internal error occurred. Please try again later.";
        break;
        
      // Timeout errors
      case 'auth/timeout':
        message = "The operation has timed out. Please try again.";
        break;
        
      // Other specific errors
      case 'auth/invalid-credential':
        message = "The authentication credential is invalid. Please try again.";
        break;
      case 'auth/invalid-verification-code':
        message = "The verification code is invalid. Please try again.";
        break;
      case 'auth/invalid-verification-id':
        message = "The verification ID is invalid. Please try again.";
        break;
      case 'auth/requires-recent-login':
        message = "This operation requires recent authentication. Please log in again.";
        break;
        
      // Default case for any other errors
      default:
        message = `Authentication error (${error.code}). Please try again.`;
        break;
    }
    
    Alert.alert("Authentication Error", message);
  };

  const handleUserNavigation = async (user) => {
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (userDoc.exists()) {
        navigation.replace("MainPages", { screen: "Daily Chart" });
      } else {
        await setDoc(userDocRef, {
          email: user.email,
          createdAt: Timestamp.now()
        });
  
        navigation.replace("SetDOB");
      }
    } catch (error) {
      console.error("Navigation error:", error);
      Alert.alert("Error", "Could not retrieve user data. Please try again.");
    }
  };
  

  const signIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await handleUserNavigation(user);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          "Account Not Found", 
          "Would you like to create a new account with this email?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Yes", onPress: () => setIsSignUp(true) }
          ]
        );
      } else {
        handleAuthError(error);
      }
    } finally {
      setLoading(false);
    }
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
            
            // Create the user document
            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
              email: user.email,
              createdAt: Timestamp.now()
            });

            navigation.replace("SetDOB");
          } catch (error) {
            handleAuthError(error);
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};
  

  const handleSubmit = () => {
    if (isSignUp) {
      signUp();
    } else {
      signIn();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>{isSignUp ? "Create Account" : "Sign In"}</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor="#666666"
        />
        
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          autoCapitalize="none"
          placeholderTextColor="#666666"
        />
        
        <TouchableOpacity 
          style={styles.signInButton} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchButtonText}>
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </Text>
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
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333333"
  },
  input: {
    width: "100%",
    height: 50,
    borderColor: "#5CB390",
    borderWidth: 1,
    marginVertical: 10,
    padding: 15,
    borderRadius: 4,
    fontSize: 16,
    color: "#333333",
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

export default Login;