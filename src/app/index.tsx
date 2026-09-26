import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HarmonyGreeting } from '@/components/harmony-greeting';
import { ProgressBar } from '@/components/progress-bar';
import { StatCard } from '@/components/stat-card';
import { Colors } from '@/constants/theme';
import { useEncouragement } from '@/hooks/use-encouragement';

// Hard-coded until goal tracking is implemented
const streakDays = 7;
const studiedHours = 1.5;
const goalHours = 2;

export default function Index() {
  const message = useEncouragement();
  const goalProgress = studiedHours / goalHours;

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
                {studiedHours} / {goalHours} hrs
              </Text>
            </View>
          </StatCard>
        </View>
      </ScrollView>
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
