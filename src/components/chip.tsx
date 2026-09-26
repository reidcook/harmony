import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function Chip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.selected]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <Text style={[styles.text, selected && styles.selectedText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: Colors.track,
  },
  selected: {
    backgroundColor: Colors.accentDeep,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  selectedText: {
    color: Colors.card,
  },
});
