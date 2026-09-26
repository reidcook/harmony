import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type Props = {
  message: string;
};

export function HarmonyGreeting({ message }: Props) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/harmony/heartprogress.png')}
        style={styles.mascot}
        contentFit="contain"
        accessibilityLabel="Harmony, a pink heart wearing a nurse's cap"
      />
      <View style={styles.bubble}>
        <View style={styles.bubbleTail} />
        <Text style={styles.speaker}>Harmony says</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mascot: {
    width: 180,
    height: 180,
  },
  bubble: {
    alignSelf: 'stretch',
    gap: 4,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  bubbleTail: {
    position: 'absolute',
    top: -8,
    alignSelf: 'center',
    width: 16,
    height: 16,
    backgroundColor: Colors.card,
    transform: [{ rotate: '45deg' }],
  },
  speaker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.accentDeep,
  },
  message: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '600',
    color: Colors.text,
  },
});
