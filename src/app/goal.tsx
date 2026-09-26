import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DurationPicker, useDuration } from '@/components/duration-picker';
import { Colors } from '@/constants/theme';
import { getDailyGoal, setDailyGoal } from '@/lib/daily-goal';
import { formatMinutes } from '@/lib/study-sessions';

const QUICK_PICKS = [30, 60, 120, 180, 240];

export default function Goal() {
  const duration = useDuration(getDailyGoal());
  const canSave = duration.total > 0;

  const save = () => {
    if (!canSave) return;
    setDailyGoal(duration.total);
    router.back();
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
          <Text style={styles.title}>Daily study goal</Text>
          <Text style={styles.subtitle}>
            How much do you want to study each day? Hearts fill in deep pink once you reach it.
          </Text>
        </View>

        <View style={styles.card}>
          <DurationPicker duration={duration} quickPicks={QUICK_PICKS} />
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          style={({ pressed }) => [
            styles.save,
            !canSave && styles.saveDisabled,
            pressed && styles.savePressed,
          ]}>
          <Text style={styles.saveText}>
            {canSave ? `Set goal to ${formatMinutes(duration.total)}` : 'Set goal'}
          </Text>
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
});
