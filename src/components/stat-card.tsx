import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  icon: string;
  value: string;
  label: string;
  children?: ReactNode;
};

export function StatCard({ icon, value, label, children }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
