import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import App from './App';

// 1. Register the background handler
// This must be top-level and async. It handles data-only messages 
// or background tasks when the app is not in the foreground.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
  
  // Example: You could update a local Qadha counter here if needed,
  // but for simple "Adhan" alerts, the OS handles the banner for you.
});

registerRootComponent(App);