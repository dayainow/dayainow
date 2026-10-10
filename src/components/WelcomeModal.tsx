import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { strings } from '../i18n';
import { palette } from '../theme';
import { GameButton } from '../ui/GameButton';
import { MascotFace } from '../ui/MascotFace';
import { Panel } from '../ui/Panel';
import { Text } from '../ui/Text';
import { RuleList } from './RuleList';

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
        <Panel style={styles.card}>
          <MascotFace mood="happy" size={88} />
          {step === 'ask' ? (
            <>
              <Text style={styles.title}>{strings.onboarding.title}</Text>
              <Text style={styles.question}>{strings.onboarding.question}</Text>
              <View style={styles.actions}>
                <GameButton label={strings.onboarding.newPlayer} onPress={onNewPlayer} />
                <GameButton label={strings.onboarding.knowsChess} onPress={() => setStep('rules')} variant="white" />
              </View>
              <Pressable style={styles.textButton} onPress={onLater}>
                <Text style={styles.textButtonLabel}>{strings.onboarding.later}</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.title}>{strings.onboarding.rulesTitle}</Text>
              <Text style={styles.question}>{strings.onboarding.rulesIntro}</Text>
              <View style={styles.rules}>
                <RuleList items={strings.rules.diffs} compact />
              </View>
              <Text style={styles.anywhere}>{strings.rules.anywhere}</Text>
              <View style={styles.actions}>
                <GameButton label={strings.onboarding.startChallenge} onPress={onKnowsChess} />
              </View>
              <Pressable style={styles.textButton} onPress={onNewPlayer}>
                <Text style={styles.textButtonLabel}>{strings.home.learn}</Text>
              </Pressable>
            </>
          )}
        </Panel>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(46, 42, 58, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { alignItems: 'center', padding: 22, width: '100%', maxWidth: 360 },
  title: { fontSize: 23, textAlign: 'center', marginTop: 4 },
  question: { fontSize: 16, color: palette.inkSoft, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  rules: { alignSelf: 'stretch', backgroundColor: palette.bg, borderRadius: 16, padding: 14 },
  anywhere: { fontSize: 13, color: palette.inkSoft, textAlign: 'center', marginTop: 10, marginBottom: 14 },
  actions: { alignSelf: 'stretch', gap: 10 },
  textButton: { paddingVertical: 12, marginTop: 4 },
  textButtonLabel: { color: palette.inkSoft, fontSize: 15 },
});
