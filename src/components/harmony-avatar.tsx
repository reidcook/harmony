import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { getCosmetic, type Slot } from '@/constants/cosmetics';
import type { Equipped } from '@/lib/wardrobe';

type Props = {
  equipped: Equipped;
  size: number;
};

// Drawn over Harmony bottom to top; backgrounds go behind her
const FRONT_SLOTS: Slot[] = ['held', 'hat'];

// Harmony with what she's wearing. Each item's art is a full-size layer lined up with her image.
export function HarmonyAvatar({ equipped, size }: Props) {
  const layer = (slot: Slot) => {
    const item = equipped[slot] ? getCosmetic(equipped[slot]) : undefined;
    if (!item) return null;
    return (
      <Image key={slot} source={item.image} style={StyleSheet.absoluteFill} contentFit="contain" />
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
