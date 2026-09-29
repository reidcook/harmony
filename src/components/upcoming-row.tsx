import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { UpcomingPill } from '@/components/upcoming-pill';
import { Colors } from '@/constants/theme';
import { daysUntil, formatDayHeading, formatDaysAway, formatMinutes } from '@/lib/study-sessions';
import type { Upcoming } from '@/lib/upcomings';

type Props = {
  upcoming: Upcoming;
  today: string;
  // Time studied for it, shown when given
  studiedMinutes?: number;
};

// Opens the upcoming's linked sessions
export function UpcomingRow({ upcoming, today, studiedMinutes }: Props) {
  const days = daysUntil(today, upcoming.date);

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/upcoming/[id]', params: { id: upcoming.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button">
      <View style={styles.rowText}>
        <UpcomingPill type={upcoming.type} />
        <Text style={styles.rowTitle} numberOfLines={1}>
          {upcoming.title}
        </Text>
        <Text style={styles.rowDate}>
          {formatDayHeading(upcoming.date)}
          {studiedMinutes !== undefined && ` · ${formatMinutes(studiedMinutes)} studied`}
        </Text>
      </View>
      <View style={styles.countdown}>
        {days > 1 ? (
          <>
            <Text style={styles.countdownNumber}>{days}</Text>
            <Text style={styles.countdownLabel}>days</Text>
          </>
        ) : (
          <Text style={[styles.countdownSoon, days < 0 && styles.countdownPast]}>
            {formatDaysAway(days)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  countdownPast: {
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
