import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
      <Stack.Screen
        name="index"
        options={{
          title: 'Login',
        }}
      />
      <Stack.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
        }}
      />
      <Stack.Screen
        name="groups"
        options={{
          title: 'Study Groups',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="ai-chat"
        options={{
          title: 'AI Study Coach',
        }}
      />
      <Stack.Screen
        name="reminders"
        options={{
          title: 'Reminders & Alarms',
        }}
      />
    </Stack>
    </SafeAreaProvider>
  );
}
