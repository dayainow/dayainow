import React from 'react';
import { StyleSheet, View } from 'react-native';
import { palette } from '../theme';
import { Panel } from './Panel';
import { PieceImage } from './PieceImage';
import { PowerBar } from './PowerBar';
import { Text } from './Text';

type Props = {
  side: 'w' | 'b';
  avatar: string; // 'bN' 같은 기물 코드
  name: string;
  detail?: string; // 오른쪽 작은 글자 (Lv., 둔 수 등)
  power: number;
  maxPower: number;
  active?: boolean; // 지금 이 팀 차례
};

// 배틀 화면 위·아래의 팀 정보 창: 얼굴 + 이름 + 전력 게이지
export function TeamPanel({ side, avatar, name, detail, power, maxPower, active = false }: Props) {
  return (
    <Panel style={[styles.panel, active && styles.active]}>
      <View style={[styles.avatar, { backgroundColor: side === 'w' ? palette.blueLight : palette.redLight }]}>
        <PieceImage piece={avatar} size={36} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
        </View>
        <PowerBar value={power} max={maxPower} />
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  panel: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 7 },
  // 차례인 팀은 연노랑 바탕으로 표시
  active: { borderColor: palette.ink, backgroundColor: palette.sunLight },
  avatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 2.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 },
  name: { flexShrink: 1, fontSize: 16 },
  detail: { fontSize: 13, color: palette.inkSoft },
});
