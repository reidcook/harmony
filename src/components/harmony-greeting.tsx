import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Colors } from '@/constants/theme';

type Props = {
  message: string;
};

export function HarmonyGreeting({ message }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.stage}>
        <Animated.View style={[styles.glow, animations.glow]}>
          <View style={[styles.fill, styles.glowGradient]} />
        </Animated.View>
        <Animated.View style={[styles.groundShadow, animations.groundShadow]}>
          <View style={[styles.fill, styles.groundShadowGradient]} />
        </Animated.View>
        <Animated.View style={animations.float}>
          <Animated.View style={animations.sway}>
            <Image
              source={require('@/assets/harmony/heartprogress.png')}
              style={styles.mascot}
              contentFit="contain"
              accessibilityLabel="Harmony, a pink heart wearing a nurse's cap"
            />
          </Animated.View>
        </Animated.View>
      </View>
      <View style={styles.bubble}>
        <View style={styles.bubbleTail} />
        <Text style={styles.speaker}>Harmony says</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

// Float and shadow share a duration so the shadow shrinks as Harmony rises.
// Sway runs on a different beat so the combined motion never looks looped.
const FLOAT_DURATION = '3s';
const SWAY_DURATION = '4.6s';
const GLOW_DURATION = '5s';

const breathe = {
  animationTimingFunction: 'ease-in-out',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
} as const;

// Plain object, not StyleSheet.create: react-native-web rejects Reanimated's animation props
const animations = {
  glow: {
    animationName: {
      from: { transform: [{ scale: 0.92 }], opacity: 0.75 },
      to: { transform: [{ scale: 1.06 }], opacity: 1 },
    },
    animationDuration: GLOW_DURATION,
    ...breathe,
  },
  groundShadow: {
    animationName: {
      from: { transform: [{ scaleX: 1 }], opacity: 1 },
      to: { transform: [{ scaleX: 0.75 }], opacity: 0.55 },
    },
    animationDuration: FLOAT_DURATION,
    ...breathe,
  },
  float: {
    animationName: {
      from: { transform: [{ translateY: 0 }] },
      to: { transform: [{ translateY: -10 }] },
    },
    animationDuration: FLOAT_DURATION,
    ...breathe,
  },
  sway: {
    animationName: {
      from: { transform: [{ rotate: '-2.5deg' }] },
      to: { transform: [{ rotate: '2.5deg' }] },
    },
    animationDuration: SWAY_DURATION,
    ...breathe,
  },
} as const;

// Native reads experimental_backgroundImage; web needs the plain CSS property
const gradient = (value: string) =>
  Platform.select({
    web: { backgroundImage: value } as object,
    default: { experimental_backgroundImage: value },
  });

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  stage: {
    width: 220,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
  },
  glowGradient: gradient(
    'radial-gradient(circle closest-side, rgba(255, 158, 196, 0.55) 0%, rgba(255, 158, 196, 0.2) 55%, rgba(255, 158, 196, 0) 100%)'
  ),
  groundShadow: {
    position: 'absolute',
    bottom: 2,
    width: 110,
    height: 18,
  },
  groundShadowGradient: gradient(
    'radial-gradient(ellipse closest-side, rgba(224, 103, 154, 0.35) 0%, rgba(224, 103, 154, 0) 100%)'
  ),
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
