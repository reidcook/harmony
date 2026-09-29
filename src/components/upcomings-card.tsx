import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UpcomingRow } from '@/components/upcoming-row';
import { Colors } from '@/constants/theme';
import { useUpcomings } from '@/hooks/use-upcomings';
import { nextUpcomings } from '@/lib/upcomings';

type Props = {
  today: string | null;
};

// The three soonest quizzes/exams/finals; tapping the card opens all of them
export function UpcomingsCard({ today }: Props) {
  const upcomings = useUpcomings();
  const soonest = today ? nextUpcomings(upcomings, today, 3) : [];

  return (
    <Pressable
      onPress={() => router.push('/upcomings')}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityHint="See all quizzes, exams, and finals">
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming</Text>
        <View style={styles.headerActions}>
          <Text style={styles.seeAll}>See all ›</Text>
          <Pressable
            onPress={() => router.push('/add-upcoming')}
            hitSlop={10}
            style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add a quiz, exam, or final">
            <Text style={styles.newButtonText}>+ New</Text>
          </Pressable>
        </View>
      </View>

      {today && soonest.length === 0 && (
        <Text style={styles.empty}>Nothing scheduled. Add a quiz, exam, or final.</Text>
      )}

      {today &&
        soonest.map((upcoming) => (
          <UpcomingRow key={upcoming.id} upcoming={upcoming} today={today} />
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  // Subtle, since the rows inside have their own press feedback
  cardPressed: {
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentDeep,
  },
  newButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.track,
  },
  newButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentDeep,
  },
  empty: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
