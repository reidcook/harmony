import { router } from 'expo-router';
import { useState } from 'react';
import {
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

import { Colors } from '@/constants/theme';
import { addSession, formatMinutes } from '@/lib/study-sessions';

const QUICK_PICKS = [15, 30, 60, 120];

const toNumber = (text: string) => {
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
};

export default function AddSession() {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');

  const totalMinutes = toNumber(hours) * 60 + toNumber(minutes);
  const canSave = totalMinutes > 0;

  const pick = (total: number) => {
    setHours(String(Math.floor(total / 60)));
    setMinutes(String(total % 60));
  };

  const save = () => {
    if (!canSave) return;
    addSession({ minutes: totalMinutes, description });
    router.back();
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

          <Text style={styles.title}>Log a study session</Text>

          <View style={styles.card}>
            <Text style={styles.label}>How long did you study?</Text>
            <View style={styles.durationRow}>
              <TextInput
                value={hours}
                onChangeText={(t) => setHours(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.durationInput]}
                maxLength={2}
              />
              <Text style={styles.unit}>hrs</Text>
              <TextInput
                value={minutes}
                onChangeText={(t) => setMinutes(t.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={Colors.textMuted}
                style={[styles.input, styles.durationInput]}
                maxLength={3}
              />
              <Text style={styles.unit}>min</Text>
            </View>
            <View style={styles.chips}>
              {QUICK_PICKS.map((m) => (
                <Pressable
                  key={m}
                  onPress={() => pick(m)}
                  style={[styles.chip, totalMinutes === m && styles.chipActive]}>
                  <Text style={[styles.chipText, totalMinutes === m && styles.chipTextActive]}>
                    {formatMinutes(m)}
                  </Text>
                </Pressable>
              ))}
            </View>
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
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.track,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    width: 64,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
  },
  unit: {
    fontSize: 14,
    color: Colors.textMuted,
    marginRight: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.track,
  },
  chipActive: {
    backgroundColor: Colors.accentDeep,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  chipTextActive: {
    color: Colors.card,
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
  saveText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
});
