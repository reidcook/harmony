import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useReminders } from '@/hooks/use-reminders';
import {
  disableReminders,
  enableReminders,
  markRemindersAsked,
  notificationsSupported,
} from '@/lib/reminders';

// Turns the gentle study reminder on or off. Opened with ?welcome=1 on first launch.
export default function Reminders() {
  const { welcome } = useLocalSearchParams<{ welcome?: string }>();
  const isWelcome = welcome === '1';
  const { enabled } = useReminders();
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  const turnOn = async () => {
    setBusy(true);
    const result = await enableReminders();
    setBusy(false);
    setDenied(result === 'denied');
    if (result === 'enabled' && isWelcome) router.back();
  };

  const toggle = async (on: boolean) => {
    if (on) return turnOn();
    setDenied(false);
    await disableReminders();
  };

  const notNow = () => {
    markRemindersAsked();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={isWelcome ? notNow : () => router.back()} hitSlop={12}>
            <Text style={styles.link}>{isWelcome ? 'Skip' : 'Done'}</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Image
            source={require('@/assets/harmony/heartprogress.png')}
            style={styles.mascot}
            contentFit="contain"
            accessibilityLabel="Harmony, a pink heart wearing a nurse's cap"
          />
          <Text style={styles.title}>Reminders</Text>
          <Text style={styles.subtitle}>
            Just sends a quick reminder, in case you forgot to log a session. Don't worry I won't bother you too much, you need to rest sometimes too!
          </Text>
        </View>

        {!notificationsSupported ? (
          <View style={styles.card}>
            <Text style={styles.body}>Reminders are available in the phone app.</Text>
          </View>
        ) : isWelcome ? (
          <>
            <Pressable
              onPress={turnOn}
              disabled={busy}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              {busy ? (
                <ActivityIndicator color={Colors.card} />
              ) : (
                <Text style={styles.primaryText}>Turn on reminders</Text>
              )}
            </Pressable>
            <Pressable onPress={notNow} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
              <Text style={styles.link}>Not now</Text>
            </Pressable>
            <Text style={styles.hint}>You can change this anytime from your account.</Text>
          </>
        ) : (
          <View style={[styles.card, styles.row]}>
            <Text style={styles.rowText}>Remind me after 2 quiet days</Text>
            <Switch
              value={enabled}
              onValueChange={toggle}
              disabled={busy}
              trackColor={{ true: Colors.accentDeep, false: Colors.track }}
            />
          </View>
        )}

        {denied && (
          <View style={styles.card}>
            <Text style={styles.body}>
              Notifications are turned off for Harmony on this phone. You can allow them in
              Settings.
            </Text>
            <Pressable onPress={() => void Linking.openSettings()} hitSlop={8}>
              <Text style={[styles.link, styles.settingsLink]}>Open Settings</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  mascot: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center',
    color: Colors.textMuted,
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  settingsLink: {
    fontSize: 15,
  },
  primary: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  secondary: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.textMuted,
  },
});
