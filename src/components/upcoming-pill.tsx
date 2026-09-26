import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { UPCOMING_TYPES, type UpcomingType } from '@/lib/upcomings';

// Bigger stakes get a stronger pink
const PILL_COLORS: Record<UpcomingType, { background: string; text: string }> = {
  quiz: { background: Colors.track, text: Colors.accentDeep },
  exam: { background: Colors.accent, text: Colors.card },
  final: { background: Colors.accentDeep, text: Colors.card },
};

export function UpcomingPill({ type }: { type: UpcomingType }) {
  const { label, emoji } = UPCOMING_TYPES[type];
  const colors = PILL_COLORS[type];

  return (
    <View style={[styles.pill, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {emoji} {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
