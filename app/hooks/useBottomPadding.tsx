import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export const useBottomPadding = (android: number, ios: number) => {
  const insets = useSafeAreaInsets()
  
  if (Platform.OS === 'android') {
    return insets.bottom + android
  }
  
  return insets.bottom + ios
}