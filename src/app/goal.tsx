import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DurationPicker, useDuration } from '@/components/duration-picker';
import { MIN_REWARD_GOAL_MINUTES } from '@/constants/rewards';
import { Colors } from '@/constants/theme';
import { describeError } from '@/lib/cloud';
import { awardRewards } from '@/lib/rewards';
import { formatMinutes } from '@/lib/study-sessions';
import { getWeeklyGoal, setWeeklyGoal } from '@/lib/weekly-goal';

const QUICK_PICKS = [300, 600, 900, 1200, 1800];

export default function Goal() {
  const duration = useDuration(getWeeklyGoal());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSave = duration.total > 0 && !busy;

  // Stays on this screen with an error if the save doesn't go through
  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    setError(null);
    try {
      await setWeeklyGoal(duration.total);
      // A lower goal may already be met this week
      void awardRewards();
      router.back();
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.title}>Weekly study goal</Text>
          <Text style={styles.subtitle}>
            How many hours do you want to study each week? Meet it to keep your streak going.
          </Text>
        </View>

        <View style={styles.card}>
          <DurationPicker duration={duration} quickPicks={QUICK_PICKS} />
        </View>

        {duration.total > 0 && duration.total < MIN_REWARD_GOAL_MINUTES && (
          <Text style={styles.hint}>
            Goals under {formatMinutes(MIN_REWARD_GOAL_MINUTES)} still count for your streak, but
            don’t earn hearts.
          </Text>
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.save,
            !canSave && styles.saveDisabled,
            pressed && styles.savePressed,
          ]}>
          {busy ? (
            <ActivityIndicator color={Colors.card} />
          ) : (
            <Text style={styles.saveText}>
              {canSave ? `Set goal to ${formatMinutes(duration.total)}` : 'Set goal'}
            </Text>
          )}
        </Pressable>
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
  cancel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textMuted,
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  save: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  saveDisabled: {
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  savePressed: {
    opacity: 0.8,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
});
