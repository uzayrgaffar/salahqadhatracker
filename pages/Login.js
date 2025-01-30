import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { GoogleSignin, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { AppContext } from '../AppContext';

const Login = ({ navigation }) => {
  const { selectedLanguage } = useContext(AppContext);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const signin = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      console.log("User Info:", user);
      setUserInfo(user);
      setError(null);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      setError(error.message);
    }
  };

  const logout = async () => {
    await GoogleSignin.revokeAccess();
    await GoogleSignin.signOut();
    setUserInfo(null);
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {userInfo ? (
        <Button title="Logout" onPress={logout} />
      ) : (
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Standard}
          color={GoogleSigninButton.Color.Dark}
          onPress={signin}
        />
      )}
      <Button title="Backup SignIn" onPress={() => navigation.navigate("SetDOB")} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#5CB390' },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10 },
});

export default Login;