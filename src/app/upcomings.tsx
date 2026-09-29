import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UpcomingRow } from '@/components/upcoming-row';
import { Colors } from '@/constants/theme';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useUpcomings } from '@/hooks/use-upcomings';
import { nextUpcomings } from '@/lib/upcomings';

export default function Upcomings() {
  const today = useToday();
  const upcomings = useUpcomings();
  const sessions = useStudySessions();

  const studiedFor = (id: string) =>
    sessions.reduce((sum, s) => (s.upcomingIds.includes(id) ? sum + s.minutes : sum), 0);

  const comingUp = today ? nextUpcomings(upcomings, today) : [];
  // Most recent first
  const past = today
    ? upcomings
        .filter((u) => u.date < today)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/add-upcoming')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Add a quiz, exam, or final">
            <Text style={styles.link}>+ New</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Upcoming</Text>

        {/* Past vs. coming up depends on today's date, which the static web render doesn't know */}
        {today && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Coming up</Text>
              {comingUp.length === 0 ? (
                <Text style={styles.empty}>Nothing scheduled. Add a quiz, exam, or final.</Text>
              ) : (
                comingUp.map((upcoming) => (
                  <UpcomingRow
                    key={upcoming.id}
                    upcoming={upcoming}
                    today={today}
                    studiedMinutes={studiedFor(upcoming.id)}
                  />
                ))
              )}
            </View>

            {past.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Past</Text>
                {past.map((upcoming) => (
                  <UpcomingRow
                    key={upcoming.id}
                    upcoming={upcoming}
                    today={today}
                    studiedMinutes={studiedFor(upcoming.id)}
                  />
                ))}
              </View>
            )}
          </>
        )}
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
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  card: {
    gap: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  empty: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
