import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export function AddSessionButton() {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.push('/add-session')}
      style={({ pressed }) => [
        styles.button,
        { right: 20 + insets.right, bottom: 20 + insets.bottom },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Log a study session">
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        tintColor={Colors.card}
        size={30}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accentDeep,
    boxShadow: '0 6px 16px rgba(224, 103, 154, 0.4)',
  },
  pressed: {
    transform: [{ scale: 0.94 }],
  },
});
