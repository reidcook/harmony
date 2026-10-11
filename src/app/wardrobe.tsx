import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { HarmonyAvatar } from '@/components/harmony-avatar';
import { COSMETICS, SLOTS, type Cosmetic, type Slot } from '@/constants/cosmetics';
import { formatHearts } from '@/constants/rewards';
import { Colors } from '@/constants/theme';
import { useRewards } from '@/hooks/use-rewards';
import { useBalance, useEquipped, usePurchases } from '@/hooks/use-wardrobe';
import { describeError } from '@/lib/cloud';
import { buyItem, equipItem, ownsItem } from '@/lib/wardrobe';

// The shop and dressing room. Tapping an item tries it on in the preview; the button below
// buys, wears, or takes it off.
export default function Wardrobe() {
  const rewards = useRewards();
  const purchases = usePurchases();
  const equipped = useEquipped();
  const balance = useBalance();

  const [slot, setSlot] = useState<Slot>(SLOTS[0].id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = COSMETICS.filter((c) => c.slot === slot);
  const selected = items.find((c) => c.id === selectedId);
  const owns = (item: Cosmetic) => ownsItem(item.id, rewards, purchases);
  const preview = selected ? { ...equipped, [slot]: selected.id } : equipped;

  const chooseSlot = (next: Slot) => {
    setSlot(next);
    setSelectedId(null);
    setError(null);
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text style={styles.done}>Done</Text>
          </Pressable>
        </View>

        <View>
          <Text style={styles.title}>Harmony’s wardrobe</Text>
          <Text style={styles.subtitle}>
            Earn hearts for every day you study an hour or more, and for meeting your weekly goal.
            Keep your streak going for bonus hearts.
          </Text>
        </View>

        <View style={styles.previewCard}>
          <HarmonyAvatar equipped={preview} size={160} />
          <Text style={styles.balance}>♥ {formatHearts(balance)}</Text>
        </View>

        <View style={styles.chips}>
          {SLOTS.map((s) => (
            <Chip key={s.id} label={s.label} selected={slot === s.id} onPress={() => chooseSlot(s.id)} />
          ))}
        </View>

        <View style={styles.grid}>
          {items.map((item) => {
            const wearing = equipped[slot] === item.id;
            const status = wearing
              ? 'Wearing'
              : owns(item)
                ? 'Owned'
                : item.price !== undefined
                  ? `♥ ${item.price}`
                  : '🔒 Milestone';
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  setSelectedId(item.id === selectedId ? null : item.id);
                  setError(null);
                }}
                style={({ pressed }) => [
                  styles.tile,
                  item.id === selectedId && styles.tileSelected,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: item.id === selectedId }}>
                <Image source={item.image} style={styles.tileImage} contentFit="contain" />
                <Text style={styles.tileName}>{item.name}</Text>
                <Text style={[styles.tileStatus, wearing && styles.tileStatusWearing]}>{status}</Text>
              </Pressable>
            );
          })}
        </View>

        {selected && (
          <ItemAction
            item={selected}
            owned={owns(selected)}
            wearing={equipped[slot] === selected.id}
            balance={balance}
            busy={busy}
            onBuy={() =>
              run(async () => {
                await buyItem(selected.id);
                await equipItem(slot, selected.id);
              })
            }
            onWear={() => run(() => equipItem(slot, selected.id))}
            onTakeOff={() => run(() => equipItem(slot, null))}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

type ActionProps = {
  item: Cosmetic;
  owned: boolean;
  wearing: boolean;
  balance: number;
  busy: boolean;
  onBuy: () => void;
  onWear: () => void;
  onTakeOff: () => void;
};

function ItemAction({ item, owned, wearing, balance, busy, onBuy, onWear, onTakeOff }: ActionProps) {
  if (!owned && item.milestone) {
    return <Text style={styles.hint}>Unlocks when you {lowerFirst(item.milestone.label)}.</Text>;
  }

  const short = !owned && item.price !== undefined ? item.price - balance : 0;
  const label = wearing
    ? 'Take off'
    : owned
      ? `Wear ${item.name.toLowerCase()}`
      : short > 0
        ? `${formatHearts(short)} to go`
        : `Buy for ${formatHearts(item.price ?? 0)}`;
  const disabled = busy || short > 0;

  return (
    <Pressable
      onPress={wearing ? onTakeOff : owned ? onWear : onBuy}
      disabled={disabled}
      style={({ pressed }) => [
        styles.action,
        wearing && styles.actionSecondary,
        disabled && styles.actionDisabled,
        pressed && styles.pressed,
      ]}>
      {busy ? (
        <ActivityIndicator color={wearing ? Colors.accentDeep : Colors.card} />
      ) : (
        <Text style={[styles.actionText, wearing && styles.actionTextSecondary]}>{label}</Text>
      )}
    </Pressable>
  );
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    gap: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
  },
  done: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accentDeep,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textMuted,
  },
  previewCard: {
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 20,
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  balance: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.accentDeep,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  tile: {
    width: '48%',
    alignItems: 'center',
    gap: 4,
    padding: 14,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Colors.card,
    boxShadow: '0 4px 12px rgba(224, 103, 154, 0.15)',
  },
  tileSelected: {
    borderColor: Colors.accentDeep,
  },
  tileImage: {
    width: 96,
    height: 96,
  },
  tileName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  tileStatus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tileStatusWearing: {
    color: Colors.accentDeep,
  },
  pressed: {
    opacity: 0.7,
  },
  hint: {
    fontSize: 15,
    lineHeight: 21,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  action: {
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.accentDeep,
  },
  actionSecondary: {
    borderWidth: 1.5,
    borderColor: Colors.accentDeep,
    backgroundColor: 'transparent',
  },
  actionDisabled: {
    backgroundColor: Colors.accent,
    opacity: 0.6,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.card,
  },
  actionTextSecondary: {
    color: Colors.accentDeep,
  },
  error: {
    fontSize: 14,
    color: Colors.danger,
  },
});
