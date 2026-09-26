import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
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

import { DurationPicker, useDuration } from '@/components/duration-picker';
import { Colors } from '@/constants/theme';
import {
  addSession,
  formatDayHeading,
  formatMinutes,
  getSession,
  removeSession,
  updateSession,
} from '@/lib/study-sessions';

const QUICK_PICKS = [15, 30, 60, 120];

function confirmDelete(onConfirm: () => void) {
  const title = 'Delete this session?';
  const detail = "It will be removed from your streak and goal. This can't be undone.";
  // Alert has no buttons on web
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${detail}`)) onConfirm();
    return;
  }
  Alert.alert(title, detail, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}

// Logs a new session (today, or ?date=YYYY-MM-DD), or edits an existing one when opened with ?id=
export default function AddSession() {
  const { id, date } = useLocalSearchParams<{ id?: string; date?: string }>();
  const existing = id ? getSession(id) : undefined;
  const sessionDate = existing?.date ?? date;

  const duration = useDuration(existing?.minutes);
  const [description, setDescription] = useState(existing?.description ?? '');

  const totalMinutes = duration.total;
  const canSave = totalMinutes > 0;

  const save = () => {
    if (!canSave) return;
    if (existing) {
      updateSession(existing.id, { minutes: totalMinutes, description });
    } else {
      addSession({ minutes: totalMinutes, description, date });
    }
    router.back();
  };

  const remove = () => {
    if (!existing) return;
    confirmDelete(() => {
      removeSession(existing.id);
      router.back();
    });
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
              {existing ? 'Edit study session' : 'Log a study session'}
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

          <Pressable
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.save,
              !canSave && styles.saveDisabled,
              pressed && styles.savePressed,
            ]}>
            <Text style={styles.saveText}>
              {canSave ? `Save ${formatMinutes(totalMinutes)}` : 'Save session'}
            </Text>
          </Pressable>

          {existing && (
            <Pressable
              onPress={remove}
              style={({ pressed }) => [styles.delete, pressed && styles.savePressed]}>
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
});
