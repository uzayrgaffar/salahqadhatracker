import { AppProvider } from './AppContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export default function App() {

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || "iQadha",
        remoteMessage.notification?.body || "It is time for Salah."
      );
    });

    const requestUserPermission = async () => {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Authorization status:', authStatus);
      }
    };

    requestUserPermission();

    return unsubscribe;
  }, []);

  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#5CB390" />
      </SafeAreaProvider>
    </AppProvider>
  );
}