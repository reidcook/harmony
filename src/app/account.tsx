import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuthUser } from '@/hooks/use-auth-user';
import { useSyncStatus } from '@/hooks/use-sync-status';
import { confirmAction } from '@/lib/confirm';
import { supabase } from '@/lib/supabase';
import { flushBeforeLogout, logOutAndClear, syncNow } from '@/lib/sync';

const formatTime = (ms: number) =>
  new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export default function Account() {
  const user = useAuthUser();
  const status = useSyncStatus();
  const [loggingOut, setLoggingOut] = useState(false);

  const logOut = async () => {
    setLoggingOut(true);
    const unsynced = await flushBeforeLogout();
    const finish = async () => {
      await logOutAndClear();
      router.back();
    };
    if (unsynced === 0) {
      await finish();
      return;
    }
    setLoggingOut(false);
    confirmAction(
      'Log out without backing up?',
      'Some recent changes haven’t reached your account yet and will be lost. Connect to the internet first to keep them.',
      'Log out',
      () => void finish()
    );
  };

  const statusText =
    status.state === 'syncing'
      ? 'Backing up…'
      : status.state === 'error'
        ? 'Couldn’t reach the server. Changes are saved on this phone and will upload later.'
        : status.lastSyncedAt
          ? `Backed up at ${formatTime(status.lastSyncedAt)}`
          : 'Backed up to your account';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <SymbolView
            name={
              user
                ? { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }
                : { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }
            }
            tintColor={user ? Colors.accentDeep : Colors.accent}
            size={64}
          />
          <Text style={styles.title}>{user ? 'Your account' : 'Not logged in'}</Text>
          {user?.email && <Text style={styles.email}>{user.email}</Text>}
        </View>

        {!supabase ? (
          <View style={styles.card}>
            <Text style={styles.body}>Backup isn’t available in this version of the app.</Text>
          </View>
        ) : user ? (
          <>
            <View style={[styles.card, styles.statusCard]}>
              <SymbolView
                name={
                  status.state === 'error'
                    ? { ios: 'icloud.slash', android: 'cloud_off', web: 'cloud_off' }
                    : { ios: 'checkmark.icloud', android: 'cloud_done', web: 'cloud_done' }
                }
                tintColor={status.state === 'error' ? Colors.textMuted : Colors.accentDeep}
                size={24}
              />
              <Text style={styles.statusText}>{statusText}</Text>
            </View>

            <Pressable
              onPress={() => void syncNow()}
              disabled={status.state === 'syncing'}
              style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
              {status.state === 'syncing' ? (
                <ActivityIndicator color={Colors.accentDeep} />
              ) : (
                <Text style={styles.secondaryText}>Sync now</Text>
              )}
            </Pressable>

            <Pressable
              onPress={logOut}
              disabled={loggingOut}
              style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}>
              {loggingOut ? (
                <ActivityIndicator color={Colors.danger} />
              ) : (
                <Text style={styles.logOutText}>Log out</Text>
              )}
            </Pressable>
            <Text style={styles.hint}>
              Logging out removes your data from this phone. It stays safe in your account.
            </Text>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.body}>
                Your progress is only saved on this phone. Log in to back it up and keep it if you
                switch phones.
              </Text>
            </View>
            <Pressable
              onPress={() => router.push('/sign-in')}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Log in to back up</Text>
            </Pressable>
          </>
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
    gap: 6,
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  email: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
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
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.track,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.accentDeep,
  },
  logOut: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  logOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
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
