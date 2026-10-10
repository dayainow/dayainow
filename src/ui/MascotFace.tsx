import React from 'react';
import { Image } from 'react-native';

export type Mood = 'normal' | 'happy' | 'surprised' | 'thinking' | 'sad';

const FACES: Record<Mood, number> = {
  normal: require('../../assets/mascot/normal.png'),
  happy: require('../../assets/mascot/happy.png'),
  surprised: require('../../assets/mascot/surprised.png'),
  thinking: require('../../assets/mascot/thinking.png'),
  sad: require('../../assets/mascot/sad.png'),
};

// 캡슐 속 폰 마스코트 표정 (scripts/build-icons.mjs로 생성)
export function MascotFace({ mood = 'normal', size = 96 }: { mood?: Mood; size?: number }) {
  return <Image source={FACES[mood]} style={{ width: size, height: size }} />;
}
