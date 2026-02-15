import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Linking } from 'react-native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import Icon from "react-native-vector-icons/Ionicons";

const SignUp = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Input Error", "All fields are required");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Input Error", "Please enter a valid email address");
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert("Input Error", "Password must be at least 6 characters long");
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert("Input Error", "Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleAuthError = (error) => {
    console.log("Signup Error Code:", error.code);
    let message = "Something went wrong. Please try again.";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = "This email is already registered. Please sign in instead.";
        break;
      case 'auth/weak-password':
        message = "Password is too weak. Please use at least 6 characters.";
        break;
      case 'auth/invalid-email':
        message = "The email address is badly formatted.";
        break;
      case 'auth/network-request-failed':
        message = "Network error. Please check your connection.";
        break;
      default:
        message = error.message;
        break;
    }
    
    Alert.alert("Authentication Error", message);
  };

  const signUp = async () => {
    if (!validateInputs()) return;

    Alert.alert(
      "Data Usage Consent",
      "To provide and improve app functionality, we collect and store certain data. Your information will never be sold or shared with third parties.",
      [
        {
          text: "Privacy Policy",
          onPress: () => Linking.openURL("https://www.termsfeed.com/live/60b07c67-c303-41bc-9f7c-e39397a3fc1e"),
        },
        { text: "Decline", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            setLoading(true);
            try {
              const userCredential = await auth().createUserWithEmailAndPassword(email.trim(), password);
              const user = userCredential.user;
              
              await firestore().collection("users").doc(user.uid).set({
                isAnonymous: false,
                email: user.email,
                createdAt: firestore.FieldValue.serverTimestamp()
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

  const signInAnonymouslyHandler = async () => {
    Alert.alert(
      "Data Usage Consent",
      "To provide app functionality, we collect certain data. Review our Privacy Policy for details.",
      [
        {
          text: "Privacy Policy",
          onPress: () => Linking.openURL("https://www.termsfeed.com/live/60b07c67-c303-41bc-9f7c-e39397a3fc1e"),
        },
        { text: "Decline", style: "cancel" },
        {
          text: "Accept",
          onPress: () => {
            Alert.alert(
              "Anonymous Account",
              "With an anonymous account, your data is linked to this device only. Continue?",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Continue",
                  onPress: async () => {
                    setLoading(true);
                    try {
                      const userCredential = await auth().signInAnonymously();
                      await firestore().collection("users").doc(userCredential.user.uid).set({
                        isAnonymous: true,
                        createdAt: firestore.FieldValue.serverTimestamp()
                      });
                      navigation.replace("SetDOB");
                    } catch (error) {
                      Alert.alert("Error", "Failed to sign in anonymously.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name={showPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#5CB390" 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            style={styles.passwordInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />
          <TouchableOpacity 
            style={styles.toggleButton} 
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon 
              name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
              size={22} 
              color="#5CB390" 
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.disabledButton]} 
          onPress={signUp} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={signInAnonymouslyHandler} 
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>Continue Without Sign up</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.switchButton} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.switchButtonText}>Already have an account? <Text style={{fontWeight: '700'}}>Sign In</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 32,
  },
  input: {
    width: "100%",
    height: 56,
    borderColor: "#E5E7EB",
    borderWidth: 1.5,
    marginVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#000",
  },
  passwordContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 56,
    borderColor: "#E5E7EB",
    borderWidth: 1.5,
    marginVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#000",
  },
  toggleButton: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: "#5CB390",
    height: 56,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#5CB390",
    marginTop: 12,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#5CB390",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#A7D7C3",
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchButtonText: {
    color: "#5CB390",
    fontSize: 15,
  }
});

export default SignUp;