import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { palette } from '../theme';
import { Confetti } from './Confetti';

type Action = { label: string; onPress: () => void };

type Props = {
  visible: boolean;
  emoji: string;
  title: string;
  detail?: string;
  detailColor?: string;
  primary: Action;
  secondary?: Action;
  celebrate?: boolean; // 승리했을 때 색종이
};

export function ResultModal({ visible, emoji, title, detail, detailColor = palette.inkSoft, primary, secondary, celebrate = false }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.title}>{title}</Text>
          {detail ? <Text style={[styles.detail, { color: detailColor }]}>{detail}</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={primary.onPress}>
            <Text style={styles.primaryText}>{primary.label}</Text>
          </TouchableOpacity>
          {secondary ? (
            <TouchableOpacity style={styles.secondaryButton} onPress={secondary.onPress}>
              <Text style={styles.secondaryText}>{secondary.label}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        <Confetti run={visible && celebrate} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(58, 52, 69, 0.45)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: palette.white, padding: 28, borderRadius: 24, borderWidth: 3, borderColor: palette.ink, alignItems: 'center', width: 290 },
  emoji: { fontSize: 50, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '900', color: palette.ink, marginBottom: 6, textAlign: 'center' },
  detail: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  // 캡슐 아래 반쪽처럼 버터색 + 잉크 외곽선
  primaryButton: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: palette.butter, borderWidth: 2, borderColor: palette.ink, paddingVertical: 12, borderRadius: 20 },
  primaryText: { color: palette.ink, fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { alignSelf: 'stretch', alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  secondaryText: { color: palette.inkSoft, fontSize: 16, fontWeight: '600' },
});
