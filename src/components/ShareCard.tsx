import * as Sharing from 'expo-sharing';
import React, { useRef } from 'react';
import { Image, Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { track } from '../analytics';
import { strings } from '../i18n';
import { palette } from '../theme';

type CardData = { number: number; mateIn: number; attempts: number; hints: number; streak: number };

// 카드 배경을 꾸미는 작은 캡슐 색종이 [left, top, 회전, 색]
const CONFETTI: [number, number, number, string][] = [
  [18, 22, -25, palette.butter],
  [262, 34, 30, '#FF8C94'],
  [28, 236, 20, '#8EC5FF'],
  [270, 250, -35, palette.mint],
  [236, 132, 15, palette.butter],
  [44, 150, 40, '#FF8C94'],
];

// 공유용 결과 카드 (화면에 보이는 그대로 이미지로 캡처)
function Card({ number, mateIn, attempts, hints, streak }: CardData) {
  return (
    <View style={styles.card}>
      {CONFETTI.map(([left, top, rotate, color], i) => (
        <View key={i} style={[styles.confetti, { left, top, backgroundColor: color, transform: [{ rotate: `${rotate}deg` }] }]} />
      ))}
      <Text style={styles.brand}>{strings.shareCard.brandLine(number)}</Text>
      <Image source={require('../../assets/mascot/happy.png')} style={styles.mascot} />
      <Text style={styles.title}>{strings.shareCard.solved(mateIn)}</Text>
      <Text style={styles.tries}>
        {'🟥'.repeat(attempts - 1)}🟩{'💡'.repeat(hints)}
      </Text>
      <View style={styles.streak}>
        <Text style={styles.streakText}>{strings.shareCard.streak(streak)}</Text>
      </View>
      <Text style={styles.footer}>{strings.subtitle}</Text>
    </View>
  );
}

type Props = { visible: boolean; onClose: () => void; data: CardData; text: string; onCopied: () => void };

// 결과 카드 미리보기 + 공유 (휴대폰: 이미지/텍스트, 웹: 텍스트)
export function ShareCardModal({ visible, onClose, data, text, onCopied }: Props) {
  const cardRef = useRef<View>(null);
  const canShareImage = Platform.OS !== 'web';

  const shareImage = async () => {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile', width: 1080, height: 1080 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png', dialogTitle: strings.shareCard.title });
      track('share', { source: 'daily', format: 'image' });
    } catch {
      // 사용자가 취소했거나 공유 불가
    }
  };

  const shareText = async () => {
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
      track('share', { source: 'daily', format: 'text' });
    } catch {
      // 사용자가 공유를 취소한 경우 등
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View ref={cardRef} collapsable={false}>
          <Card {...data} />
        </View>
        <View style={styles.actions}>
          {canShareImage && (
            <TouchableOpacity style={styles.primary} onPress={shareImage}>
              <Text style={styles.primaryText}>{strings.shareCard.shareImage}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={canShareImage ? styles.secondary : styles.primary} onPress={shareText}>
            <Text style={canShareImage ? styles.secondaryText : styles.primaryText}>{strings.shareCard.shareText}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Text style={styles.closeText}>{strings.shareCard.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(58, 52, 69, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 16 },
  card: { width: 300, height: 300, backgroundColor: palette.mintLight, borderRadius: 28, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center', paddingBottom: 30, overflow: 'hidden' },
  confetti: { position: 'absolute', width: 12, height: 20, borderRadius: 6, borderWidth: 2, borderColor: palette.ink },
  brand: { fontSize: 13, fontWeight: '800', color: palette.inkSoft },
  mascot: { width: 96, height: 96, marginVertical: 4 },
  title: { fontSize: 23, fontWeight: '900', color: palette.ink },
  tries: { fontSize: 24, marginTop: 6, letterSpacing: 2 },
  streak: { backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 3, marginTop: 8 },
  streakText: { fontSize: 14, fontWeight: '900', color: palette.ink },
  footer: { position: 'absolute', bottom: 12, fontSize: 11, color: palette.inkSoft },
  actions: { width: 300, gap: 8 },
  primary: { alignItems: 'center', backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, borderRadius: 22, paddingVertical: 12 },
  primaryText: { fontSize: 16, fontWeight: '900', color: palette.ink },
  secondary: { alignItems: 'center', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 22, paddingVertical: 12 },
  secondaryText: { fontSize: 16, fontWeight: '800', color: palette.ink },
  close: { alignItems: 'center', paddingVertical: 10 },
  closeText: { fontSize: 15, fontWeight: '700', color: palette.white },
});
