import { Stack } from 'expo-router'
import { AppProvider } from '../AppContext'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor="#5CB390" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </AppProvider>
  )
}