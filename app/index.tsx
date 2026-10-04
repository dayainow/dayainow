import { type Href, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAX_STARS } from '../src/campaign/stages';
import { WelcomeModal } from '../src/components/WelcomeModal';
import { strings } from '../src/i18n';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, emptyProgress, loadProgress, recordOnboarded, totalStars } from '../src/storage/progress';
import { palette } from '../src/theme';
import { LESSONS } from '../src/tutorial/lessons';

type MenuItem = { label: string; info?: string; href: Href; primary?: boolean };

export default function HomeScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  // 저장된 기록을 읽기 전에는 환영 안내를 띄우지 않음 (이미 본 사람에게 깜빡 보이지 않게)
  const [loaded, setLoaded] = useState(false);
  // 앱을 켜 둔 채 날짜가 바뀌어도 맞도록 화면에 돌아올 때마다 다시 계산
  const [daily, setDaily] = useState(() => getDailyPuzzle());

  useFocusEffect(
    useCallback(() => {
      setDaily(getDailyPuzzle());
      loadProgress().then(saved => {
        setProgress(saved);
        setLoaded(true);
      });
    }, [])
  );

  const solvedToday = !!progress.daily.records[daily.dateKey]?.solved;

  // 환영 안내는 한 번만: 고르면 바로 기록하고 해당 화면으로 이동
  const finishOnboarding = (href?: Href) => {
    setProgress(p => ({ ...p, onboarded: true }));
    recordOnboarded();
    if (href) router.push(href);
  };
  const lessonsDone = LESSONS.filter(l => progress.tutorial[l.id]).length;
  const items: MenuItem[] = [
    {
      label: strings.home.daily,
      info: solvedToday
        ? strings.home.dailySolved(currentStreak(progress, daily.dateKey))
        : strings.home.dailyInfo(daily.number, daily.mateIn),
      href: '/daily',
      primary: true,
    },
    {
      label: strings.home.learn,
      info: lessonsDone === 0 ? strings.home.learnInfoNew : strings.home.learnInfo(lessonsDone, LESSONS.length),
      href: '/learn',
    },
    { label: strings.home.campaign, info: strings.home.campaignInfo(totalStars(progress), MAX_STARS), href: '/campaign' },
    { label: strings.home.freePlay, info: strings.home.freePlayInfo, href: '/play' },
    { label: strings.home.settings, href: '/settings' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Image source={require('../assets/splash-icon.png')} style={styles.logo} />
        <Text style={styles.title}>{strings.appTitle}</Text>
        <Text style={styles.subtitle}>{strings.subtitle}</Text>
      </View>

      <View style={styles.menu}>
        {items.map(item => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuButton, item.primary && styles.menuButtonPrimary]}
            onPress={() => router.push(item.href)}
          >
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.info ? <Text style={styles.menuInfo}>{item.info}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>

      <WelcomeModal
        visible={loaded && !progress.onboarded}
        onNewPlayer={() => finishOnboarding('/learn/king')}
        onKnowsChess={() => finishOnboarding('/campaign/1')}
        onLater={() => finishOnboarding()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist, justifyContent: 'center', paddingHorizontal: 24 },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 120, height: 120 },
  title: { fontSize: 34, fontWeight: '900', color: palette.ink, marginTop: 8 },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 4 },
  menu: { gap: 12, alignSelf: 'stretch', maxWidth: 420, width: '100%', marginHorizontal: 'auto' },
  menuButton: { backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 18, paddingVertical: 14, paddingHorizontal: 20 },
  menuButtonPrimary: { backgroundColor: palette.butter },
  menuLabel: { fontSize: 18, fontWeight: '800', color: palette.ink },
  menuInfo: { fontSize: 14, color: palette.inkSoft, marginTop: 2 },
});
