import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { CLINICAL_LOCATION_TYPES, type ClinicalLocation } from '@/lib/clinical-locations';
import type { Clinical } from '@/lib/clinicals';
import { daysUntil, formatDayHeading, formatDaysAway, formatMinutes } from '@/lib/study-sessions';

type Props = {
  clinical: Clinical;
  location: ClinicalLocation | undefined;
  today: string;
};

// Opens the clinical to edit it
export function ClinicalRow({ clinical, location, today }: Props) {
  const days = daysUntil(today, clinical.date);
  const typeInfo = location?.type ? CLINICAL_LOCATION_TYPES[location.type] : null;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/add-clinical', params: { id: clinical.id } })}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityHint="Edit or delete this clinical">
      <View style={styles.rowText}>
        <Text style={styles.pill}>{typeInfo ? typeInfo.emoji + " " + typeInfo.label : '🩺 Clinical'}</Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {location?.name ?? 'Unknown location'}
        </Text>
        <Text style={styles.rowDate}>
          {formatDayHeading(clinical.date)}
          {clinical.minutes !== null && ` · ${formatMinutes(clinical.minutes)}`}
        </Text>
        {clinical.description !== '' && (
          <Text style={styles.description} numberOfLines={1}>
            {clinical.description}
          </Text>
        )}
      </View>
      <View style={styles.countdown}>
        {days > 1 ? (
          <>
            <Text style={styles.countdownNumber}>{days}</Text>
            <Text style={styles.countdownLabel}>days</Text>
          </>
        ) : (
          <Text style={[styles.countdownSoon, days < 0 && styles.countdownPast]}>
            {formatDaysAway(days)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
  },
  rowText: {
    flex: 1,
    gap: 3,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 999,
    overflow: 'hidden',
    fontSize: 11,
    fontWeight: '700',
    color: Colors.accentDeep,
    backgroundColor: Colors.track,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  rowDate: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  description: {
    fontSize: 13,
    color: Colors.text,
  },
  countdown: {
    alignItems: 'center',
    minWidth: 56,
  },
  countdownNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  countdownLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  countdownSoon: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  countdownPast: {
    color: Colors.textMuted,
  },
  pressed: {
    opacity: 0.7,
  },
});
