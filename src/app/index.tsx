import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSessionButton } from '@/components/add-session-button';
import { HarmonyGreeting } from '@/components/harmony-greeting';
import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { WeekHearts } from '@/components/week-hearts';
import { DAILY_GOAL_MINUTES } from '@/constants/goal';
import { Colors } from '@/constants/theme';
import { useEncouragement } from '@/hooks/use-encouragement';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { computeStreak, minutesByDate } from '@/lib/study-sessions';

const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

export default function Index() {
  const message = useEncouragement();
  const sessions = useStudySessions();
  const today = useToday();

  const totals = minutesByDate(sessions);
  const todayMinutes = today ? (totals.get(today) ?? 0) : 0;
  const streakDays = today ? computeStreak(totals, today) : 0;
  const goalProgress = todayMinutes / DAILY_GOAL_MINUTES;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <HarmonyGreeting message={message} />

        <View style={styles.stats}>
          <StatCard icon="🔥" value={`${streakDays}`} label="day streak" />
          <StatCard
            icon="🎯"
            value={`${Math.round(goalProgress * 100)}%`}
            label="of today's goal">
            <View style={styles.goalDetail}>
              <ProgressBar progress={goalProgress} />
              <Text style={styles.goalCaption}>
                {toHours(todayMinutes)} / {toHours(DAILY_GOAL_MINUTES)} hrs
              </Text>
            </View>
          </StatCard>
        </View>

        <WeekHearts today={today} totals={totals} />
      </ScrollView>
      <AddSessionButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: 20,
    padding: 16,
    // Room for the floating add button
    paddingBottom: 100,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
  goalDetail: {
    gap: 6,
    marginTop: 6,
  },
  goalCaption: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
