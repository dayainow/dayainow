import React from 'react';
import { Image, type ImageSourcePropType, type ImageStyle, type StyleProp } from 'react-native';

// 기물 몬스터 그림 (scripts/build-pieces.mjs로 생성)
const SOURCES: Record<string, ImageSourcePropType> = {
  wK: require('../../assets/pieces/wK.png'),
  wQ: require('../../assets/pieces/wQ.png'),
  wR: require('../../assets/pieces/wR.png'),
  wB: require('../../assets/pieces/wB.png'),
  wN: require('../../assets/pieces/wN.png'),
  wP: require('../../assets/pieces/wP.png'),
  bK: require('../../assets/pieces/bK.png'),
  bQ: require('../../assets/pieces/bQ.png'),
  bR: require('../../assets/pieces/bR.png'),
  bB: require('../../assets/pieces/bB.png'),
  bN: require('../../assets/pieces/bN.png'),
  bP: require('../../assets/pieces/bP.png'),
};

type Props = {
  piece: string; // 'wN' 같은 기물 코드
  size: number;
  silhouette?: string; // 이 색 한 가지로 칠한 실루엣 (진화 연출, 받지 않은 배지)
  style?: StyleProp<ImageStyle>;
};

export function PieceImage({ piece, size, silhouette, style }: Props) {
  return (
    <Image
      source={SOURCES[piece]}
      tintColor={silhouette}
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={piece}
    />
  );
}
