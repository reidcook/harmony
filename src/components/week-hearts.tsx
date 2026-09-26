import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DAILY_GOAL_MINUTES } from '@/constants/goal';
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
    <View style={styles.card}>
      <Text style={styles.title}>This week</Text>
      <View style={styles.row}>
        {DAY_LETTERS.map((letter, i) => {
          const date = week?.[i];
          const minutes = date ? (totals.get(date) ?? 0) : 0;
          const isToday = date === today;
          const isFuture = !date || !today || date > today;
          const color =
            minutes >= DAILY_GOAL_MINUTES
              ? Colors.accentDeep
              : minutes > 0
                ? Colors.accent
                : Colors.track;

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
              <SymbolView
                name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
                tintColor={color}
                size={30}
              />
              <Text style={[styles.letter, isToday && styles.todayLetter]}>{letter}</Text>
            </Pressable>
          );
        })}
      </View>
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
    opacity: 0.6,
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
