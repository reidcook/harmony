import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { fromDateKey, getMonthGrid, MONTHS } from '@/lib/study-sessions';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

type Props = {
  value: string | null;
  onChange: (date: string) => void;
  today: string;
};

const monthIndex = (key: string) => {
  const d = fromDateKey(key);
  return d.getFullYear() * 12 + d.getMonth();
};

// Inline month grid for picking today or a future day
export function DatePicker({ value, onChange, today }: Props) {
  // An already-chosen past date (when editing) stays reachable
  const earliest = value && value < today ? value : today;
  const [shownIndex, setShownIndex] = useState(monthIndex(value ?? today));

  const year = Math.floor(shownIndex / 12);
  const month = shownIndex % 12;
  const cells = getMonthGrid(year, month);
  const canGoBack = shownIndex > monthIndex(earliest);

  return (
    <View style={styles.container}>
      <View style={styles.nav}>
        <Pressable
          onPress={() => setShownIndex((i) => i - 1)}
          disabled={!canGoBack}
          hitSlop={10}
          style={[styles.navButton, !canGoBack && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel="Previous month">
          <SymbolView
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            tintColor={Colors.accentDeep}
            size={18}
          />
        </Pressable>
        <Text style={styles.month}>
          {MONTHS[month]} {year}
        </Text>
        <Pressable
          onPress={() => setShownIndex((i) => i + 1)}
          hitSlop={10}
          style={styles.navButton}
          accessibilityRole="button"
          accessibilityLabel="Next month">
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            tintColor={Colors.accentDeep}
            size={18}
          />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {DAY_LETTERS.map((letter, i) => (
          <Text key={`letter-${i}`} style={[styles.cell, styles.weekday]}>
            {letter}
          </Text>
        ))}
        {cells.map((date, i) => {
          if (!date) return <View key={`blank-${i}`} style={styles.cell} />;

          const selected = date === value;
          const disabled = date < today && !selected;
          return (
            <View key={date} style={styles.cell}>
              <Pressable
                onPress={() => onChange(date)}
                disabled={disabled}
                style={[
                  styles.day,
                  date === today && styles.today,
                  selected && styles.selected,
                  disabled && styles.disabled,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}>
                <Text style={[styles.dayText, selected && styles.selectedText]}>
                  {fromDateKey(date).getDate()}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Colors.track,
  },
  month: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    paddingVertical: 2,
  },
  weekday: {
    paddingBottom: 4,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textMuted,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  selected: {
    backgroundColor: Colors.accentDeep,
    borderColor: Colors.accentDeep,
  },
  disabled: {
    opacity: 0.35,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  selectedText: {
    color: Colors.card,
  },
});
