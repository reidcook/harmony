import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProgressRing } from '@/components/progress-ring';
import { Colors } from '@/constants/theme';
import { useNow, useStudyTimer } from '@/hooks/use-study-timer';
import { confirmAction } from '@/lib/confirm';
import { formatMinutes } from '@/lib/study-sessions';
import {
  formatElapsed,
  isTimerStarted,
  pauseTimer,
  resetTimer,
  startTimer,
  timerElapsedMs,
  timerMinutes,
} from '@/lib/study-timer';

const HOUR_MS = 60 * 60 * 1000;

// Opened by the home "+" button. Times a study session, then Finished logs it on add-session.
export default function Timer() {
  const timer = useStudyTimer();
  const now = useNow();

  const started = isTimerStarted(timer);
  const running = timer.runningSince !== null;
  const elapsed = timerElapsedMs(timer, now);
  const minutes = timerMinutes(elapsed);

  const status = running ? 'Studying…' : started ? 'Paused' : 'Ready when you are';

  const stop = () =>
    confirmAction(
      'Stop this timer?',
      "The time so far won't be logged.",
      'Stop',
      resetTimer
    );

  const finish = () => {
    pauseTimer();
    router.push({
      pathname: '/add-session',
      params: { minutes: String(minutes), fromTimer: '1' },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.title}>Study timer</Text>
          <Text style={styles.subtitle}>{status}</Text>
        </View>

        <View style={[styles.card, styles.clockCard]}>
          {/* The ring fills once per hour */}
          <ProgressRing progress={(elapsed % HOUR_MS) / HOUR_MS} size={240} strokeWidth={14}>
            <Text style={styles.time} accessibilityRole="timer">
              {formatElapsed(elapsed)}
            </Text>
            {elapsed >= HOUR_MS && (
              <Text style={styles.timeHint}>{formatMinutes(Math.floor(elapsed / 60_000))}</Text>
            )}
          </ProgressRing>
        </View>

        {started ? (
          <>
            <View style={styles.row}>
              <ControlButton
                label={running ? 'Pause' : 'Resume'}
                icon={
                  running
                    ? { ios: 'pause.fill', android: 'pause', web: 'pause' }
                    : { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }
                }
                color={Colors.accentDeep}
                onPress={running ? pauseTimer : startTimer}
              />
              <ControlButton
                label="Stop"
                icon={{ ios: 'stop.fill', android: 'stop', web: 'stop' }}
                color={Colors.danger}
                onPress={stop}
              />
            </View>

            <Pressable
              onPress={finish}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Finished · log {formatMinutes(minutes)}</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable
              onPress={startTimer}
              style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
              <Text style={styles.primaryText}>Start studying</Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/add-session')}
              hitSlop={8}
              style={styles.manual}>
              <Text style={styles.manualText}>Log time you already studied instead</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.hint}>
          The timer keeps going if you close this screen or the app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type ControlButtonProps = {
  label: string;
  icon: ComponentProps<typeof SymbolView>['name'];
  color: string;
  onPress: () => void;
};

function ControlButton({ label, icon, color, onPress }: ControlButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.control, { borderColor: color }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}>
      <SymbolView name={icon} tintColor={color} size={20} />
      <Text style={[styles.controlText, { color }]}>{label}</Text>
    </Pressable>
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
  subtitle: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  clockCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  time: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  timeHint: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  control: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: Colors.card,
  },
  controlText: {
    fontSize: 16,
    fontWeight: '700',
  },
  primary: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  primaryText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  pressed: {
    opacity: 0.8,
  },
  manual: {
    alignSelf: 'center',
  },
  manualText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  hint: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.textMuted,
  },
});
