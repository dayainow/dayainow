import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import { Modal, Platform, Share, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { track } from '../analytics';
import { CAPSULES } from '../campaign/league';
import { strings } from '../i18n';
import { palette } from '../theme';
import { CapsuleBadge } from '../ui/CapsuleBadge';
import { Chip } from '../ui/Chip';
import { GameButton } from '../ui/GameButton';
import { MascotFace } from '../ui/MascotFace';
import { PieceImage } from '../ui/PieceImage';
import { Text } from '../ui/Text';

// 공유할 수 있는 결과 세 가지: 오늘의 퍼즐, 단계 클리어, 배지 획득
export type ShareContent =
  | { kind: 'daily'; number: number; mateIn: number; attempts: number; hints: number; streak: number }
  | { kind: 'stage'; capsule: number; step: number; stars: number; moves: number; opponent: string; avatar: string }
  | { kind: 'badge'; capsule: number; earned: number };

// 창 하나가 닫힌 뒤 다른 창을 띄울 때 기다리는 시간
export const MODAL_SWAP_MS = 350;

const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(3 - n);

// 텍스트로 공유할 때의 문구
export const shareTextFor = (content: ShareContent): string => {
  const s = strings.shareCard;
  switch (content.kind) {
    case 'daily':
      return strings.daily.shareText(content.number, content.mateIn, content.attempts, content.streak, content.hints);
    case 'stage':
      return s.stageText(content.capsule, content.step, stars(content.stars), content.opponent, content.moves);
    case 'badge':
      return s.badgeText(strings.league.badgeNames[content.capsule - 1], content.earned, CAPSULES.length);
  }
};

// 카드 배경을 꾸미는 작은 캡슐 색종이 [left, top, 회전, 색]
const CONFETTI: [number, number, number, string][] = [
  [18, 22, -25, palette.sun],
  [262, 34, 30, palette.red],
  [28, 236, 20, palette.blue],
  [270, 250, -35, palette.mint],
  [240, 136, 15, palette.sun],
  [40, 150, 40, palette.red],
];

function Frame({ color, brand, children }: { color: string; brand: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { backgroundColor: color }]}>
      {CONFETTI.map(([left, top, rotate, c], i) => (
        <View key={i} style={[styles.confetti, { left, top, backgroundColor: c, transform: [{ rotate: `${rotate}deg` }] }]} />
      ))}
      <Text style={styles.brand}>{brand}</Text>
      {children}
      <Text style={styles.footer}>{strings.subtitle}</Text>
    </View>
  );
}

// 공유용 카드 (화면에 보이는 그대로 이미지로 캡처)
function Card({ content }: { content: ShareContent }) {
  const s = strings.shareCard;
  if (content.kind === 'daily') {
    return (
      <Frame color={palette.bg} brand={s.brandLine(content.number)}>
        <MascotFace mood="happy" size={92} />
        <Text style={styles.title}>{s.solved(content.mateIn)}</Text>
        <Text style={styles.tries}>
          {'🟥'.repeat(content.attempts - 1)}🟩{'💡'.repeat(content.hints)}
        </Text>
        <Chip label={s.streak(content.streak)} color={palette.sun} style={styles.chip} />
      </Frame>
    );
  }
  if (content.kind === 'stage') {
    return (
      <Frame color={palette.bg} brand={s.stageBrand(content.capsule, content.step)}>
        <View style={styles.versus}>
          <PieceImage piece="wP" size={88} />
          <Text style={styles.vs}>VS</Text>
          {/* 진 상대는 살짝 기울고 흐리게 */}
          <PieceImage piece={content.avatar} size={72} style={styles.defeated} />
        </View>
        <Text style={styles.title}>{s.cleared}</Text>
        <Text style={styles.stars}>{stars(content.stars)}</Text>
        <Text style={styles.sub}>{s.beat(content.opponent, content.moves)}</Text>
      </Frame>
    );
  }
  return (
    <Frame color={palette.sunLight} brand={s.badgeBrand}>
      <CapsuleBadge capsule={content.capsule} earned size={118} />
      <Text style={[styles.title, styles.badgeTitle]}>{s.badgeTitle(strings.league.badgeNames[content.capsule - 1])}</Text>
      <Chip label={s.badgeCount(content.earned, CAPSULES.length)} style={styles.chip} />
    </Frame>
  );
}

type Props = { visible: boolean; onClose: () => void; content: ShareContent; onCopied: () => void };

// 결과 카드 미리보기 + 공유 (휴대폰: 이미지/텍스트, 웹: 텍스트)
export function ShareCardModal({ visible, onClose, content, onCopied }: Props) {
  const cardRef = useRef<View>(null);
  const canShareImage = Platform.OS !== 'web';

  const shareImage = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1080 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: strings.shareCard.title });
      track('share', { source: content.kind, format: 'image' });
    } catch {
      // 사용자가 취소했거나 공유 불가
    }
  };

  const shareText = async () => {
    const text = shareTextFor(content);
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          onCopied();
        }
      } else {
        await Share.share({ message: text });
      }
      track('share', { source: content.kind, format: 'text' });
    } catch {
      // 사용자가 공유를 취소한 경우 등
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <View ref={cardRef} collapsable={false}>
          <Card content={content} />
        </View>
        <View style={styles.actions}>
          {canShareImage && <GameButton label={strings.shareCard.shareImage} onPress={shareImage} />}
          <GameButton label={strings.shareCard.shareText} onPress={shareText} variant={canShareImage ? 'white' : 'sun'} />
          <GameButton label={strings.shareCard.close} onPress={onClose} variant="white" size="sm" style={styles.close} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(46, 42, 58, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  card: { width: 300, height: 300, borderRadius: 28, borderWidth: 3, borderBottomWidth: 6, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center', paddingBottom: 26, overflow: 'hidden' },
  confetti: { position: 'absolute', width: 12, height: 20, borderRadius: 6, borderWidth: 2, borderColor: palette.ink },
  brand: { fontSize: 14, color: palette.inkSoft, marginBottom: 2 },
  title: { fontSize: 25 },
  badgeTitle: { marginTop: 8 },
  tries: { fontSize: 24, marginTop: 6, letterSpacing: 2 },
  chip: { marginTop: 8 },
  versus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vs: { fontSize: 20, color: palette.inkSoft },
  defeated: { opacity: 0.55, transform: [{ rotate: '18deg' }] },
  stars: { fontSize: 30, color: palette.star, letterSpacing: 3 },
  sub: { fontSize: 15, color: palette.inkSoft, marginTop: 2 },
  footer: { position: 'absolute', bottom: 12, fontSize: 12, color: palette.inkSoft },
  actions: { width: 300, gap: 10 },
  close: { alignSelf: 'center', minWidth: 120 },
});
