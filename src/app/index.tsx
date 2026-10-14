import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccountButton } from '@/components/account-button';
import { AddSessionButton } from '@/components/add-session-button';
import { ClinicalsCard } from '@/components/clinicals-card';
import { HarmonyGreeting } from '@/components/harmony-greeting';
import { HeartsButton } from '@/components/hearts-button';
import { MonthlyHoursChart } from '@/components/monthly-hours-chart';
import { RewardCelebration } from '@/components/reward-celebration';
import { StatCard } from '@/components/stat-card';
import { UpcomingsCard } from '@/components/upcomings-card';
import { WeekHearts } from '@/components/week-hearts';
import { WeeklyGoalCard } from '@/components/weekly-goal-card';
import { Colors } from '@/constants/theme';
import { useEncouragement } from '@/hooks/use-encouragement';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useWeeklyGoal } from '@/hooks/use-weekly-goal';
import { getShouldAskReminders, markRemindersAsked } from '@/lib/reminders';
import { computeWeekStreak, minutesByDate, weekMinutes } from '@/lib/study-sessions';
import { getShouldWelcome, markWelcomeSeen } from '@/lib/welcome';

export default function Index() {
  const message = useEncouragement();
  const sessions = useStudySessions();
  const today = useToday();
  const goal = useWeeklyGoal();

  const totals = minutesByDate(sessions);
  const thisWeekMinutes = today ? weekMinutes(totals, today) : 0;
  const streakWeeks = today ? computeWeekStreak(totals, today, goal) : 0;

  // On first launch, offer backup and then reminders, one after the other: closing the first
  // brings home back into focus, which opens the second. Skipping or swiping away counts as seen.
  // Reads the stores on focus rather than subscribing, so marking one seen can't open the next early.
  useFocusEffect(
    useCallback(() => {
      if (getShouldWelcome()) {
        markWelcomeSeen();
        router.push({ pathname: '/sign-in', params: { welcome: '1' } });
      } else if (getShouldAskReminders()) {
        markRemindersAsked();
        router.push({ pathname: '/reminders', params: { welcome: '1' } });
      }
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <HarmonyGreeting message={message} />
        <View style={styles.accountButton}>
          <AccountButton />
        </View>
        <View style={styles.heartsButton}>
          <HeartsButton />
        </View>

        <RewardCelebration />

        <View style={styles.stats}>
          <StatCard value={`${streakWeeks}`} label="week streak" />
          <WeeklyGoalCard minutes={thisWeekMinutes} goal={goal} />
        </View>

        <WeekHearts today={today} totals={totals} />

        <UpcomingsCard today={today} />

        <ClinicalsCard today={today} />

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
  // Top-right corner, opposite the account button
  heartsButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 12,
  },
});
