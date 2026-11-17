import type { PurchaseAndroid, PurchaseIOS } from 'expo-iap';
import { syncFullGame } from '../ownership';
import { FULL_GAME_PRODUCT } from '../products';

const common = {
  id: 'transaction',
  productId: FULL_GAME_PRODUCT,
  purchaseState: 'purchased',
  quantity: 1,
  transactionDate: 1,
  isAutoRenewing: false,
} as const;

const playPurchase: PurchaseAndroid = {
  ...common, store: 'google', storeId: 'play', purchaseToken: 'token', isAcknowledgedAndroid: false,
};
const applePurchase: PurchaseIOS = {
  ...common, store: 'apple', storeId: 'apple', transactionId: 'transaction',
};

const createStore = () => ({
  getAvailablePurchases: jest.fn(),
  getPendingTransactionsIOS: jest.fn().mockResolvedValue([]),
  isTransactionVerifiedIOS: jest.fn().mockResolvedValue(true),
  finishTransaction: jest.fn().mockResolvedValue(undefined),
});

describe('full game purchase ownership', () => {
  it('delivers completed Play purchases before acknowledging and never consumes them', async () => {
    const store = createStore();
    store.getAvailablePurchases.mockResolvedValue([playPurchase]);
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await expect(syncFullGame(store, 'android', saveOwnership)).resolves.toEqual({ available: true, pending: false });
    expect(saveOwnership).toHaveBeenCalledWith(true);
    expect(store.finishTransaction).toHaveBeenCalledWith({ purchase: playPurchase, isConsumable: false });
    expect(saveOwnership.mock.invocationCallOrder[0]).toBeLessThan(store.finishTransaction.mock.invocationCallOrder[0]);
  });

  it('keeps pending Play payments locked and leaves them unacknowledged', async () => {
    const store = createStore();
    store.getAvailablePurchases.mockResolvedValue([{ ...playPurchase, purchaseState: 'pending' }]);
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await expect(syncFullGame(store, 'android', saveOwnership)).resolves.toEqual({ available: false, pending: true });
    expect(saveOwnership).toHaveBeenCalledWith(false);
    expect(store.finishTransaction).not.toHaveBeenCalled();
  });

  it('restores acknowledged Play purchases without acknowledging them again', async () => {
    const store = createStore();
    store.getAvailablePurchases.mockResolvedValue([{ ...playPurchase, isAcknowledgedAndroid: true }]);
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await syncFullGame(store, 'android', saveOwnership);
    expect(saveOwnership).toHaveBeenCalledWith(true);
    expect(store.finishTransaction).not.toHaveBeenCalled();
  });

  it('finishes only unfinished transactions for the verified StoreKit purchase', async () => {
    const store = createStore();
    store.getAvailablePurchases.mockResolvedValue([applePurchase]);
    store.getPendingTransactionsIOS.mockResolvedValue([applePurchase, { ...applePurchase, productId: 'another-product' }]);
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await syncFullGame(store, 'ios', saveOwnership);
    expect(saveOwnership).toHaveBeenCalledWith(true);
    expect(store.finishTransaction).toHaveBeenCalledTimes(1);
    expect(store.finishTransaction).toHaveBeenCalledWith({ purchase: applePurchase, isConsumable: false });
  });

  it.each([
    ['unverified', applePurchase],
    ['revoked', { ...applePurchase, revocationDateIOS: 1 }],
    ['unrelated', { ...applePurchase, productId: 'another-product' }],
  ] as const)('does not deliver a %s iOS purchase', async (_, transaction) => {
    const store = createStore();
    store.getAvailablePurchases.mockResolvedValue([transaction]);
    if (transaction === applePurchase) store.isTransactionVerifiedIOS.mockResolvedValue(false);
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await syncFullGame(store, 'ios', saveOwnership);
    expect(saveOwnership).toHaveBeenCalledWith(false);
    expect(store.finishTransaction).not.toHaveBeenCalled();
  });

  it('preserves cached ownership when the store cannot report its purchases', async () => {
    const store = createStore();
    store.getAvailablePurchases.mockRejectedValue(new Error('offline'));
    const saveOwnership = jest.fn().mockResolvedValue(undefined);
    await expect(syncFullGame(store, 'android', saveOwnership)).rejects.toThrow('offline');
    expect(saveOwnership).not.toHaveBeenCalled();
  });
});
