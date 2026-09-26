import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { formatMinutes } from '@/lib/study-sessions';

const toNumber = (text: string) => {
  const n = parseInt(text, 10);
  return Number.isNaN(n) ? 0 : n;
};

const splitHours = (total: number) => String(Math.floor(total / 60));
const splitMinutes = (total: number) => String(total % 60);

// Hours/minutes text fields plus their combined total in minutes
export function useDuration(initialMinutes?: number) {
  const [hours, setHours] = useState(initialMinutes ? splitHours(initialMinutes) : '');
  const [minutes, setMinutes] = useState(initialMinutes ? splitMinutes(initialMinutes) : '');

  return {
    hours,
    minutes,
    setHours,
    setMinutes,
    total: toNumber(hours) * 60 + toNumber(minutes),
    pick: (total: number) => {
      setHours(splitHours(total));
      setMinutes(splitMinutes(total));
    },
  };
}

type Props = {
  duration: ReturnType<typeof useDuration>;
  quickPicks: number[];
};

export function DurationPicker({ duration, quickPicks }: Props) {
  const { hours, minutes, setHours, setMinutes, total, pick } = duration;

  return (
    <>
      <View style={styles.row}>
        <TextInput
          value={hours}
          onChangeText={(t) => setHours(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          maxLength={2}
        />
        <Text style={styles.unit}>hrs</Text>
        <TextInput
          value={minutes}
          onChangeText={(t) => setMinutes(t.replace(/\D/g, ''))}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={Colors.textMuted}
          style={styles.input}
          maxLength={3}
        />
        <Text style={styles.unit}>min</Text>
      </View>
      <View style={styles.chips}>
        {quickPicks.map((m) => (
          <Pressable
            key={m}
            onPress={() => pick(m)}
            style={[styles.chip, total === m && styles.chipActive]}>
            <Text style={[styles.chipText, total === m && styles.chipTextActive]}>
              {formatMinutes(m)}
            </Text>
          </Pressable>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    width: 64,
    borderRadius: 12,
    padding: 12,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.track,
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
});
