import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppProvider, AppContext } from './AppContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

// Pages 
import SelectLanguage from './pages/SelectLanguage';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Forum from './pages/Forum';
import Profile from './pages/Profile';
import SetQadhaSalah from './pages/SetQadhaSalah';
import GenderSelection from './pages/GenderSelection';
import MadhabSelection from './pages/MadhabSelection';
import SetDOB from './pages/SetDOB';
import DaysOfCycle from './pages/DaysOfCycle';
import YearsMissed from './pages/YearsMissed';
import DailyChart from './pages/DailyChart';
import Progress from './pages/Progress';
import Children from './pages/Children';
import NumberOfChildren from './pages/NumberOfChildren';
import PostNatal from './pages/PostNatal';
import SignUp from './pages/SignUp';
import Totals from './pages/Totals';
import QadhaFasts from './pages/QadhaFasts';
import QiblahCompass from './pages/QiblahCompass';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainPages = () => {
  const { selectedLanguage } = useContext(AppContext);
  const insets = useSafeAreaInsets();

  const getLabel = (routeName) => {
    const tabLabels = {
      'Daily Salah': { English: 'Daily Salah', Arabic: 'الرسم البياني اليومي', Urdu: 'یومیہ چارٹ', Hindi: 'दैनिक चार्ट' },
      'FAQ': { English: 'FAQ', Arabic: 'المنتديات', Urdu: 'فورم', Hindi: 'مंचों' },
      'Profile': { English: 'Settings', Arabic: 'الإعدادات', Urdu: 'ترتیبات', Hindi: 'सेटिंग्स' },
      'Progress': { English: 'Progress', Arabic: 'التقدم', Urdu: 'ترقی', Hindi: 'برکت' },
      'Fasts': { English: 'Fasts', Arabic: 'الصيام', Urdu: 'روزے', Hindi: 'उपवास' },
    };
    return tabLabels[routeName]?.[selectedLanguage] || routeName;
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2F7F6F',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingBottom: insets.bottom || 10,
          paddingTop: 5,
          height: 70 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen 
        name="Daily Salah" 
        component={DailyChart} 
        options={{
          tabBarLabel: getLabel('Daily Salah'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Progress" 
        component={Progress} 
        options={{
          tabBarLabel: getLabel('Progress'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trending-up" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Fasts" 
        component={QadhaFasts} 
        options={{
          tabBarLabel: getLabel('Fasts'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="moon" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="FAQ" 
        component={Forum} 
        options={{
          tabBarLabel: getLabel('FAQ'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{
          tabBarLabel: getLabel('Profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
};

const App = () => {

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
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#5CB390" />

          <Stack.Navigator>
            <Stack.Screen name="SelectLanguage" component={SelectLanguage} options={{ headerShown: false }} />
            <Stack.Screen name="Setup" component={Setup} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
            <Stack.Screen name="SignUp" component={SignUp} options={{ headerShown: false }} />
            <Stack.Screen name="MainPages" component={MainPages} options={{ headerShown: false }} />
            <Stack.Screen name="SetQadhaSalah" component={SetQadhaSalah} options={{ headerShown: false }} />
            <Stack.Screen name="SetDOB" component={SetDOB} options={{ headerShown: false }} />
            <Stack.Screen name="GenderSelection" component={GenderSelection} options={{ headerShown: false }} />
            <Stack.Screen name="MadhabSelection" component={MadhabSelection} options={{ headerShown: false }} />
            <Stack.Screen name="DaysOfCycle" component={DaysOfCycle} options={{ headerShown: false }} />
            <Stack.Screen name="Children" component={Children} options={{ headerShown: false }} />
            <Stack.Screen name="NumberOfChildren" component={NumberOfChildren} options={{ headerShown: false }} />
            <Stack.Screen name="PostNatal" component={PostNatal} options={{ headerShown: false }} />
            <Stack.Screen name="YearsMissed" component={YearsMissed} options={{ headerShown: false }} />
            <Stack.Screen name="Totals" component={Totals} options={{ headerShown: false }} />
            <Stack.Screen name="QiblahCompass" component={QiblahCompass} options={{ headerShown: false }} />
          </Stack.Navigator>

        </NavigationContainer>
      </SafeAreaProvider>
    </AppProvider>
  );
};

export default App;