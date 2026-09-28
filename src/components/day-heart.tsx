import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

const HEART_HOUR_MINUTES = 60;
const STRONG_SCALE = 1.15;

type Props = {
  minutes: number;
  size: number;
};

// Pale for none, pink for under an hour, deeper and bigger for an hour or more
export function DayHeart({ minutes, size }: Props) {
  const strong = minutes >= HEART_HOUR_MINUTES;
  const color = strong ? Colors.heartStrong : minutes > 0 ? Colors.accent : Colors.track;

  return (
    // Fixed slot so the bigger heart doesn't shift the rows around it
    <View style={[styles.slot, { width: size, height: size }]}>
      <SymbolView
        name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
        tintColor={color}
        size={strong ? Math.round(size * STRONG_SCALE) : size}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
});
