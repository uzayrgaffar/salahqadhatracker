import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../FirebaseConfig';
import { useNavigation } from '@react-navigation/native';

const Login = () => {
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
      case 'auth/user-not-found':
        message = "No account found with this email. Please sign up.";
        break;
      case 'auth/wrong-password':
        message = "Incorrect password. Please try again.";
        break;
      default:
        message = `Authentication error (${error.code}). Please try again.`;
        break;
    }
    
    Alert.alert("Authentication Error", message);
  };

  const signIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigation.replace("MainPages", { screen: "Daily Chart" });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        
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
          onPress={signIn} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.switchButtonText}>Need an account? Sign Up</Text>
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

export default Login;