import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { palette } from '../theme';
import { GameButton } from '../ui/GameButton';
import { Panel } from '../ui/Panel';
import { Text } from '../ui/Text';
import { Confetti } from './Confetti';
import { useModalPresence } from '../ui/modalPresence';

type Action = { label: string; onPress: () => void };

type Props = {
  visible: boolean;
  art: React.ReactNode; // 위쪽 그림 (마스코트 표정, 몬스터 등)
  title: string;
  detail?: string;
  detailColor?: string;
  extra?: React.ReactNode; // 배지 획득 같은 추가 내용
  primary: Action;
  secondary?: Action;
  celebrate?: boolean; // 승리했을 때 색종이
};

// 게임 결과 창: RPG 창 모양 + 장난감 버튼
export function ResultModal({ visible, art, title, detail, detailColor = palette.inkSoft, extra, primary, secondary, celebrate = false }: Props) {
  useModalPresence(visible);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <Panel style={styles.content}>
          <View style={styles.art}>{art}</View>
          <Text style={styles.title}>{title}</Text>
          {detail ? <Text style={[styles.detail, { color: detailColor }]}>{detail}</Text> : null}
          {extra}
          <View style={styles.actions}>
            <GameButton label={primary.label} onPress={primary.onPress} />
            {secondary ? <GameButton label={secondary.label} onPress={secondary.onPress} variant="white" size="sm" /> : null}
          </View>
        </Panel>
        <Confetti run={visible && celebrate} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(46, 42, 58, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { alignItems: 'center', width: '100%', maxWidth: 320, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20 },
  art: { marginBottom: 6 },
  title: { fontSize: 27, textAlign: 'center' },
  detail: { fontSize: 18, marginTop: 4, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: 10, marginTop: 18 },
});
