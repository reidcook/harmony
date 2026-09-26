import { SymbolView } from 'expo-symbols';

import { Colors } from '@/constants/theme';
import { useDailyGoal } from '@/hooks/use-daily-goal';

type Props = {
  minutes: number;
  size: number;
};

// Deep pink once the goal is met, light pink for some study, pale for none
export function DayHeart({ minutes, size }: Props) {
  const goal = useDailyGoal();
  const color =
    minutes >= goal ? Colors.accentDeep : minutes > 0 ? Colors.accent : Colors.track;

  return (
    <SymbolView
      name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
      tintColor={color}
      size={size}
    />
  );
}
