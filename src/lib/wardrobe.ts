import { getCosmetic, type Slot } from '@/constants/cosmetics';
import { saveEquippedToCloud, savePurchasesToCloud } from '@/lib/cloud';
import { createPersistedStore } from '@/lib/persisted-store';
import { getRewards, totalPoints, type Reward } from '@/lib/rewards';

// What Harmony owns and wears. The balance is never stored: it's everything earned in the
// rewards ledger minus everything spent here.

export type Purchase = { itemId: string; price: number; purchasedAt: number };
export type Equipped = Partial<Record<Slot, string>>; // slot -> item id

export const EMPTY_PURCHASES: Purchase[] = [];
export const EMPTY_EQUIPPED: Equipped = {};

const purchases = createPersistedStore('harmony.purchases', EMPTY_PURCHASES);
const equipped = createPersistedStore('harmony.equipped', EMPTY_EQUIPPED);

export const subscribePurchases = purchases.subscribe;
export const getPurchases = purchases.get;
export const subscribeEquipped = equipped.subscribe;
export const getEquipped = equipped.get;
// For loading from the account and logout. Not saved to the cloud.
export const replacePurchases = purchases.set;
export const replaceEquipped = equipped.set;

export function computeBalance(rewards: Reward[], bought: Purchase[]) {
  return totalPoints(rewards) - bought.reduce((sum, p) => sum + p.price, 0);
}

// Bought, or unlocked by reaching its milestone
export function ownsItem(itemId: string, rewards: Reward[], bought: Purchase[]) {
  const item = getCosmetic(itemId);
  if (!item) return false;
  if (item.milestone) return item.milestone.reached(rewards);
  return bought.some((p) => p.itemId === itemId);
}

// Changes save to the account first (while logged in) and only reach this phone if that works

export async function buyItem(itemId: string) {
  const item = getCosmetic(itemId);
  const rewards = getRewards();
  if (!item || item.price === undefined || ownsItem(itemId, rewards, getPurchases())) return;
  if (computeBalance(rewards, getPurchases()) < item.price) {
    throw new Error('Not enough hearts yet. Keep studying!');
  }
  const purchase: Purchase = { itemId, price: item.price, purchasedAt: Date.now() };
  await savePurchasesToCloud([purchase]);
  purchases.set([...getPurchases(), purchase]);
}

// Puts an owned item on (replacing whatever is in its slot), or empties the slot with null
export async function equipItem(slot: Slot, itemId: string | null) {
  if (itemId && !ownsItem(itemId, getRewards(), getPurchases())) return;
  const { [slot]: _removed, ...rest } = getEquipped();
  const next: Equipped = itemId ? { ...rest, [slot]: itemId } : rest;
  await saveEquippedToCloud(next);
  equipped.set(next);
}
