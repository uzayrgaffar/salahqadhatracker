import 'react-native-gesture-handler';
import messaging from '@react-native-firebase/messaging';

// Background handler MUST stay top-level
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);
});

import 'expo-router/entry';