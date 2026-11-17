import type { Purchase } from 'expo-iap';
import { FULL_GAME_PRODUCT } from './products';

type OwnershipStore = Pick<typeof import('expo-iap'),
  'getAvailablePurchases' | 'getPendingTransactionsIOS' | 'isTransactionVerifiedIOS' | 'finishTransaction'
>;

export async function syncFullGame(
  store: OwnershipStore,
  platform: 'ios' | 'android',
  saveOwnership: (owned: boolean) => Promise<void>,
  updated?: Purchase,
) {
  const purchases = await store.getAvailablePurchases({ onlyIncludeActiveItemsIOS: true });
  const product = purchases.find(p => p.productId === FULL_GAME_PRODUCT && p.purchaseState === 'purchased');
  const available = !!product && (platform === 'ios'
    ? product.store === 'apple' && !('revocationDateIOS' in product && product.revocationDateIOS) &&
      await store.isTransactionVerifiedIOS(FULL_GAME_PRODUCT)
    : product.store === 'google' && !!product.purchaseToken);
  // Deliver access before confirming the non-consumable transaction.
  await saveOwnership(available);

  if (available && product) {
    if (platform === 'android') {
      if (!('isAcknowledgedAndroid' in product && product.isAcknowledgedAndroid)) {
        await store.finishTransaction({ purchase: product, isConsumable: false });
      }
    } else {
      const unfinished = await store.getPendingTransactionsIOS();
      for (const transaction of unfinished) {
        if (transaction.productId === FULL_GAME_PRODUCT && transaction.purchaseState === 'purchased') {
          await store.finishTransaction({ purchase: transaction, isConsumable: false });
        }
      }
    }
  }

  return {
    available,
    pending: updated?.purchaseState === 'pending' ||
      purchases.some(p => p.productId === FULL_GAME_PRODUCT && p.purchaseState === 'pending'),
  };
}
