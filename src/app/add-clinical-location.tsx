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
import { Colors } from '@/constants/theme';
import { useClinicals } from '@/hooks/use-clinicals';
import {
  addClinicalLocation,
  CLINICAL_LOCATION_TYPES,
  getClinicalLocation,
  removeClinicalLocation,
  updateClinicalLocation,
  type ClinicalLocationType,
} from '@/lib/clinical-locations';
import { describeError } from '@/lib/cloud';
import { confirmDelete } from '@/lib/confirm';

const TYPES = Object.keys(CLINICAL_LOCATION_TYPES) as ClinicalLocationType[];

// Creates a clinical location, or edits one when opened with ?id=
export default function AddClinicalLocation() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = id ? getClinicalLocation(id) : undefined;
  const inUse = useClinicals().some((c) => c.locationId === existing?.id);

  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState<ClinicalLocationType | null>(existing?.type ?? null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = name.trim().length > 0 && !busy;

  // Runs a save or delete; stays on this screen with an error if it doesn't go through
  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
      router.back();
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  const save = () => {
    if (!canSave) return;
    const fields = { name, type };
    void run(() =>
      existing ? updateClinicalLocation(existing.id, fields) : addClinicalLocation(fields)
    );
  };

  const remove = () => {
    if (!existing || busy || inUse) return;
    confirmDelete(`Delete ${existing.name}?`, "This can't be undone.", () =>
      void run(() => removeClinicalLocation(existing.id))
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

          <Text style={styles.title}>{existing ? 'Edit location' : 'New location'}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. St. Mary’s Hospital"
              placeholderTextColor={Colors.textMuted}
              style={styles.input}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Type (optional)</Text>
            <View style={styles.chips}>
              {TYPES.map((t) => (
                <Chip
                  key={t}
                  label={`${CLINICAL_LOCATION_TYPES[t].emoji} ${CLINICAL_LOCATION_TYPES[t].label}`}
                  selected={type === t}
                  // Tapping the chosen type again clears it
                  onPress={() => setType(type === t ? null : t)}
                />
              ))}
            </View>
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
              <Text style={styles.saveText}>{existing ? 'Save changes' : 'Add location'}</Text>
            )}
          </Pressable>

          {existing && (
            <>
              <Pressable
                onPress={remove}
                disabled={busy || inUse}
                style={({ pressed }) => [
                  styles.delete,
                  inUse && styles.deleteDisabled,
                  pressed && styles.savePressed,
                ]}>
                <Text style={styles.deleteText}>Delete location</Text>
              </Pressable>
              {inUse && (
                <Text style={styles.note}>
                  This location has clinicals. Delete or move them to delete it.
                </Text>
              )}
            </>
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
  deleteDisabled: {
    opacity: 0.4,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
  },
  note: {
    marginTop: -8,
    fontSize: 13,
    color: Colors.textMuted,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
});
