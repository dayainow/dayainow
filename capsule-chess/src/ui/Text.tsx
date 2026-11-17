import React from 'react';
import { Platform, Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { useLanguage } from '../i18n/LanguageProvider';
import { palette } from '../theme';
import { bodyFont } from './fonts';

// 한국어는 단어 중간에서 줄이 바뀌지 않게 (iOS는 전용 옵션, 웹은 CSS keep-all)
const KEEP_WORDS = { wordBreak: 'keep-all' } as TextStyle;

// 앱 전체 글자: 게임 글꼴이 기본. 글꼴 파일이 굵기 하나씩이라 fontWeight는 뺌
// (안드로이드는 파일에 없는 굵기를 요청하면 시스템 글꼴로 돌아가 버림)
export function Text({ style, ...props }: TextProps) {
  const { language } = useLanguage();
  const isKorean = language === 'ko';
  const { fontWeight: _weight, ...rest } = StyleSheet.flatten(style) ?? {};
  return (
    <RNText
      lineBreakStrategyIOS={isKorean ? 'hangul-word' : undefined}
      {...props}
      style={[styles.base, { fontFamily: bodyFont(language) }, isKorean && Platform.OS === 'web' && KEEP_WORDS, rest]}
    />
  );
}

const styles = StyleSheet.create({
  base: { color: palette.ink },
});
