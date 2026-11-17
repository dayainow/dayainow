export function loadStoreModule(): typeof import('expo-iap') {
  throw new Error('Store billing is available on iOS and Android');
}
