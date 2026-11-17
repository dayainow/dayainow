import { router } from 'expo-router';
import { FullGameOffer } from '../src/billing/FullGameOffer';

export default function UnlockScreen() {
  return <FullGameOffer onClose={() => router.canGoBack() ? router.back() : router.replace('/')} />;
}
