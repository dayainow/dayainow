import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type { Purchase } from 'expo-iap';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { syncFullGame } from './ownership';
import { FULL_GAME_PRODUCT } from './products';
import { loadStoreModule } from './storeModule';

type Store = typeof import('expo-iap');
type Notice = 'pending' | 'unavailable' | 'error' | 'notOwned';
type Billing = {
  owned: boolean | null;
  supported: boolean;
  price: string | null;
  busy: boolean;
  notice: Notice | null;
  buy: () => void;
  restore: () => void;
  retry: () => void;
};

const PURCHASE_KEY = 'purchases:full-game:v1';
const SUPPORTED = (Platform.OS === 'ios' || Platform.OS === 'android') &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
const STORE_PLATFORM = Platform.OS === 'ios' ? 'ios' : 'android';
const BillingContext = createContext<Billing | null>(null);

export function BillingProvider({ children }: { children: React.ReactNode }) {
  const [owned, setOwned] = useState<boolean | null>(SUPPORTED ? null : false);
  const [price, setPrice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const commands = useRef<Pick<Billing, 'buy' | 'restore' | 'retry'> | null>(null);

  useEffect(() => {
    if (!SUPPORTED) return;
    let active = true;
    let store: Store | undefined;
    let listeners: { remove(): void }[] = [];
    let connected = false;
    let operation = false;
    let queue = Promise.resolve();

    const enqueue = (task: () => Promise<void>) => {
      queue = queue.then(async () => {
        if (active) await task();
      }).catch(() => {
        if (active) setNotice('error');
      });
      return queue;
    };

    const saveOwnership = async (value: boolean) => {
      if (!active) return;
      try {
        await AsyncStorage.setItem(PURCHASE_KEY, value ? 'owned' : 'free');
      } catch {
        // A store-confirmed purchase still works in this session if storage fails.
      }
      if (active) setOwned(value);
    };

    const reconcile = (iap: Store, updated?: Purchase) => syncFullGame(iap, STORE_PLATFORM, saveOwnership, updated);

    const handleError = async (iap: Store, error: unknown) => {
      if (!active) return;
      const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
      if (iap.isUserCancelledError(error)) return;
      if (code === iap.ErrorCode.Pending || code === iap.ErrorCode.DeferredPayment) {
        setNotice('pending');
      } else if (code === iap.ErrorCode.AlreadyOwned) {
        const status = await reconcile(iap);
        if (!status.available && active) setNotice(status.pending ? 'pending' : 'error');
      } else {
        setNotice('error');
      }
    };

    const connect = async () => {
      if (!store) {
        const iap = loadStoreModule();
        store = iap;
        listeners = [
          iap.purchaseUpdatedListener(purchase => {
            if (!active || purchase.productId !== FULL_GAME_PRODUCT) return;
            void enqueue(async () => {
              const status = await reconcile(iap, purchase);
              if (active) setNotice(status.pending && !status.available ? 'pending' : null);
            });
          }),
          iap.purchaseErrorListener(error => {
            if (!active || (error.productId && error.productId !== FULL_GAME_PRODUCT) || operation) return;
            void enqueue(() => handleError(iap, error));
          }),
        ];
      }
      if (!connected) {
        connected = await store.initConnection();
        if (!connected) throw new Error('Unable to connect to the store');
      }
      return store;
    };

    const refresh = async () => {
      const iap = await connect();
      // Product lookup and ownership are independent. Existing purchases work
      // even when the store cannot return a new price.
      const [productResult, ownershipResult] = await Promise.allSettled([
        iap.fetchProducts({ skus: [FULL_GAME_PRODUCT], type: 'in-app' }),
        reconcile(iap),
      ]);
      if (!active) return;
      const displayPrice = productResult.status === 'fulfilled'
        ? productResult.value?.find(product => product.id === FULL_GAME_PRODUCT && product.type === 'in-app')?.displayPrice ?? null
        : null;
      setPrice(displayPrice);
      if (ownershipResult.status === 'fulfilled' && ownershipResult.value.available) {
        setNotice(null);
      } else if (ownershipResult.status === 'fulfilled' && ownershipResult.value.pending) {
        setNotice('pending');
      } else if (!displayPrice) {
        setNotice('unavailable');
      } else if (ownershipResult.status === 'rejected') {
        setNotice('error');
      } else {
        setNotice(previous => previous === 'notOwned' || (STORE_PLATFORM === 'ios' && previous === 'pending') ? previous : null);
      }
    };

    const runCommand = (task: (iap: Store) => Promise<void>) => {
      if (!active || operation) return;
      operation = true;
      setBusy(true);
      setNotice(null);
      void enqueue(async () => {
        try {
          const iap = await connect();
          try {
            await task(iap);
          } catch (error) {
            await handleError(iap, error);
          }
        } finally {
          operation = false;
          if (active) setBusy(false);
        }
      });
    };

    commands.current = {
      buy: () => runCommand(async iap => {
        const result = await iap.requestPurchase({
          type: 'in-app',
          request: { apple: { sku: FULL_GAME_PRODUCT }, google: { skus: [FULL_GAME_PRODUCT] } },
        });
        const purchase = (Array.isArray(result) ? result : [result]).find(p => p?.productId === FULL_GAME_PRODUCT) ?? undefined;
        const status = await reconcile(iap, purchase);
        if (active && status.pending && !status.available) setNotice('pending');
      }),
      restore: () => runCommand(async iap => {
        if (Platform.OS === 'ios' && !await iap.syncIOS()) throw new Error('StoreKit sync failed');
        const status = await reconcile(iap);
        if (active && !status.available) setNotice(status.pending ? 'pending' : 'notOwned');
      }),
      retry: () => runCommand(refresh),
    };

    void enqueue(async () => {
      const cached = await AsyncStorage.getItem(PURCHASE_KEY).catch(() => null);
      if (active) setOwned(cached === 'owned');
      await refresh();
    });
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active' && !operation) void enqueue(refresh);
    });

    return () => {
      active = false;
      commands.current = null;
      foreground.remove();
      listeners.forEach(listener => listener.remove());
      void queue.then(() => store?.endConnection()).catch(() => {});
    };
  }, []);

  return (
    <BillingContext.Provider value={{
      owned, supported: SUPPORTED, price, busy, notice,
      buy: () => commands.current?.buy(),
      restore: () => commands.current?.restore(),
      retry: () => commands.current?.retry(),
    }}>
      {children}
    </BillingContext.Provider>
  );
}

export function useBilling() {
  const billing = useContext(BillingContext);
  if (!billing) throw new Error('BillingProvider is missing');
  return billing;
}
