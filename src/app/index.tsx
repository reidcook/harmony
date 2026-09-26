import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSessionButton } from '@/components/add-session-button';
import { HarmonyGreeting } from '@/components/harmony-greeting';
import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { UpcomingsCard } from '@/components/upcomings-card';
import { WeekHearts } from '@/components/week-hearts';
import { Colors } from '@/constants/theme';
import { useDailyGoal } from '@/hooks/use-daily-goal';
import { useEncouragement } from '@/hooks/use-encouragement';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { computeStreak, minutesByDate } from '@/lib/study-sessions';

const toHours = (minutes: number) => Math.round((minutes / 60) * 10) / 10;

export default function Index() {
  const message = useEncouragement();
  const sessions = useStudySessions();
  const today = useToday();
  const goal = useDailyGoal();

  const totals = minutesByDate(sessions);
  const todayMinutes = today ? (totals.get(today) ?? 0) : 0;
  const streakDays = today ? computeStreak(totals, today) : 0;
  const goalProgress = todayMinutes / goal;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <HarmonyGreeting message={message} />

        <View style={styles.stats}>
          <StatCard icon="🔥" value={`${streakDays}`} label="day streak" />
          <StatCard
            icon="🎯"
            value={`${Math.round(goalProgress * 100)}%`}
            label="of today's goal"
            onPress={() => router.push('/goal')}
            accessibilityHint="Change your daily study goal">
            <View style={styles.goalDetail}>
              <ProgressBar progress={goalProgress} />
              <Text style={styles.goalCaption}>
                {toHours(todayMinutes)} / {toHours(goal)} hrs · tap to edit
              </Text>
            </View>
          </StatCard>
        </View>

        <WeekHearts today={today} totals={totals} />

        <UpcomingsCard today={today} />
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
