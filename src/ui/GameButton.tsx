import React from 'react';
import { Platform, Pressable, type StyleProp, StyleSheet, type ViewStyle } from 'react-native';
import { palette } from '../theme';
import { Text } from './Text';
import { hardShadow } from './textShadow';

export type ButtonVariant = 'sun' | 'blue' | 'red' | 'white' | 'mint';

const FILL: Record<ButtonVariant, string> = {
  sun: palette.sun,
  blue: palette.blue,
  red: palette.red,
  white: palette.white,
  mint: palette.mint,
};

// 웹에서 창이 열릴 때 첫 버튼에 생기는 포커스 테두리를 숨김 (키보드 사용자는 눌린 효과로 구분)
const NO_FOCUS_RING = Platform.OS === 'web' ? ({ outlineStyle: 'none' } as ViewStyle) : null;

type Props = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

// 장난감 버튼: 누르면 아래 테두리가 얇아지며 쏙 들어감
export function GameButton({ label, onPress, variant = 'sun', size = 'md', disabled = false, style, accessibilityLabel }: Props) {
  const light = variant === 'blue' || variant === 'red';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        NO_FOCUS_RING,
        size === 'sm' && styles.small,
        { backgroundColor: FILL[variant] },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text style={[styles.label, size === 'sm' && styles.labelSmall, light && styles.labelLight]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderBottomWidth: 6, borderColor: palette.ink, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 10 },
  small: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6, borderBottomWidth: 5 },
  // 눌린 만큼 위 여백을 줘서 전체 높이는 그대로
  pressed: { borderBottomWidth: 3, marginTop: 3 },
  disabled: { opacity: 0.45 },
  label: { fontSize: 19, color: palette.ink },
  labelSmall: { fontSize: 16 },
  labelLight: { color: palette.white, ...hardShadow(palette.ink, 2) },
});
