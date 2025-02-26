import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { AppContext } from '../AppContext';
import { auth } from '../FirebaseConfig'; // Ensure this path is correct
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

const Login = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      const user = await signInWithEmailAndPassword(auth, email, password);
      navigation.navigate('SetDOB');
    } catch (error) {
      console.error('Sign in error:', error);
      alert(`Sign in failed: ${error.message}`);
    }
  };

  const signUp = async () => {
    try {
      const user = await createUserWithEmailAndPassword(auth, email, password);
      navigation.navigate('SetDOB');
    } catch (error) {
      console.error('Sign up error:', error);
      alert(`Sign up failed: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Email</Text>
      
      <TextInput 
        placeholder="Email" 
        value={email} 
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      <Text>Password</Text>
      
      <TextInput 
        placeholder="Password" 
        value={password} 
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={signIn}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={signUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 20,
    backgroundColor: '#5CB390' 
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    padding: 8,
    backgroundColor: 'white'
  },
  button: {
    backgroundColor: '#2C5364',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5
  },
  buttonText: {
    color: 'white',
    textAlign: 'center'
  }
});

export default Login;