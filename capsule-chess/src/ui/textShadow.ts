import { Platform, type TextStyle } from 'react-native';

// 아래로 떨어지는 단단한 글자 그림자 (웹은 CSS 한 줄 형식, 앱은 textShadow* 속성)
export const hardShadow = (color: string, dy: number): TextStyle =>
  Platform.OS === 'web'
    ? ({ textShadow: `0px ${dy}px 0px ${color}` } as TextStyle)
    : { textShadowColor: color, textShadowOffset: { width: 0, height: dy }, textShadowRadius: 0.1 };
