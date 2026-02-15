import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Icon from "react-native-vector-icons/Ionicons";

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const validateInputs = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password.trim()) {
      Alert.alert("Input Error", "Email and password cannot be empty");
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
    
    return true;
  };

  const handleAuthError = (error) => {
    console.log("Login Error Code:", error.code); // Good for debugging
    
    let title = "Authentication Error";
    let message = "An unexpected error occurred. Please try again.";
    
    switch (error.code) {
      // The modern, consolidated error code
      case 'auth/invalid-credential':
        message = "The email or password you entered is incorrect.";
        break;
      
      // Legacy error codes (still good to keep for compatibility)
      case 'auth/user-not-found':
        message = "No account found with this email address.";
        break;
      case 'auth/wrong-password':
        message = "Incorrect password. Please try again.";
        break;
      
      // Other common errors
      case 'auth/invalid-email':
        message = "That email address is invalid.";
        break;
      case 'auth/user-disabled':
        message = "This account has been disabled. Please contact support.";
        break;
      case 'auth/too-many-requests':
        title = "Too Many Attempts";
        message = "Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.";
        break;
      case 'auth/network-request-failed':
        title = "Connection Error";
        message = "Please check your internet connection and try again.";
        break;
    }
    
    Alert.alert(title, message);
  };

  const signIn = async () => {
    if (!validateInputs()) return;
    
    setLoading(true);
    try {
      // Ensure we use trimmed email
      await auth().signInWithEmailAndPassword(email.trim(), password);
      navigation.replace("MainPages", { screen: "Daily Chart" });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        
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

        <TouchableOpacity 
          style={[styles.signInButton, loading && styles.disabledButton]} 
          onPress={signIn} 
          disabled={loading}
          activeOpacity={0.8}
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
          <Text style={styles.switchButtonText}>Need an account? <Text style={{fontWeight: '700'}}>Sign Up</Text></Text>
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
  signInButton: {
    backgroundColor: "#5CB390",
    height: 56,
    borderRadius: 12,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: "#A7D7C3",
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
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

export default Login;