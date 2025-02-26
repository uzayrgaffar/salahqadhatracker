import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { auth } from '../FirebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Save user session after successful login
  const saveUserSession = async (user) => {
    try {
      await AsyncStorage.setItem('userToken', user.uid);
      console.log('User session saved');
    } catch (error) {
      console.log('Error saving user session:', error);
    }
  };

  const signIn = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user);
      
      // Save user session
      await saveUserSession(userCredential.user);
      
      // Navigate to main screen after login
      navigation.navigate("SetDOB");
    } catch (error) {
      console.log(error);
      alert('Sign in failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async () => {
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('User created:', userCredential.user);
      
      // Save user session
      await saveUserSession(userCredential.user);
      
      // Navigate to main screen after signup
      navigation.navigate("SetDOB");
    } catch (error) {
      console.log(error);
      alert('Sign up failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>
          Welcome
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.signInButton]} 
            onPress={signIn}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Sign In
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.signUpButton]} 
            onPress={signUp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
        
        {isLoading && <Text style={styles.loadingText}>Processing...</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: '#5CB390',
    padding: 20
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#5CB390',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  signInButton: {
    backgroundColor: '#5CB390',
  },
  signUpButton: {
    backgroundColor: '#4A90E2',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 15,
    color: '#666',
  }
});

export default Login;