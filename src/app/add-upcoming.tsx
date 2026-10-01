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
import { DatePicker } from '@/components/date-picker';
import { Colors } from '@/constants/theme';
import { useToday } from '@/hooks/use-study-sessions';
import { describeError } from '@/lib/cloud';
import { confirmDelete } from '@/lib/confirm';
import {
  addUpcoming,
  getUpcoming,
  removeUpcoming,
  UPCOMING_TYPES,
  updateUpcoming,
  type UpcomingType,
} from '@/lib/upcomings';

const TYPES = Object.keys(UPCOMING_TYPES) as UpcomingType[];

// Creates a quiz/exam/final, or edits one when opened with ?id=
export default function AddUpcoming() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getUpcoming(id) : undefined;
  const today = useToday();

  const [type, setType] = useState<UpcomingType>(existing?.type ?? 'exam');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [date, setDate] = useState<string | null>(existing?.date ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = title.trim().length > 0 && date !== null && !busy;

  // Runs a save or delete; stays on this screen with an error if it doesn't go through
  const run = async (task: () => Promise<void>, done: () => void) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      done();
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  const save = () => {
    if (!canSave || !date) return;
    const fields = { type, title, date };
    void run(
      () => (existing ? updateUpcoming(existing.id, fields) : addUpcoming(fields)),
      () => router.back()
    );
  };

  const remove = () => {
    if (!existing || busy) return;
    confirmDelete(
      `Delete ${existing.title}?`,
      'Sessions you logged for it are kept. They just won’t be linked to it anymore.',
      () =>
        void run(
          () => removeUpcoming(existing.id),
          // Its detail page may be underneath, so go all the way home
          () => router.dismissTo('/')
        )
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

          <Text style={styles.title}>{existing ? 'Edit upcoming' : 'New upcoming'}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>What is it?</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Chip
                  key={t}
                  label={`${UPCOMING_TYPES[t].emoji} ${UPCOMING_TYPES[t].label}`}
                  selected={type === t}
                  onPress={() => setType(t)}
                />
              ))}
            </View>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Pharm Exam 2, Med-Surg final…"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>When is it?</Text>
            {today && <DatePicker value={date} onChange={setDate} today={today} />}
          </View>

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
                {existing ? 'Save changes' : `Add ${UPCOMING_TYPES[type].label.toLowerCase()}`}
              </Text>
            )}
          </Pressable>

          {existing && (
            <Pressable
              onPress={remove}
              disabled={busy}
              style={({ pressed }) => [styles.delete, pressed && styles.savePressed]}>
              <Text style={styles.deleteText}>Delete {UPCOMING_TYPES[type].label.toLowerCase()}</Text>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
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
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
});
