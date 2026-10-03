import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UpcomingPill } from '@/components/upcoming-pill';
import { Colors } from '@/constants/theme';
import { useStudySessions, useToday } from '@/hooks/use-study-sessions';
import { useUpcomings } from '@/hooks/use-upcomings';
import {
  canChangeSessionOn,
  daysUntil,
  formatDayHeading,
  formatDaysAway,
  formatMinutes,
} from '@/lib/study-sessions';

export default function UpcomingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const upcoming = useUpcomings().find((u) => u.id === id);
  const today = useToday();
  const sessions = useStudySessions()
    .filter((s) => s.upcomingIds.includes(id))
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.link}>Done</Text>
          </Pressable>
          {upcoming && (
            <Pressable
              onPress={() => router.push({ pathname: '/add-upcoming', params: { id } })}
              hitSlop={12}>
              <Text style={styles.link}>Edit</Text>
            </Pressable>
          )}
        </View>

        {!upcoming ? (
          <Text style={styles.empty}>This upcoming doesn’t exist anymore.</Text>
        ) : (
          <>
            <View style={styles.titleBlock}>
              <UpcomingPill type={upcoming.type} />
              <Text style={styles.title}>{upcoming.title}</Text>
              <Text style={styles.subtitle}>
                {formatDayHeading(upcoming.date)}
                {today ? ` · ${formatDaysAway(daysUntil(today, upcoming.date))}` : ''}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.totalValue}>{formatMinutes(total)}</Text>
              <Text style={styles.totalLabel}>
                studied across {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
              </Text>
            </View>

            <Pressable
              onPress={() =>
                router.push({ pathname: '/add-session', params: { upcomingId: upcoming.id } })
              }
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              accessibilityRole="button">
              <Text style={styles.addButtonText}>+ Add session for this</Text>
            </Pressable>

            {sessions.length === 0 ? (
              <Text style={styles.empty}>No study sessions linked yet.</Text>
            ) : (
              sessions.map((session) => (
                <Pressable
                  key={session.id}
                  // Sessions on older days are locked
                  disabled={!today || !canChangeSessionOn(session.date, today)}
                  onPress={() =>
                    router.push({ pathname: '/add-session', params: { id: session.id } })
                  }
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityHint="Edit or delete this session">
                  <View style={styles.sessionHeader}>
                    <Text style={styles.duration}>{formatMinutes(session.minutes)}</Text>
                    <Text style={styles.sessionDate}>{formatDayHeading(session.date)}</Text>
                  </View>
                  <Text style={session.description ? styles.description : styles.noDescription}>
                    {session.description || 'No description'}
                  </Text>
                </Pressable>
              ))
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
  titleBlock: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  card: {
    gap: 6,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  totalLabel: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  addButton: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.card,
  },
  pressed: {
    opacity: 0.7,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  duration: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  sessionDate: {
    fontSize: 13,
    color: Colors.textMuted,
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
});
