import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressBar } from '@/components/progress-bar';
import { DAILY_GOAL_MINUTES } from '@/constants/goal';
import { Colors } from '@/constants/theme';
import { useStudySessions } from '@/hooks/use-study-sessions';
import { formatDayHeading, formatMinutes, toDateKey } from '@/lib/study-sessions';

export default function DaySessions() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const sessions = useStudySessions()
    .filter((s) => s.date === date)
    .sort((a, b) => a.createdAt - b.createdAt);
  const total = sessions.reduce((sum, s) => sum + s.minutes, 0);
  const heading = formatDayHeading(date);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.close}>Done</Text>
          </Pressable>
        </View>

        <Text style={styles.title}>{heading}</Text>

        <View style={styles.card}>
          <Text style={styles.summary}>
            {formatMinutes(total)} of {formatMinutes(DAILY_GOAL_MINUTES)} goal
            {total >= DAILY_GOAL_MINUTES ? ' 🎉' : ''}
          </Text>
          <ProgressBar progress={total / DAILY_GOAL_MINUTES} />
        </View>

        <Pressable
          onPress={() => router.push({ pathname: '/add-session', params: { date } })}
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          accessibilityRole="button">
          <Text style={styles.addButtonText}>+ Add session to this day</Text>
        </Pressable>

        {sessions.length === 0 ? (
          <Text style={styles.empty}>No study sessions this day.</Text>
        ) : (
          sessions.map((session) => (
            <Pressable
              key={session.id}
              onPress={() =>
                router.push({ pathname: '/add-session', params: { id: session.id } })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityHint="Edit or delete this session">
              <View style={styles.sessionHeader}>
                <Text style={styles.duration}>{formatMinutes(session.minutes)}</Text>
                {/* The logged time only means something if it was logged on that same day */}
                {toDateKey(new Date(session.createdAt)) === session.date && (
                  <Text style={styles.time}>
                    {new Date(session.createdAt).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </Text>
                )}
              </View>
              <Text style={session.description ? styles.description : styles.noDescription}>
                {session.description || 'No description'}
              </Text>
              <Text style={styles.editHint}>Tap to edit or delete</Text>
            </Pressable>
          ))
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
  },
  close: {
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
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  pressed: {
    opacity: 0.7,
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
  editHint: {
    fontSize: 12,
    color: Colors.accentDeep,
  },
  summary: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: Colors.textMuted,
    marginTop: 24,
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
  time: {
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
