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
  canChangeSessionOn,
  formatDayHeading,
  formatMinutes,
  fromDateKey,
  getMonthGrid,
  minutesByDate,
  MONTHS,
  SESSION_LOCK_MESSAGE,
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
  // The day whose sessions are listed; null lists the whole month
  const [selected, setSelected] = useState<string | null>(null);

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
            selected={selected}
            onSelect={setSelected}
            onPrev={() => {
              setSelected(null);
              setMonthsBack((n) => n + 1);
            }}
            onNext={() => {
              setSelected(null);
              setMonthsBack((n) => Math.max(0, n - 1));
            }}
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
  selected: string | null;
  onSelect: (date: string | null) => void;
  onPrev: () => void;
  onNext: () => void;
};

function Month({ today, sessions, monthsBack, selected, onSelect, onPrev, onNext }: MonthProps) {
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
  const canAdd = !selected || canChangeSessionOn(selected, today);
  // A day's sessions read in the order they were logged
  const listed = selected
    ? monthSessions.filter((s) => s.date === selected).reverse()
    : monthSessions;

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
            const isSelected = date === selected;
            return (
              <Pressable
                key={date}
                disabled={isFuture}
                // Tapping the selected day again goes back to the whole month
                onPress={() => onSelect(isSelected ? null : date)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  isToday && styles.today,
                  isSelected && styles.selectedDay,
                  isFuture && styles.disabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Show study sessions for ${formatDayHeading(date)}`}>
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

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {selected ? formatDayHeading(selected) : 'Sessions'}
        </Text>
        <Pressable
          // Logs to the selected day, or to today when the whole month is showing
          onPress={() =>
            router.push(
              selected ? { pathname: '/add-session', params: { date: selected } } : '/add-session'
            )
          }
          disabled={!canAdd}
          hitSlop={10}
          style={({ pressed }) => [
            styles.addButton,
            !canAdd && styles.disabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          accessibilityLabel={selected ? 'Add a session to this day' : 'Add a session'}>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            tintColor={Colors.card}
            size={20}
          />
        </Pressable>
      </View>
      {!canAdd && <Text style={styles.addLimit}>{SESSION_LOCK_MESSAGE}</Text>}

      {listed.map((session) => {
          const linked = upcomings.filter((u) => session.upcomingIds.includes(u.id));
          return (
            <Pressable
              key={session.id}
              // Sessions on older days are locked
              disabled={!canChangeSessionOn(session.date, today)}
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
      }

      {selected && (
        <View style={[styles.card, styles.dayTotal]}>
          <DayHeart minutes={totals.get(selected) ?? 0} size={26} />
          <Text style={styles.summary}>
            {formatMinutes(totals.get(selected) ?? 0)} studied this day
          </Text>
        </View>
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
    paddingVertical: 4,
    borderRadius: 12,
    // Always there so selecting a day doesn't shift the grid
    borderWidth: 2,
    borderColor: 'transparent',
  },
  today: {
    backgroundColor: Colors.background,
  },
  dayNumber: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  selectedDay: {
    borderColor: Colors.accentDeep,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: '800',
    color: Colors.text,
  },
  addLimit: {
    marginTop: -8,
    fontSize: 13,
    color: Colors.textMuted,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDeep,
  },
  dayTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
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
