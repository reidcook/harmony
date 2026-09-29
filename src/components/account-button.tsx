import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { Colors } from '@/constants/theme';
import { useAuthUser } from '@/hooks/use-auth-user';

// Filled once logged in, so backup status shows at a glance
export function AccountButton() {
  const user = useAuthUser();

  return (
    <Pressable
      onPress={() => router.push('/account')}
      hitSlop={10}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={user ? 'Account, logged in' : 'Account, not logged in'}>
      <SymbolView
        name={
          user
            ? { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' }
            : { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }
        }
        tintColor={user ? Colors.accentDeep : Colors.accent}
        size={30}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: Colors.card,
    boxShadow: '0 2px 8px rgba(224, 103, 154, 0.18)',
  },
  pressed: {
    opacity: 0.7,
  },
});
