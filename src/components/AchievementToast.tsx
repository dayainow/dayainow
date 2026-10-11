import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAchievements } from '../achievements/events';
import { ACHIEVEMENTS, type AchievementId } from '../achievements/list';
import { track } from '../analytics';
import { feedback } from '../feedback/feedback';
import { strings } from '../i18n';
import { palette } from '../theme';
import { Panel } from '../ui/Panel';
import { useAnyModalOpen } from '../ui/modalPresence';
import { Text } from '../ui/Text';

const NATIVE = Platform.OS !== 'web';
const SHOW_MS = 2600;

// 업적을 달성하면 화면 위에서 쏙 내려오는 알림. 여러 개면 하나씩 차례로. 누르면 업적 화면
export function AchievementToast() {
  const insets = useSafeAreaInsets();
  const [queue, setQueue] = useState<AchievementId[]>([]);
  const drop = useRef(new Animated.Value(0)).current;
  const modalOpen = useAnyModalOpen();
  // 결과 창·진화 연출 같은 창이 떠 있으면 그 뒤에 가려지므로 닫힐 때까지 기다림
  const current = modalOpen ? undefined : queue[0];

  useEffect(
    () =>
      onAchievements(ids => {
        ids.forEach(id => track('achievement', { id }));
        setQueue(q => [...q, ...ids]);
      }),
    []
  );

  useEffect(() => {
    if (!current) return;
    feedback.star();
    drop.setValue(0);
    const show = Animated.sequence([
      Animated.spring(drop, { toValue: 1, friction: 7, tension: 80, useNativeDriver: NATIVE }),
      Animated.delay(SHOW_MS),
      Animated.timing(drop, { toValue: 0, duration: 220, useNativeDriver: NATIVE }),
    ]);
    // 끝까지 보여 줬을 때만 다음 알림으로. 도중에 창이 열리면 멈췄다가 창이 닫히면 처음부터 다시
    show.start(({ finished }) => finished && setQueue(q => q.slice(1)));
    return () => show.stop();
  }, [current]);

  if (!current) return null;
  const info = ACHIEVEMENTS.find(a => a.id === current)!;

  return (
    <Animated.View
      style={[
        styles.wrap,
        { top: insets.top + 8, opacity: drop, transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] }) }] },
      ]}
    >
      <Pressable onPress={() => router.push('/achievements')}>
        <Panel color={palette.sunLight} style={styles.toast}>
          <View style={[styles.icon, { backgroundColor: info.color }]}>
            <Text style={styles.iconText}>{info.icon}</Text>
          </View>
          <View style={styles.body}>
            <Text style={styles.kicker}>{strings.achievements.unlocked}</Text>
            <Text style={styles.title}>{strings.achievements.items[current].title}</Text>
          </View>
        </Panel>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 100 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, minWidth: 260, maxWidth: 420 },
  icon: { width: 42, height: 42, borderRadius: 21, borderWidth: 2.5, borderColor: palette.ink, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 21 },
  body: { flexShrink: 1 },
  kicker: { fontSize: 13, color: palette.inkSoft },
  title: { fontSize: 18 },
});
