import React, { useState } from 'react';
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { strings } from '../i18n';
import { palette } from '../theme';

type Props = {
  visible: boolean;
  onNewPlayer: () => void; // 처음이에요 → 튜토리얼
  onKnowsChess: () => void; // 규칙 차이를 본 뒤 → 단계별 도전
  onLater: () => void;
};

// 첫 실행 환영 안내: 체스를 처음 하는지 묻고, 아는 사람에게는 이 게임만의 규칙 차이만 짧게 보여 줌
export function WelcomeModal({ visible, onNewPlayer, onKnowsChess, onLater }: Props) {
  const [step, setStep] = useState<'ask' | 'rules'>('ask');

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Image source={require('../../assets/splash-icon.png')} style={styles.logo} />
          {step === 'ask' ? (
            <>
              <Text style={styles.title}>{strings.onboarding.title}</Text>
              <Text style={styles.question}>{strings.onboarding.question}</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={onNewPlayer}>
                <Text style={styles.primaryText}>{strings.onboarding.newPlayer}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => setStep('rules')}>
                <Text style={styles.outlineText}>{strings.onboarding.knowsChess}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={onLater}>
                <Text style={styles.textButtonLabel}>{strings.onboarding.later}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>{strings.onboarding.rulesTitle}</Text>
              <Text style={styles.question}>{strings.onboarding.rulesIntro}</Text>
              <View style={styles.rules}>
                {strings.tutorial.rules.map(rule => (
                  <Text key={rule} style={styles.rule}>
                    • {rule}
                  </Text>
                ))}
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={onKnowsChess}>
                <Text style={styles.primaryText}>{strings.onboarding.startChallenge}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.textButton} onPress={onNewPlayer}>
                <Text style={styles.textButtonLabel}>{strings.home.learn}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(58, 52, 69, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: palette.white, borderRadius: 24, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', padding: 24, width: '100%', maxWidth: 340 },
  logo: { width: 84, height: 84, marginBottom: 6 },
  title: { fontSize: 21, fontWeight: '900', color: palette.ink, textAlign: 'center' },
  question: { fontSize: 15, color: palette.inkSoft, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  rules: { alignSelf: 'stretch', backgroundColor: palette.mintMist, borderRadius: 14, padding: 12, marginBottom: 16 },
  rule: { fontSize: 14, color: palette.ink, lineHeight: 21 },
  primaryButton: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, paddingVertical: 13, borderRadius: 20 },
  primaryText: { color: palette.ink, fontSize: 16, fontWeight: 'bold' },
  outlineButton: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, paddingVertical: 13, borderRadius: 20, marginTop: 10 },
  outlineText: { color: palette.ink, fontSize: 16, fontWeight: 'bold' },
  textButton: { paddingVertical: 12, marginTop: 4 },
  textButtonLabel: { color: palette.inkSoft, fontSize: 14, fontWeight: '600' },
});
