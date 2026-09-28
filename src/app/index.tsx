import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSessionButton } from '@/components/add-session-button';
import { HarmonyGreeting } from '@/components/harmony-greeting';
import { StatCard } from '@/components/stat-card';
import { UpcomingsCard } from '@/components/upcomings-card';
import { WeekHearts } from '@/components/week-hearts';
import { WeeklyGoalCard } from '@/components/weekly-goal-card';
import { Colors } from '@/constants/theme';
import { useEncouragement } from '@/hooks/use-encouragement';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useWeeklyGoal } from '@/hooks/use-weekly-goal';
import { computeWeekStreak, minutesByDate, weekMinutes } from '@/lib/study-sessions';

export default function Index() {
  const message = useEncouragement();
  const sessions = useStudySessions();
  const today = useToday();
  const goal = useWeeklyGoal();

  const totals = minutesByDate(sessions);
  const thisWeekMinutes = today ? weekMinutes(totals, today) : 0;
  const streakWeeks = today ? computeWeekStreak(totals, today, goal) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <HarmonyGreeting message={message} />

        <View style={styles.stats}>
          <StatCard value={`${streakWeeks}`} label="week streak" />
          <WeeklyGoalCard minutes={thisWeekMinutes} goal={goal} />
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
});
