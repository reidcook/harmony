import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  progress: number;
};

export function ProgressBar({ progress }: Props) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.accentDeep,
  },
});
