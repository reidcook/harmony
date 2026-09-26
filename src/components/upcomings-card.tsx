import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UpcomingPill } from '@/components/upcoming-pill';
import { Colors } from '@/constants/theme';
import { useUpcomings } from '@/hooks/use-upcomings';
import { daysUntil, formatDayHeading, formatDaysAway } from '@/lib/study-sessions';
import { nextUpcomings } from '@/lib/upcomings';

type Props = {
  today: string | null;
};

// The three soonest quizzes/exams/finals
export function UpcomingsCard({ today }: Props) {
  const upcomings = useUpcomings();
  const soonest = today ? nextUpcomings(upcomings, today, 3) : [];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming</Text>
        <Pressable
          onPress={() => router.push('/add-upcoming')}
          hitSlop={10}
          style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Add a quiz, exam, or final">
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
      </View>

      {today && soonest.length === 0 && (
        <Text style={styles.empty}>Nothing scheduled. Add a quiz, exam, or final.</Text>
      )}

      {today &&
        soonest.map((upcoming) => {
          const days = daysUntil(today, upcoming.date);
          return (
            <Pressable
              key={upcoming.id}
              onPress={() =>
                router.push({ pathname: '/upcoming/[id]', params: { id: upcoming.id } })
              }
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              accessibilityRole="button">
              <View style={styles.rowText}>
                <UpcomingPill type={upcoming.type} />
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {upcoming.title}
                </Text>
                <Text style={styles.rowDate}>{formatDayHeading(upcoming.date)}</Text>
              </View>
              <View style={styles.countdown}>
                {days > 1 ? (
                  <>
                    <Text style={styles.countdownNumber}>{days}</Text>
                    <Text style={styles.countdownLabel}>days</Text>
                  </>
                ) : (
                  <Text style={styles.countdownSoon}>{formatDaysAway(days)}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  rowDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  countdown: {
    alignItems: 'center',
    minWidth: 56,
  },
  countdownNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  countdownLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  countdownSoon: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  pressed: {
    opacity: 0.7,
  },
});
