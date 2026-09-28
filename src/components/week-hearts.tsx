import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DayHeart } from '@/components/day-heart';
import { Colors } from '@/constants/theme';
import { getWeekDates } from '@/lib/study-sessions';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  today: string | null;
  totals: Map<string, number>;
};

export function WeekHearts({ today, totals }: Props) {
  const week = today ? getWeekDates(today) : null;

  return (
    <Pressable
          onPress={() => router.push('/calendar')}
          hitSlop={10}
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Open monthly calendar">
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This week</Text>
          <View style={styles.calendarButton}>
          <SymbolView
            name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            tintColor={Colors.accentDeep}
            size={20}
          />
          </View>
      </View>
      <View style={styles.row}>
        {DAY_LETTERS.map((letter, i) => {
          const date = week?.[i];
          const minutes = date ? (totals.get(date) ?? 0) : 0;
          const isToday = date === today;
          const isFuture = !date || !today || date > today;

          return (
            <Pressable
              key={i}
              disabled={isFuture}
              onPress={() =>
                date && router.push({ pathname: '/day/[date]', params: { date } })
              }
              style={({ pressed }) => [
                styles.day,
                isToday && styles.today,
                isFuture && styles.future,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={date ? `View study sessions for ${date}` : undefined}>
              <DayHeart minutes={minutes} size={30} />
              <Text style={[styles.letter, isToday && styles.todayLetter]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Colors.track,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
  },
  today: {
    backgroundColor: Colors.background,
  },
  future: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.7,
  },
  letter: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  todayLetter: {
    fontWeight: '800',
    color: Colors.accentDeep,
  },
});
