import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { palette } from '../theme';
import { Panel } from './Panel';
import { Text } from './Text';

const TYPE_MS = 22; // 한 글자씩 나오는 속도

// RPG 대사 상자: 글자가 한 자씩 나오고, 다 나오면 ▼가 깜빡임. 누르면 바로 다 보여 줌
export function DialogBox({ text, style }: { text: string; style?: StyleProp<ViewStyle> }) {
  const chars = Array.from(text);
  const [shown, setShown] = useState(0);
  const blink = useRef(new Animated.Value(1)).current;
  const done = shown >= chars.length;

  useEffect(() => {
    setShown(0);
    const timer = setInterval(() => {
      setShown(n => {
        if (n + 1 >= chars.length) clearInterval(timer);
        return n + 1;
      });
    }, TYPE_MS);
    return () => clearInterval(timer);
  }, [text]);

  useEffect(() => {
    if (!done) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.15, duration: 420, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(blink, { toValue: 1, duration: 420, useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [done]);

  return (
    <Pressable onPress={() => setShown(chars.length)} accessibilityRole="text" accessibilityLabel={text} focusable={false} style={styles.press}>
      <Panel style={[styles.box, style]}>
        {/* 전체 문장으로 자리를 먼저 잡아 두어, 글자가 나오는 동안 상자 크기가 흔들리지 않게 함 */}
        <Text style={[styles.text, styles.ghost]}>{text}</Text>
        <View style={styles.overlay}>
          <Text style={styles.text}>{chars.slice(0, shown).join('')}</Text>
        </View>
        {done && <Animated.Text style={[styles.more, { opacity: blink }]}>▼</Animated.Text>}
      </Panel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { outlineWidth: 0, outlineStyle: 'none' } as object,
  box: { paddingHorizontal: 16, paddingTop: 11, paddingBottom: 13 },
  text: { fontSize: 17, lineHeight: 24 },
  ghost: { opacity: 0 },
  overlay: { position: 'absolute', left: 16, right: 16, top: 11 },
  more: { position: 'absolute', right: 12, bottom: 4, fontSize: 12, color: palette.red },
});
