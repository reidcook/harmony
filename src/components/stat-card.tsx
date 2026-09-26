import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  icon: string;
  value: string;
  label: string;
  children?: ReactNode;
  onPress?: () => void;
  accessibilityHint?: string;
};

export function StatCard({ icon, value, label, children, onPress, accessibilityHint }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityHint={accessibilityHint}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 4,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    fontSize: 24,
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  label: {
    fontSize: 14,
    color: Colors.textMuted,
  },
});
