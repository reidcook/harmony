import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text } from 'react-native';

import { formatHearts } from '@/constants/rewards';
import { Colors } from '@/constants/theme';
import { useBalance } from '@/hooks/use-wardrobe';

// The heart balance; opens Harmony's wardrobe
export function HeartsButton() {
  const balance = useBalance();

  return (
    <Pressable
      onPress={() => router.push('/wardrobe')}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${formatHearts(balance)}. Open Harmony’s wardrobe`}>
      <SymbolView
        name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
        tintColor={Colors.accentDeep}
        size={20}
      />
      <Text style={styles.count}>{balance}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.card,
    boxShadow: '0 2px 8px rgba(224, 103, 154, 0.18)',
  },
  pressed: {
    opacity: 0.7,
  },
  count: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
});
