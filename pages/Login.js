import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import Icon from "react-native-vector-icons/Ionicons";

const Login = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isForgotModalVisible, setIsForgotModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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
    console.log("Login Error Code:", error.code);
    
    let title = "Authentication Error";
    let message = "An unexpected error occurred. Please try again.";
    
    switch (error.code) {
      case 'auth/invalid-credential':
        message = "The email or password you entered is incorrect.";
        break;
      case 'auth/user-not-found':
        message = "No account found with this email address.";
        break;
      case 'auth/wrong-password':
        message = "Incorrect password. Please try again.";
        break;
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
      await auth().signInWithEmailAndPassword(email.trim(), password);
      navigation.replace("MainPages", { screen: "Daily Chart" });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // If valid email already in the field, send directly without showing modal
    if (trimmedEmail && emailRegex.test(trimmedEmail)) {
      sendResetEmail(trimmedEmail);
      return;
    }

    // Pre-fill modal with whatever they've typed so far
    setResetEmail(trimmedEmail);
    setIsForgotModalVisible(true);
  };

  const sendResetEmail = async (emailAddress) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = emailAddress?.trim();

    if (!cleaned || !emailRegex.test(cleaned)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setResetLoading(true);
    try {
      await auth().sendPasswordResetEmail(cleaned);
      setIsForgotModalVisible(false);
      setResetEmail('');
      Alert.alert(
        "Email Sent",
        `A password reset link has been sent to ${cleaned} if an account exists. Check your inbox.`
      );
    } catch (error) {
      console.log("Reset Error Code:", error.code);
      let message = "Something went wrong. Please try again.";
      switch (error.code) {
        case 'auth/user-not-found':
          message = "No account found with that email address.";
          break;
        case 'auth/invalid-email':
          message = "Please enter a valid email address.";
          break;
        case 'auth/network-request-failed':
          message = "Please check your internet connection and try again.";
          break;
        case 'auth/too-many-requests':
          message = "Too many requests. Please wait a moment and try again.";
          break;
      }
      Alert.alert("Reset Failed", message);
    } finally {
      setResetLoading(false);
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
          style={styles.forgotButton}
          onPress={handleForgotPassword}
          disabled={resetLoading}
          activeOpacity={0.7}
        >
          {resetLoading ? (
            <ActivityIndicator size="small" color="#5CB390" />
          ) : (
            <Text style={styles.forgotButtonText}>Forgot password?</Text>
          )}
        </TouchableOpacity>

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

      {/* Forgot Password Modal — matches Profile page modal style exactly */}
      <Modal visible={isForgotModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSub}>Enter your email address and we'll send you a reset link.</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.modalInput}
                placeholder="Email address"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setIsForgotModalVisible(false);
                  setResetEmail('');
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.sendBtn, (!resetEmail.trim() || resetLoading) && styles.sendBtnDisabled]}
                onPress={() => sendResetEmail(resetEmail)}
                disabled={!resetEmail.trim() || resetLoading}
              >
                {resetLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sendBtnText}>Send Link</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  forgotButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 28,
    justifyContent: 'center',
  },
  forgotButtonText: {
    color: "#5CB390",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    backgroundColor: "#5CB390",
    height: 56,
    borderRadius: 12,
    marginTop: 16,
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
  },

  // Modal — matches Profile page exactly
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    padding: 12,
    color: '#000',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  sendBtn: {
    backgroundColor: '#5CB390',
  },
  sendBtnDisabled: {
    backgroundColor: '#A7D7C3',
  },
  cancelBtnText: {
    color: '#4B5563',
    fontWeight: '600',
  },
  sendBtnText: {
    color: '#FFF',
    fontWeight: '600',
  },
});

export default Login;