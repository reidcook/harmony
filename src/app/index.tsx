import { router } from 'expo-router';
import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountButton } from '@/components/account-button';
import { AddSessionButton } from '@/components/add-session-button';
import { HarmonyGreeting } from '@/components/harmony-greeting';
import { MonthlyHoursChart } from '@/components/monthly-hours-chart';
import { StatCard } from '@/components/stat-card';
import { UpcomingsCard } from '@/components/upcomings-card';
import { WeekHearts } from '@/components/week-hearts';
import { WeeklyGoalCard } from '@/components/weekly-goal-card';
import { Colors } from '@/constants/theme';
import { useEncouragement } from '@/hooks/use-encouragement';
import { useShouldWelcome } from '@/hooks/use-should-welcome';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useWeeklyGoal } from '@/hooks/use-weekly-goal';
import { computeWeekStreak, minutesByDate, weekMinutes } from '@/lib/study-sessions';
import { markWelcomeSeen } from '@/lib/welcome';

export default function Index() {
  const message = useEncouragement();
  const sessions = useStudySessions();
  const today = useToday();
  const goal = useWeeklyGoal();

  const totals = minutesByDate(sessions);
  const thisWeekMinutes = today ? weekMinutes(totals, today) : 0;
  const streakWeeks = today ? computeWeekStreak(totals, today, goal) : 0;

  // Offer backup once, on first launch; skipping or swiping it away both count as seen
  const shouldWelcome = useShouldWelcome();
  useEffect(() => {
    if (!shouldWelcome) return;
    markWelcomeSeen();
    router.push({ pathname: '/sign-in', params: { welcome: '1' } });
  }, [shouldWelcome]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <HarmonyGreeting message={message} />
        <View style={styles.accountButton}>
          <AccountButton />
        </View>

        <View style={styles.stats}>
          <StatCard value={`${streakWeeks}`} label="week streak" />
          <WeeklyGoalCard minutes={thisWeekMinutes} goal={goal} />
        </View>

        <WeekHearts today={today} totals={totals} />

        <UpcomingsCard today={today} />

        <MonthlyHoursChart today={today} totals={totals} />
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
  // Top-left corner, over the greeting
  accountButton: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
});
