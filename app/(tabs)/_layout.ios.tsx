import { NativeTabs } from 'expo-router/unstable-native-tabs'

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor="#5CB390"
      rippleColor="rgba(92, 179, 144, 0.2)"
    >
      <NativeTabs.Trigger name="DailyChart">
        <NativeTabs.Trigger.Label>Daily Salah</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'sun.horizon', selected: 'sun.horizon.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Progress">
        <NativeTabs.Trigger.Label>Progress</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="QadhaFasts">
        <NativeTabs.Trigger.Label>Fasts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'moon.stars', selected: 'moon.stars.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Forum">
        <NativeTabs.Trigger.Label>FAQ</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'bubble.left', selected: 'bubble.left.fill' }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon 
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}