import type { ImageSourcePropType } from 'react-native';

import type { Reward } from '@/lib/rewards';

// Everything Harmony can wear. Only item ids are saved, so items are added here.
//
// Art: each item is a 1000×1000 transparent PNG lined up with assets/harmony/heartprogress.png,
// so layers stack with no offsets. Backgrounds fill the whole square. Save them as
// assets/harmony/cosmetics/<slot>/<name>.png and set `image: require('@/assets/harmony/cosmetics/…')`.

export type Slot = 'background' | 'held' | 'hat';

// The wardrobe tabs, in order
export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hats' },
  { id: 'held', label: 'Held' },
  { id: 'background', label: 'Backgrounds' },
];

export type Milestone = {
  label: string; // how to unlock it, e.g. "Meet your weekly goal 10 times"
  reached: (rewards: Reward[]) => boolean;
};

export type Cosmetic = {
  id: string;
  name: string;
  slot: Slot;
  image: ImageSourcePropType;
} & ({ price: number; milestone?: never } | { milestone: Milestone; price?: never });

export const COSMETICS: Cosmetic[] = [
  // Hats
  {
    id: 'hat-sunglasses',
    name: 'Sunglasses',
    slot: 'hat',
    image: require('@/assets/harmony/cosmetics/hat/Sunglasses.png'),
    price: 200,
  },

  {
    id: 'face-mask',
    name: 'Face Mask',
    slot: 'hat',
    image: require('@/assets/harmony/cosmetics/hat/face-mask.png'),
    price: 50,
  },

  {
    id: 'stethoscope',
    name: 'Stethoscope',
    slot: 'hat',
    image: require('@/assets/harmony/cosmetics/hat/stethoscope.png'),
    price: 50,
  },

  // Held
  {
    id: 'held-coffee',
    name: 'Coffee',
    slot: 'held',
    image: require('@/assets/harmony/cosmetics/held/coffee.png'),
    price: 100,
  },

  {
    id: 'lime-slush',
    name: 'Lime Slush',
    slot: 'held',
    image: require('@/assets/harmony/cosmetics/held/lime-slush.png'),
    price: 100,
  },

  {
    id: 'blood-pressure-cuff',
    name: 'Blood Pressure Cuff',
    slot: 'held',
    image: require('@/assets/harmony/cosmetics/held/blood-pressure-cuff.png'),
    price: 100,
  },

  // Backgrounds
  {
    id: 'background-sun',
    name: 'Sunshine',
    slot: 'background',
    image: require('@/assets/harmony/cosmetics/background/sun.png'),
    price: 250,
  },
];

export function getCosmetic(id: string) {
  return COSMETICS.find((c) => c.id === id);
}

// Milestone eg.  milestone: { label: 'Meet your weekly goal 10 times', reached: (r) => count(r, 'week') >= 10 },
