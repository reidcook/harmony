import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatHearts } from '@/constants/rewards';
import { Colors } from '@/constants/theme';
import { usePendingRewards } from '@/hooks/use-rewards';
import { clearPendingRewards, describeReward, totalPoints } from '@/lib/rewards';

// Shows what was just earned until it's dismissed
export function RewardCelebration() {
  const pending = usePendingRewards();
  if (pending.length === 0) return null;

  const openWardrobe = () => {
    clearPendingRewards();
    router.push('/wardrobe');
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🎉 You earned {formatHearts(totalPoints(pending))}!</Text>
      {pending.map((reward) => (
        <Text key={reward.id} style={styles.line}>
          ♥ {reward.points} · {describeReward(reward)}
        </Text>
      ))}
      <View style={styles.buttons}>
        <Pressable
          onPress={openWardrobe}
          style={({ pressed }) => [styles.button, styles.primary, pressed && styles.pressed]}>
          <Text style={[styles.buttonText, styles.primaryText]}>Visit the wardrobe</Text>
        </Pressable>
        <Pressable
          onPress={clearPendingRewards}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Yay!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 6,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 2,
    borderColor: Colors.accent,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  line: {
    fontSize: 15,
    color: Colors.text,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.accentDeep,
  },
  primary: {
    backgroundColor: Colors.accentDeep,
  },
  pressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.accentDeep,
  },
  primaryText: {
    color: Colors.card,
  },
});
