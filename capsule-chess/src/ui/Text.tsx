import React from 'react';
import { Platform, Text as RNText, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { isKorean } from '../i18n';
import { palette } from '../theme';
import { fonts } from './fonts';

// 한국어는 단어 중간에서 줄이 바뀌지 않게 (iOS는 전용 옵션, 웹은 CSS keep-all)
const KEEP_WORDS = isKorean && Platform.OS === 'web' ? ({ wordBreak: 'keep-all' } as TextStyle) : null;

// 앱 전체 글자: 게임 글꼴이 기본. 글꼴 파일이 굵기 하나씩이라 fontWeight는 뺌
// (안드로이드는 파일에 없는 굵기를 요청하면 시스템 글꼴로 돌아가 버림)
export function Text({ style, ...props }: TextProps) {
  const { fontWeight: _weight, ...rest } = StyleSheet.flatten(style) ?? {};
  return (
    <RNText lineBreakStrategyIOS={isKorean ? 'hangul-word' : undefined} {...props} style={[styles.base, KEEP_WORDS, rest]} />
  );
}

const styles = StyleSheet.create({
  base: { fontFamily: fonts.body, color: palette.ink },
});
