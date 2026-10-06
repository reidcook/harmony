import type { ImageSourcePropType } from 'react-native';

import type { Reward } from '@/lib/rewards';

// Everything Harmony can wear. Only item ids are saved, so items are added here.
//
// Art: each item is a 1000×1000 transparent PNG lined up with assets/harmony/heartprogress.png,
// so layers stack with no offsets. Backgrounds fill the whole square. Save them as
// assets/harmony/cosmetics/<slot>-<name>.png and set `image: require('@/assets/harmony/cosmetics/…')`.
// Until then `emoji` stands in for the art.

export type Slot = 'background' | 'held' | 'face' | 'hat';

// The wardrobe tabs, in order
export const SLOTS: { id: Slot; label: string }[] = [
  { id: 'hat', label: 'Hats' },
  { id: 'face', label: 'Face' },
  { id: 'held', label: 'Held' },
  { id: 'background', label: 'Backgrounds' },
];

export type Milestone = {
  label: string; // how to unlock it, e.g. "Meet your weekly goal 10 times"
  reached: (rewards: Reward[]) => boolean;
};

const count = (rewards: Reward[], kind: Reward['kind']) =>
  rewards.filter((r) => r.kind === kind).length;

export type Cosmetic = {
  id: string;
  name: string;
  slot: Slot;
  emoji: string;
  image?: ImageSourcePropType;
} & ({ price: number; milestone?: never } | { milestone: Milestone; price?: never });

export const COSMETICS: Cosmetic[] = [
  // Hats
  { id: 'hat-graduation-cap', name: 'Graduation cap', slot: 'hat', emoji: '🎓', price: 300 },
  { id: 'hat-flower-crown', name: 'Flower crown', slot: 'hat', emoji: '🌸', price: 200 },
  { id: 'hat-party', name: 'Party hat', slot: 'hat', emoji: '🥳', price: 150 },
  {
    id: 'hat-pinning-ribbon',
    name: 'Pinning ribbon',
    slot: 'hat',
    emoji: '🎀',
    milestone: { label: 'Meet your weekly goal', reached: (r) => count(r, 'week') >= 1 },
  },

  // Face
  { id: 'face-reading-glasses', name: 'Reading glasses', slot: 'face', emoji: '👓', price: 150 },
  { id: 'face-sunglasses', name: 'Sunglasses', slot: 'face', emoji: '🕶️', price: 200 },
  { id: 'face-blush', name: 'Rosy cheeks', slot: 'face', emoji: '😊', price: 100 },

  // Held
  { id: 'held-stethoscope', name: 'Stethoscope', slot: 'held', emoji: '🩺', price: 250 },
  { id: 'held-coffee', name: 'Coffee', slot: 'held', emoji: '☕', price: 100 },
  { id: 'held-flashcards', name: 'Flashcards', slot: 'held', emoji: '🗂️', price: 150 },
  {
    id: 'held-night-shift-lamp',
    name: 'Night shift lamp',
    slot: 'held',
    emoji: '🏮',
    milestone: { label: 'Meet your weekly goal 10 times', reached: (r) => count(r, 'week') >= 10 },
  },

  // Backgrounds
  { id: 'background-hospital', name: 'Hospital hallway', slot: 'background', emoji: '🏥', price: 400 },
  { id: 'background-library', name: 'Library', slot: 'background', emoji: '📚', price: 300 },
  { id: 'background-stars', name: 'Starry night', slot: 'background', emoji: '✨', price: 250 },
  {
    id: 'background-clinical-rotation',
    name: 'Clinical rotation',
    slot: 'background',
    emoji: '🌈',
    milestone: { label: 'Study an hour or more on 50 days', reached: (r) => count(r, 'day') >= 50 },
  },
];

export function getCosmetic(id: string) {
  return COSMETICS.find((c) => c.id === id);
}
