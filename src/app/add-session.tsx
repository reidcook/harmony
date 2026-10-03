import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { DurationPicker, useDuration } from '@/components/duration-picker';
import { Colors } from '@/constants/theme';
import { useToday } from '@/hooks/use-study-sessions';
import { useUpcomings } from '@/hooks/use-upcomings';
import { describeError } from '@/lib/cloud';
import { confirmDelete } from '@/lib/confirm';
import {
  addSession,
  canChangeSessionOn,
  formatDayHeading,
  formatMinutes,
  getSession,
  removeSession,
  SESSION_LOCK_MESSAGE,
  updateSession,
} from '@/lib/study-sessions';
import { resetTimer } from '@/lib/study-timer';
import { nextUpcomings, UPCOMING_TYPES } from '@/lib/upcomings';

const QUICK_PICKS = [15, 30, 60, 120];

// Logs a new session (today, or ?date=YYYY-MM-DD), or edits an existing one when opened with ?id=.
// ?upcomingId= preselects a quiz/exam/final it's for. A session can be for several.
// ?fromTimer=1&minutes= logs the study timer's time, and saving clears the timer.
export default function AddSession() {
  const params = useLocalSearchParams<{
    id?: string;
    date?: string;
    upcomingId?: string;
    minutes?: string;
    fromTimer?: string;
  }>();
  const existing = params.id ? getSession(params.id) : undefined;
  const sessionDate = existing?.date ?? params.date;
  const fromTimer = params.fromTimer === '1';

  const duration = useDuration(existing?.minutes ?? (Number(params.minutes) || undefined));
  const [description, setDescription] = useState(existing?.description ?? '');
  const [upcomingIds, setUpcomingIds] = useState<string[]>(
    existing ? existing.upcomingIds : params.upcomingId ? [params.upcomingId] : []
  );

  const today = useToday();
  const upcomings = useUpcomings();
  // Future ones, plus any this session is already linked to even if they're past
  const future = today ? nextUpcomings(upcomings, today) : upcomings;
  const pastLinked = upcomings.filter((u) => upcomingIds.includes(u.id) && !future.includes(u));
  const upcomingChoices = [...pastLinked, ...future];

  const toggleUpcoming = (id: string) =>
    setUpcomingIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalMinutes = duration.total;
  // Sessions on older days can't be added, edited, or deleted
  const tooOld = !!sessionDate && !!today && !canChangeSessionOn(sessionDate, today);
  const canSave = totalMinutes > 0 && !busy && !tooOld;

  // Runs a save or delete; stays on this screen with an error if it doesn't go through
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      if (fromTimer) {
        resetTimer();
        // Back home, past the timer screen
        router.dismissAll();
      } else {
        router.back();
      }
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  const save = () => {
    if (!canSave) return;
    // Drop links to anything deleted while this screen was open
    const fields = {
      minutes: totalMinutes,
      description,
      upcomingIds: upcomingIds.filter((id) => upcomings.some((u) => u.id === id)),
    };
    void run(() =>
      existing ? updateSession(existing.id, fields) : addSession({ ...fields, date: params.date })
    );
  };

  const remove = () => {
    if (!existing || busy || tooOld) return;
    confirmDelete(
      'Delete this session?',
      "It will be removed from your streak and goal. This can't be undone.",
      () => void run(() => removeSession(existing.id))
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Text style={styles.cancel}>Cancel</Text>
            </Pressable>
          </View>

          <View>
            <Text style={styles.title}>
              {existing
                ? 'Edit study session'
                : fromTimer
                  ? 'Nice work! Log your session'
                  : 'Log a study session'}
            </Text>
            {sessionDate && <Text style={styles.subtitle}>{formatDayHeading(sessionDate)}</Text>}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>How long did you study?</Text>
            <DurationPicker duration={duration} quickPicks={QUICK_PICKS} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>What did you study?</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Cardiac meds flashcards, NCLEX practice questions…"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.description]}
              multiline
              textAlignVertical="top"
            />
          </View>

          {upcomingChoices.length > 0 && (
            <View style={styles.card}>
              <View>
                <Text style={styles.label}>Studying for</Text>
                <Text style={styles.hint}>Pick as many as apply</Text>
              </View>
              <View style={styles.chips}>
                <Chip
                  label="Nothing specific"
                  selected={upcomingIds.length === 0}
                  onPress={() => setUpcomingIds([])}
                />
                {upcomingChoices.map((u) => (
                  <Chip
                    key={u.id}
                    label={`${UPCOMING_TYPES[u.type].emoji} ${u.title}`}
                    selected={upcomingIds.includes(u.id)}
                    onPress={() => toggleUpcoming(u.id)}
                  />
                ))}
              </View>
            </View>
          )}

          {tooOld && <Text style={styles.error}>{SESSION_LOCK_MESSAGE}</Text>}
          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.save,
              !canSave && styles.saveDisabled,
              pressed && styles.savePressed,
            ]}>
            {busy ? (
              <ActivityIndicator color={Colors.card} />
            ) : (
              <Text style={styles.saveText}>
                {canSave ? `Save ${formatMinutes(totalMinutes)}` : 'Save session'}
              </Text>
            )}
          </Pressable>

          {existing && (
            <Pressable
              onPress={remove}
              disabled={busy || tooOld}
              style={({ pressed }) => [
                styles.delete,
                tooOld && styles.saveDisabled,
                pressed && styles.savePressed,
              ]}>
              <Text style={styles.deleteText}>Delete session</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
  },
  cancel: {
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
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.track,
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    color: Colors.textMuted,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  description: {
    minHeight: 110,
  },
  save: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  saveDisabled: {
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  savePressed: {
    opacity: 0.8,
  },
  delete: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
});
