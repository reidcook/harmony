import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
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
import { DurationPicker, useDuration } from '@/components/duration-picker';
import { Colors } from '@/constants/theme';
import { useClinicalLocations } from '@/hooks/use-clinicals';
import { useToday } from '@/hooks/use-study-sessions';
import {
  CLINICAL_LOCATION_TYPES,
  sortLocations,
  takeJustAddedLocationId,
} from '@/lib/clinical-locations';
import { addClinicals, getClinical, removeClinical, updateClinical } from '@/lib/clinicals';
import { describeError } from '@/lib/cloud';
import { confirmDelete } from '@/lib/confirm';

const QUICK_PICKS = [240, 480, 600, 720];

// Adds clinicals on one or more days (starting with ?date=YYYY-MM-DD if given), all sharing the
// same location, time, and notes. Opened with ?id=, it edits that one clinical and its single day.
// Its hours are kept apart from study time and never count toward goals or rewards.
export default function AddClinical() {
  const params = useLocalSearchParams<{ id?: string; date?: string }>();
  const existing = params.id ? getClinical(params.id) : undefined;
  const today = useToday();
  const locations = sortLocations(useClinicalLocations());

  const [locationId, setLocationId] = useState<string | null>(existing?.locationId ?? null);
  const initialDate = existing?.date ?? params.date;
  const [dates, setDates] = useState<string[]>(initialDate ? [initialDate] : []);
  // A new clinical toggles days on and off; an existing one just moves to the tapped day
  const pickDate = (date: string) =>
    setDates((current) =>
      existing
        ? [date]
        : current.includes(date)
          ? current.filter((d) => d !== date)
          : [...current, date].sort()
    );
  const duration = useDuration(existing?.minutes ?? undefined);
  const [description, setDescription] = useState(existing?.description ?? '');

  // Back from creating a location: select it
  useFocusEffect(
    useCallback(() => {
      const added = takeJustAddedLocationId();
      if (added) setLocationId(added);
    }, [])
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A location deleted while this screen was open no longer counts as chosen
  const hasLocation = locationId !== null && locations.some((l) => l.id === locationId);
  const canSave = hasLocation && dates.length > 0 && !busy;

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
    if (!canSave || !locationId) return;
    const fields = {
      locationId,
      minutes: duration.total > 0 ? duration.total : null,
      description,
    };
    void run(() =>
      existing
        ? updateClinical(existing.id, { ...fields, date: dates[0] })
        : addClinicals(dates, fields)
    );
  };

  const remove = () => {
    if (!existing || busy) return;
    confirmDelete('Delete this clinical?', "This can't be undone.", () =>
      void run(() => removeClinical(existing.id))
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

          <Text style={styles.title}>{existing ? 'Edit clinical' : 'New clinical'}</Text>

          <View style={styles.card}>
            <Text style={styles.label}>Where is it?</Text>
            <View style={styles.chips}>
              {locations.map((l) => (
                <Chip
                  key={l.id}
                  label={l.type ? `${CLINICAL_LOCATION_TYPES[l.type].emoji} ${l.name}` : l.name}
                  selected={l.id === locationId}
                  onPress={() => setLocationId(l.id)}
                />
              ))}
              <Chip
                label="+ New location"
                selected={false}
                onPress={() => router.push('/add-clinical-location')}
              />
            </View>
            {hasLocation && (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/add-clinical-location', params: { id: locationId } })
                }
                hitSlop={8}>
                <Text style={styles.editLocation}>Edit this location</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>{existing ? 'When is it?' : 'Which days?'}</Text>
            {!existing && (
              <Text style={styles.hint}>
                {dates.length === 0
                  ? 'Tap every day this clinical meets.'
                  : `${dates.length} ${dates.length === 1 ? 'day' : 'days'} selected. Tap a day again to remove it.`}
              </Text>
            )}
            {today && (
              <DatePicker
                value={dates[0] ?? null}
                selectedDates={dates}
                onChange={pickDate}
                today={today}
                allowPast
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>How long? (optional)</Text>
            <DurationPicker duration={duration} quickPicks={QUICK_PICKS} />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Notes (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Med-surg floor, 4 West"
              placeholderTextColor={Colors.textMuted}
              style={[styles.input, styles.multiline]}
              multiline
            />
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
                {existing
                  ? 'Save changes'
                  : dates.length > 1
                    ? `Add ${dates.length} clinicals`
                    : 'Add clinical'}
              </Text>
            )}
          </Pressable>

          {existing && (
            <Pressable
              onPress={remove}
              disabled={busy}
              style={({ pressed }) => [styles.delete, pressed && styles.savePressed]}>
              <Text style={styles.deleteText}>Delete clinical</Text>
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
  hint: {
    marginTop: -6,
    fontSize: 13,
    color: Colors.textMuted,
  },
  editLocation: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accentDeep,
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
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
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
