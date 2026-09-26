import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-session" options={{ presentation: 'modal' }} />
      <Stack.Screen name="day/[date]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calendar" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
