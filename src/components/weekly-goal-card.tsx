import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressRing } from '@/components/progress-ring';
import { Colors } from '@/constants/theme';

const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

type Props = {
  minutes: number;
  goal: number;
};

// This week's progress as a ring, with every number inside it
export function WeeklyGoalCard({ minutes, goal }: Props) {
  const progress = minutes / goal;
  const percent = Math.round(progress * 100);

  return (
    <Pressable
      onPress={() => router.push('/goal')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${percent}% of this week's goal, ${toHours(minutes)} of ${toHours(goal)} hours`}
      accessibilityHint="Change your weekly study goal">
      <View style={styles.editBadge}>
        <SymbolView
          name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
          tintColor={Colors.accentDeep}
          size={14}
        />
      </View>

      <ProgressRing progress={progress} size={116} strokeWidth={10}>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.hours}>
          {toHours(minutes)} / {toHours(goal)} hrs
        </Text>
        <Text style={styles.caption}>this week</Text>
      </ProgressRing>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  pressed: {
    opacity: 0.7,
  },
  editBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
    borderRadius: 10,
    backgroundColor: Colors.track,
  },
  percent: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  hours: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  caption: {
    fontSize: 11,
    color: Colors.textMuted,
  },
});
