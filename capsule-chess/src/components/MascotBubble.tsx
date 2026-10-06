import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View } from 'react-native';
import type { GameStatus, Move } from '../engine/chessEngine';
import { type Mood, mascotReaction, pickVariant } from '../game/mascot';
import { strings } from '../i18n';
import { palette, sideColors } from '../theme';

const FACES: Record<Mood, number> = {
  normal: require('../../assets/mascot/normal.png'),
  happy: require('../../assets/mascot/happy.png'),
  surprised: require('../../assets/mascot/surprised.png'),
  thinking: require('../../assets/mascot/thinking.png'),
  sad: require('../../assets/mascot/sad.png'),
};

type Props = {
  vsAi: boolean;
  turn: 'w' | 'b';
  status: GameStatus;
  lastMove: Move | null;
  lastCaptured: string | null;
  winner: 'w' | 'b' | null;
  isGameOver: boolean;
  moveCount: number; // 대사 고르기용
};

// 차례 표시 겸 마스코트 반응: 캡슐 폰 표정 + 말풍선
export function MascotBubble({ vsAi, turn, status, lastMove, lastCaptured, winner, isGameOver, moveCount }: Props) {
  const { mood, line } = mascotReaction({ vsAi, turn, status, lastMove, lastCaptured, winner, isGameOver });
  const text =
    line === 'pvpTurn'
      ? strings.mascot.pvpTurn(strings.side[turn])
      : line === 'pvpWin'
        ? strings.mascot.pvpWin(strings.side[winner ?? turn])
        : pickVariant(strings.mascot[line], moveCount);

  // 말이 바뀔 때마다 말풍선이 톡 튀어나오게
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    pop.setValue(0.85);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 160, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [text]);

  return (
    <View style={styles.row}>
      <Image source={FACES[mood]} style={styles.face} />
      <Animated.View style={[styles.bubble, { transform: [{ scale: pop }] }]}>
        <View style={styles.tail} />
        {/* 누구 차례인지 색으로도 알 수 있게 */}
        {!isGameOver && <View style={[styles.dot, { backgroundColor: sideColors[turn] }]} />}
        <Text style={styles.text}>{text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  face: { width: 56, height: 56 },
  bubble: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  // 말풍선 꼬리 (마스코트 쪽을 가리킴)
  tail: { position: 'absolute', left: -7, top: '50%', marginTop: -6, width: 12, height: 12, backgroundColor: palette.white, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: palette.ink, transform: [{ rotate: '45deg' }] },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 1.5, borderColor: palette.ink },
  text: { flexShrink: 1, fontSize: 15, fontWeight: '800', color: palette.ink },
});
