import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClinicalRow } from '@/components/clinical-row';
import { DayHeart } from '@/components/day-heart';
import { UpcomingRow } from '@/components/upcoming-row';
import { Colors } from '@/constants/theme';
import { useClinicalLocations, useClinicals } from '@/hooks/use-clinicals';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useUpcomings } from '@/hooks/use-upcomings';
import { clinicalDates } from '@/lib/clinicals';
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

type Tab = 'sessions' | 'upcomings' | 'clinicals';

const TABS: { key: Tab; label: string }[] = [
  { key: 'sessions', label: 'Study' },
  { key: 'upcomings', label: 'Assessments' },
  { key: 'clinicals', label: 'Clinicals' },
];

export default function Calendar() {
  const today = useToday();
  const sessions = useStudySessions();
  // Months from the current one; 0 is this month, negative is earlier
  const [monthOffset, setMonthOffset] = useState(0);
  // The day whose items are listed; null lists the whole month
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('sessions');

  const changeMonth = (delta: number) => {
    setSelected(null);
    setMonthOffset((n) => n + delta);
  };

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
            monthOffset={monthOffset}
            selected={selected}
            tab={tab}
            onSelect={setSelected}
            onTab={setTab}
            onPrev={() => changeMonth(-1)}
            onNext={() => changeMonth(1)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type MonthProps = {
  today: string;
  sessions: StudySession[];
  monthOffset: number;
  selected: string | null;
  tab: Tab;
  onSelect: (date: string | null) => void;
  onTab: (tab: Tab) => void;
  onPrev: () => void;
  onNext: () => void;
};

function Month({
  today,
  sessions,
  monthOffset,
  selected,
  tab,
  onSelect,
  onTab,
  onPrev,
  onNext,
}: MonthProps) {
  const now = fromDateKey(today);
  const shown = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const cells = getMonthGrid(shown.getFullYear(), shown.getMonth());
  const totals = minutesByDate(sessions);
  const upcomings = useUpcomings();
  const clinicals = useClinicals();
  const locations = useClinicalLocations();
  const clinicalDays = clinicalDates(clinicals);

  // Date keys are YYYY-MM-DD, so the month prefix picks out this month's items.
  // A selected day narrows each list to that day.
  const monthPrefix = toDateKey(shown).slice(0, 7);
  const inView = (date: string) => (selected ? date === selected : date.startsWith(monthPrefix));

  const monthSessions = sessions
    .filter((s) => s.date.startsWith(monthPrefix))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  // A day's sessions read in the order they were logged
  const listedSessions = selected
    ? monthSessions.filter((s) => s.date === selected).reverse()
    : monthSessions;

  // Assessments and clinicals read in date order, like a schedule
  const listedUpcomings = upcomings
    .filter((u) => inView(u.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);
  const listedClinicals = clinicals
    .filter((c) => inView(c.date))
    .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt);

  const monthDates = cells.filter((d): d is string => d !== null);
  const daysStudied = monthDates.filter((d) => (totals.get(d) ?? 0) > 0).length;
  const monthMinutes = monthDates.reduce((sum, d) => sum + (totals.get(d) ?? 0), 0);
  const monthClinicals = clinicals.filter((c) => c.date.startsWith(monthPrefix));
  const monthClinicalMinutes = monthClinicals.reduce((sum, c) => sum + (c.minutes ?? 0), 0);
  const monthUpcomingCount = upcomings.filter((u) => u.date.startsWith(monthPrefix)).length;

  const canAddSession = !selected || canChangeSessionOn(selected, today);
  const canAdd = tab !== 'sessions' || canAddSession;

  // Adds to the selected day when there is one
  const add = () => {
    if (tab === 'sessions') {
      router.push(
        selected ? { pathname: '/add-session', params: { date: selected } } : '/add-session'
      );
    } else if (tab === 'upcomings') {
      // Assessments are only scheduled from today on
      router.push(
        selected && selected >= today
          ? { pathname: '/add-upcoming', params: { date: selected } }
          : '/add-upcoming'
      );
    } else {
      router.push(
        selected ? { pathname: '/add-clinical', params: { date: selected } } : '/add-clinical'
      );
    }
  };

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
  const summary =
    tab === 'sessions'
      ? `${plural(daysStudied, 'day', 'days')} studied · ${formatMinutes(monthMinutes)} total`
      : tab === 'upcomings'
        ? `${plural(monthUpcomingCount, 'assessment', 'assessments')} this month`
        : `${plural(monthClinicals.length, 'clinical', 'clinicals')}` +
          (monthClinicalMinutes > 0 ? ` · ${formatMinutes(monthClinicalMinutes)}` : '');

  const emptyText =
    tab === 'sessions'
      ? 'No study sessions.'
      : tab === 'upcomings'
        ? 'No quizzes, exams, or finals.'
        : 'No clinicals.';
  const isEmpty =
    tab === 'sessions'
      ? listedSessions.length === 0
      : tab === 'upcomings'
        ? listedUpcomings.length === 0
        : listedClinicals.length === 0;

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
          hitSlop={10}
          style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}
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
            const hasClinical = clinicalDays.has(date);
            return (
              <Pressable
                key={date}
                // Tapping the selected day again goes back to the whole month
                onPress={() => onSelect(isSelected ? null : date)}
                style={({ pressed }) => [
                  styles.cell,
                  styles.day,
                  isToday && styles.today,
                  isSelected && styles.selectedDay,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Show ${formatDayHeading(date)}${hasClinical ? ', has a clinical' : ''}`}>
                <Text
                  style={[
                    styles.dayNumber,
                    isFuture && styles.futureNumber,
                    isToday && styles.todayNumber,
                  ]}>
                  {fromDateKey(date).getDate()}
                </Text>
                <View>
                  <View style={isFuture && styles.futureHeart}>
                    <DayHeart minutes={totals.get(date) ?? 0} size={22} />
                  </View>
                  {/* Tucked against the heart's lower right, so it takes no room in the grid */}
                  {hasClinical && <Text style={styles.clinicalMark}>🩺</Text>}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map(({ key, label }) => {
          const active = key === tab;
          return (
            <Pressable
              key={key}
              onPress={() => onTab(key)}
              style={[styles.tab, active && styles.activeTab]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.tabText, active && styles.activeTabText]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle} numberOfLines={1}>
          {selected ? formatDayHeading(selected) : TABS.find((t) => t.key === tab)?.label}
        </Text>
        <Pressable
          onPress={add}
          disabled={!canAdd}
          hitSlop={10}
          style={({ pressed }) => [
            styles.addButton,
            !canAdd && styles.disabled,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}
          accessibilityLabel={
            tab === 'sessions'
              ? 'Add a session'
              : tab === 'upcomings'
                ? 'Add a quiz, exam, or final'
                : 'Add a clinical'
          }>
          <SymbolView
            name={{ ios: 'plus', android: 'add', web: 'add' }}
            tintColor={Colors.card}
            size={20}
          />
        </Pressable>
      </View>
      {!canAdd && <Text style={styles.addLimit}>{SESSION_LOCK_MESSAGE}</Text>}

      {isEmpty && <Text style={styles.empty}>{emptyText}</Text>}

      {tab === 'sessions' &&
        listedSessions.map((session) => {
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
        })}

      {tab === 'upcomings' && listedUpcomings.length > 0 && (
        <View style={[styles.card, styles.rows]}>
          {listedUpcomings.map((upcoming) => (
            <UpcomingRow key={upcoming.id} upcoming={upcoming} today={today} />
          ))}
        </View>
      )}

      {tab === 'clinicals' && listedClinicals.length > 0 && (
        <View style={[styles.card, styles.rows]}>
          {listedClinicals.map((clinical) => (
            <ClinicalRow
              key={clinical.id}
              clinical={clinical}
              location={locations.find((l) => l.id === clinical.locationId)}
              today={today}
            />
          ))}
        </View>
      )}

      {tab === 'sessions' && selected && (
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
  // Future days can be opened for their schedule, but look quieter
  futureNumber: {
    opacity: 0.5,
  },
  futureHeart: {
    opacity: 0.4,
  },
  clinicalMark: {
    position: 'absolute',
    right: -6,
    bottom: -2,
    fontSize: 9,
    lineHeight: 11,
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
  tabs: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: 14,
    backgroundColor: Colors.track,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: Colors.card,
    boxShadow: '0 2px 6px rgba(224, 103, 154, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  activeTabText: {
    color: Colors.accentDeep,
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
  rows: {
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
