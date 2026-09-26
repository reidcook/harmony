import { SymbolView } from 'expo-symbols';

import { DAILY_GOAL_MINUTES } from '@/constants/goal';
import { Colors } from '@/constants/theme';

type Props = {
  minutes: number;
  size: number;
};

// Deep pink once the goal is met, light pink for some study, pale for none
export function DayHeart({ minutes, size }: Props) {
  const color =
    minutes >= DAILY_GOAL_MINUTES ? Colors.accentDeep : minutes > 0 ? Colors.accent : Colors.track;

  return (
    <SymbolView
      name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
      tintColor={color}
      size={size}
    />
  );
}
