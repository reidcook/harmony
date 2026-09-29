import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DayHeart } from '@/components/day-heart';
import { Colors } from '@/constants/theme';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useUpcomings } from '@/hooks/use-upcomings';
import {
  formatDayHeading,
  formatMinutes,
  fromDateKey,
  getMonthGrid,
  minutesByDate,
  MONTHS,
  type StudySession,
  toDateKey,
} from '@/lib/study-sessions';
import { UPCOMING_TYPES } from '@/lib/upcomings';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Calendar() {
  const today = useToday();
  const sessions = useStudySessions();
  // Months back from the current one; 0 is this month
  const [monthsBack, setMonthsBack] = useState(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        {/* The month depends on today's date, which the static web render doesn't know */}
        {today && (
          <Month
            today={today}
            sessions={sessions}
            monthsBack={monthsBack}
            onPrev={() => setMonthsBack((n) => n + 1)}
            onNext={() => setMonthsBack((n) => Math.max(0, n - 1))}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type MonthProps = {
  today: string;
  sessions: StudySession[];
  monthsBack: number;
  onPrev: () => void;
  onNext: () => void;
};

function Month({ today, sessions, monthsBack, onPrev, onNext }: MonthProps) {
  const now = fromDateKey(today);
  const shown = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const cells = getMonthGrid(shown.getFullYear(), shown.getMonth());
  const totals = minutesByDate(sessions);
  const upcomings = useUpcomings();

  // Date keys are YYYY-MM-DD, so the month prefix picks out this month's sessions
  const monthPrefix = toDateKey(shown).slice(0, 7);
  const monthSessions = sessions
    .filter((s) => s.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);

  const monthDates = cells.filter((d): d is string => d !== null);
  const daysStudied = monthDates.filter((d) => (totals.get(d) ?? 0) > 0).length;
  const monthMinutes = monthDates.reduce((sum, d) => sum + (totals.get(d) ?? 0), 0);

  return (
    <>
      <View style={styles.monthNav}>
        <Pressable
          onPress={onPrev}
          hitSlop={10}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={Colors.accentDeep}
            size={22}
          />
        </Pressable>
        <Text style={styles.title}>
          {MONTHS[shown.getMonth()]} {shown.getFullYear()}
        </Text>
        <Pressable
          onPress={onNext}
          disabled={monthsBack === 0}
          hitSlop={10}
          style={({ pressed }) => [
            styles.navButton,
            monthsBack === 0 && styles.disabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Next month">
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={Colors.accentDeep}
            size={22}
          />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.grid}>
          {DAY_LETTERS.map((letter, i) => (
            <Text key={`letter-${i}`} style={[styles.cell, styles.weekday]}>
              {letter}
            </Text>
          ))}
          {cells.map((date, i) => {
            if (!date) return <View key={`blank-${i}`} style={styles.cell} />;

            const isToday = date === today;
            const isFuture = date > today;
            return (
              <Pressable
                key={date}
                disabled={isFuture}
                onPress={() => router.push({ pathname: '/day/[date]', params: { date } })}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  isToday && styles.today,
                  isFuture && styles.disabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`View study sessions for ${date}`}>
                <Text style={[styles.dayNumber, isToday && styles.todayNumber]}>
                  {fromDateKey(date).getDate()}
                </Text>
                <DayHeart minutes={totals.get(date) ?? 0} size={22} />
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.summary}>
          {daysStudied} {daysStudied === 1 ? 'day' : 'days'} studied ·{' '}
          {formatMinutes(monthMinutes)} total
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Sessions</Text>
      {monthSessions.length === 0 ? (
        <Text style={styles.empty}>No study sessions this month.</Text>
      ) : (
        monthSessions.map((session) => {
          const linked = upcomings.filter((u) => session.upcomingIds.includes(u.id));
          return (
            <Pressable
              key={session.id}
              onPress={() =>
                router.push({ pathname: '/add-session', params: { id: session.id } })
              }
              style={({ pressed }) => [styles.sessionCard, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityHint="Edit or delete this session">
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>{formatDayHeading(session.date)}</Text>
                <Text style={styles.sessionDuration}>{formatMinutes(session.minutes)}</Text>
              </View>
              <Text style={session.description ? styles.description : styles.noDescription}>
                {session.description || 'No description'}
              </Text>
              {linked.length > 0 && (
                <View style={styles.upcomingTags}>
                  {linked.map((upcoming) => (
                    <Text key={upcoming.id} style={styles.upcomingTag}>
                      For {UPCOMING_TYPES[upcoming.type].emoji} {upcoming.title}
                    </Text>
                  ))}
                </View>
              )}
            </Pressable>
          );
        })
      )}
    </>
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
  close: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.track,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  card: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  weekday: {
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textMuted,
  },
  day: {
    gap: 2,
    paddingVertical: 6,
    borderRadius: 12,
  },
  today: {
    backgroundColor: Colors.background,
  },
  dayNumber: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  todayNumber: {
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  disabled: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.6,
  },
  summary: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    color: Colors.text,
  },
  sectionTitle: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  empty: {
    textAlign: 'center',
    fontSize: 15,
    color: Colors.textMuted,
  },
  sessionCard: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  sessionDate: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  sessionDuration: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.text,
  },
  noDescription: {
    fontSize: 15,
    fontStyle: 'italic',
    color: Colors.textMuted,
  },
  upcomingTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  upcomingTag: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.accentDeep,
    backgroundColor: Colors.track,
  },
});
