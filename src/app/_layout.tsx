import { Stack } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
// Loads the account on launch and return to the app (a no-op unless logged in)
import '@/lib/sync';

// On wide browser windows the app sits in a phone-width column instead of stretching edge to edge
const MAX_WEB_WIDTH = 480;

export default function RootLayout() {
  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add-session" options={{ presentation: 'modal' }} />
      <Stack.Screen name="day/[date]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="calendar" options={{ presentation: 'modal' }} />
      <Stack.Screen name="goal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-upcoming" options={{ presentation: 'modal' }} />
      <Stack.Screen name="upcomings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="upcoming/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="account" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
    </Stack>
  );

  if (Platform.OS !== 'web') return stack;

  return (
    <View style={styles.page}>
      <View style={styles.column}>{stack}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.track,
  },
  column: {
    flex: 1,
    width: '100%',
    maxWidth: MAX_WEB_WIDTH,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    boxShadow: '0 0 24px rgba(224, 103, 154, 0.18)',
  },
});
