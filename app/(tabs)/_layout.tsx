import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs'

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="DailyChart">
        <Label>Daily Salah</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Progress">
        <Label>Progress</Label>
        <Icon sf="chart.bar.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="QadhaFasts">
        <Label>Fasts</Label>
        <Icon sf="moon.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Forum">
        <Label>FAQ</Label>
        <Icon sf="bubble.left.and.bubble.right.fill" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="Profile">
        <Label>Profile</Label>
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}