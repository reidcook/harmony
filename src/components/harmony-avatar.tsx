import { Image } from 'expo-image';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';

import { getCosmetic, type Slot } from '@/constants/cosmetics';
import type { Equipped } from '@/lib/wardrobe';

type Props = {
  equipped: Equipped;
  size: number;
};

// Drawn over Harmony bottom to top; backgrounds go behind her
const FRONT_SLOTS: Slot[] = ['held', 'face', 'hat'];

// Harmony with what she's wearing. Each item's art is a full-size layer lined up with her
// image. Items without art yet show their emoji roughly where they'd go.
export function HarmonyAvatar({ equipped, size }: Props) {
  const layer = (slot: Slot) => {
    const item = equipped[slot] ? getCosmetic(equipped[slot]) : undefined;
    if (!item) return null;
    if (item.image) {
      return (
        <Image key={slot} source={item.image} style={StyleSheet.absoluteFill} contentFit="contain" />
      );
    }
    return (
      <Text key={slot} style={[styles.placeholder, placeholderStyle(slot, size)]}>
        {item.emoji}
      </Text>
    );
  };

  return (
    <View style={{ width: size, height: size }}>
      {layer('background')}
      <Image
        source={require('@/assets/harmony/heartprogress.png')}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        accessibilityLabel="Harmony, a pink heart wearing a nurse's cap"
      />
      {FRONT_SLOTS.map(layer)}
    </View>
  );
}

function placeholderStyle(slot: Slot, size: number): TextStyle {
  switch (slot) {
    case 'background':
      return { fontSize: size * 0.8, lineHeight: size, top: 0, left: 0, right: 0, opacity: 0.3 };
    case 'hat':
      return { fontSize: size * 0.26, top: -size * 0.08, left: 0, right: 0 };
    case 'face':
      return { fontSize: size * 0.2, top: size * 0.36, left: 0, right: 0 };
    case 'held':
      return { fontSize: size * 0.24, bottom: size * 0.04, right: 0 };
  }
}

const styles = StyleSheet.create({
  placeholder: {
    position: 'absolute',
    textAlign: 'center',
  },
});
