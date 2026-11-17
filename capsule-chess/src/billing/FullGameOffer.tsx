import { router, Stack } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAGES } from '../campaign/stages';
import { useStrings } from '../i18n/LanguageProvider';
import { PRACTICE_COUNT } from '../puzzles/practice';
import { palette } from '../theme';
import { GameButton } from '../ui/GameButton';
import { MascotFace } from '../ui/MascotFace';
import { Panel } from '../ui/Panel';
import { Text } from '../ui/Text';
import { useBilling } from './BillingProvider';
import { FREE_PUZZLES, FREE_STAGES } from './products';

export function FullGameOffer({ onClose }: { onClose: () => void }) {
  const strings = useStrings().billing;
  const { owned, supported, price, busy, notice, buy, restore, retry } = useBilling();

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <Stack.Screen options={{ title: strings.title }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Panel color={palette.mintLight} style={styles.offer}>
          <MascotFace mood="happy" size={90} />
          <Text style={styles.title}>{owned ? strings.owned : strings.title}</Text>
          <Text style={styles.body}>{strings.contents(STAGES.length - FREE_STAGES, PRACTICE_COUNT - FREE_PUZZLES)}</Text>
          <Text style={styles.body}>{strings.permanent}</Text>
        </Panel>

        {!owned && supported && (
          <>
            {busy || (notice === null && !price) ? <ActivityIndicator color={palette.ink} /> : null}
            {price ? (
              <GameButton label={strings.buy(price)} onPress={buy} disabled={busy || owned === null || notice === 'pending'} />
            ) : notice && notice !== 'pending' ? (
              <GameButton label={strings.retry} onPress={retry} disabled={busy} />
            ) : null}
            <GameButton label={strings.restore} onPress={restore} variant="white" disabled={busy || owned === null} />
            {notice && <Text accessibilityLiveRegion="polite" style={styles.body}>{strings[notice]}</Text>}
          </>
        )}
        {!supported && <Text style={styles.body}>{strings.storeBuild}</Text>}
        <GameButton label={strings.keepPlaying} onPress={onClose} variant="white" />
      </ScrollView>
    </SafeAreaView>
  );
}

export function FullGameGate({ children, backTo }: { children: React.ReactNode; backTo: '/campaign' | '/practice' }) {
  const { owned } = useBilling();
  if (owned === null) return <ActivityIndicator style={styles.loading} color={palette.ink} />;
  if (owned) return <>{children}</>;
  return <FullGameOffer onClose={() => router.dismissTo(backTo)} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, width: '100%', maxWidth: 420, alignSelf: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  offer: { alignItems: 'center', padding: 18, gap: 8 },
  title: { fontSize: 24, textAlign: 'center' },
  body: { fontSize: 16, textAlign: 'center' },
  loading: { flex: 1 },
});
