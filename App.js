import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppProvider, AppContext } from './AppContext';
import SelectLanguage from './pages/SelectLanguage';
import Login from './pages/Login';
import Home from './pages/Home';
import Forum from './pages/Forum';
import Profile from './pages/Profile';
import SetQadhaSalah from './pages/SetQadhaSalah';
import About from './pages/About';
import GenderSelection from './pages/GenderSelection';
import MadhabSelection from './pages/MadhabSelection';
import SetDOB from './pages/SetDOB';
import DaysOfCycle from './pages/DaysOfCycle';
import YearsMissed from './pages/YearsMissed';
import DailyChart from './pages/DailyChart';
import Progress from './pages/Progress';
import Children from './pages/Children';
import NumberOfChildren from './pages/NumberOfChildren';
import { Text } from 'react-native';
import PostNatal from './pages/PostNatal';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainPages = () => {
  const { selectedLanguage } = useContext(AppContext);

  const tabLabels = {
    'Daily Chart': {
      English: 'Daily Chart',
      Arabic: 'الرسم البياني اليومي',
      Urdu: 'یومیہ چارٹ',
      Hindi: 'दैनिक चार्ट',
    },
    'FAQ': {
      English: 'FAQ',
      Arabic: 'المنتديات',
      Urdu: 'فورم',
      Hindi: 'मंचों',
    },
    'Profile': {
      English: 'Settings',  // Changed label to Settings
      Arabic: 'الإعدادات',
      Urdu: 'ترتیبات',
      Hindi: 'सेटिंग्स',
    },
    'About': {
      English: 'About',
      Arabic: 'معلومات عنا',
      Urdu: 'ہمارے بارے میں',
      Hindi: 'हमारे बारे में',
    },
    'Progress': {
      English: 'Progress',
      Arabic: 'التقدم',
      Urdu: 'ترقی',
      Hindi: 'प्रगति',
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Daily Chart') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'FAQ') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {  // Profile tab, but labeled as Settings
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'About') {
            iconName = focused ? 'information-circle' : 'information-circle-outline';
          } else if (route.name === 'Progress') {
            iconName = focused ? 'trending-up' : 'trending-up-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FBC742',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: 10,
          paddingTop: 5,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          paddingBottom: 5,
        },
        tabBarLabelPosition: "below-icon",
        tabBarLabel: ({ color }) => {
          const translatedLabel = tabLabels[route.name]?.[selectedLanguage] || route.name;
          return <Text style={{ color }}>{translatedLabel}</Text>;
        },
      })}
    >
      <Tab.Screen name="Daily Chart" component={DailyChart} options={{ headerShown: false }} />
      <Tab.Screen name="Progress" component={Progress} options={{ headerShown: false }} />
      <Tab.Screen name="FAQ" component={Forum} options={{ headerShown: false }} />
      <Tab.Screen name="Profile" component={Profile} options={{ headerShown: false }} /> 
      <Tab.Screen name="About" component={About} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <AppProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="SelectLanguage" component={SelectLanguage} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
          <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
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
          <Stack.Screen name="Progress" component={Progress} options={{ headerShown: false }}/>
        </Stack.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
};
export default App;