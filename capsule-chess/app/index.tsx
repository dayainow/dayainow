import { type Href, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MAX_STARS, STAGES, clearedStageCount, nextStageId } from '../src/campaign/stages';
import { track } from '../src/analytics';
import { WelcomeModal } from '../src/components/WelcomeModal';
import { strings } from '../src/i18n';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, emptyProgress, loadProgress, recordOnboarded, totalStars } from '../src/storage/progress';
import { palette } from '../src/theme';
import { LESSONS } from '../src/tutorial/lessons';
import { formatCountdown, msUntilNextDay } from '../src/utils/date';

export default function HomeScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  // 저장된 기록을 읽기 전에는 환영 안내를 띄우지 않음 (이미 본 사람에게 깜빡 보이지 않게)
  const [loaded, setLoaded] = useState(false);
  // 앱을 켜 둔 채 날짜가 바뀌어도 맞도록 화면에 돌아올 때마다 다시 계산
  const [daily, setDaily] = useState(() => getDailyPuzzle());
  const [countdown, setCountdown] = useState(() => formatCountdown(msUntilNextDay(new Date())));

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
  const streak = currentStreak(progress, daily.dateKey);
  const stars = totalStars(progress);
  const next = nextStageId(progress.campaign);
  const cleared = clearedStageCount(progress.campaign);
  const lessonsDone = LESSONS.filter(l => progress.tutorial[l.id]).length;
  const isNewPlayer = lessonsDone === 0 && cleared === 0;

  // 오늘 퍼즐을 풀었으면 다음 퍼즐까지 남은 시간 표시
  useEffect(() => {
    if (!solvedToday) return;
    const tick = setInterval(() => setCountdown(formatCountdown(msUntilNextDay(new Date()))), 1000);
    return () => clearInterval(tick);
  }, [solvedToday]);

  // 환영 안내는 한 번만: 고르면 바로 기록하고 해당 화면으로 이동
  const finishOnboarding = (choice: 'new' | 'knows' | 'later', href?: Href) => {
    setProgress(p => ({ ...p, onboarded: true }));
    recordOnboarded();
    track('onboarding_choice', { choice });
    if (href) router.push(href);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 화면이 넉넉하면 가운데, 작은 휴대폰에서는 스크롤 (로고·메뉴가 잘리지 않게) */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {/* 상단: 연속 기록·별 + 설정 */}
          <View style={styles.topBar}>
            <View style={styles.chips}>
              <View style={[styles.chip, streak === 0 && styles.chipMuted]}>
                <Text style={styles.chipText}>🔥 {streak}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipText}>★ {stars}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.gear} onPress={() => router.push('/settings')} accessibilityLabel={strings.home.settings}>
              <Text style={styles.gearText}>⚙️</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.hero}>
            <Image source={require('../assets/splash-icon.png')} style={styles.logo} />
            <Text style={styles.title}>{strings.appTitle}</Text>
            <Text style={styles.subtitle}>{strings.subtitle}</Text>
          </View>

          {/* 가장 중요한 행동: 오늘의 퍼즐 */}
          <TouchableOpacity style={[styles.card, styles.dailyCard]} onPress={() => router.push('/daily')}>
            <View style={styles.cardBody}>
              <Text style={styles.kicker}>
                {strings.home.daily} · #{daily.number}
              </Text>
              <Text style={styles.cardTitle}>{solvedToday ? strings.home.done : strings.daily.mateIn(daily.mateIn)}</Text>
              <Text style={styles.cardSub}>
                {solvedToday ? strings.home.nextPuzzleIn(countdown) : streak > 0 ? strings.home.keepStreak(streak) : strings.home.startStreak}
              </Text>
            </View>
            <View style={[styles.pill, solvedToday && styles.pillDone]}>
              <Text style={styles.pillText}>{solvedToday ? '✓' : `${strings.home.play} ▶`}</Text>
            </View>
          </TouchableOpacity>

          {/* 이어하기: 탭 한 번에 다음 단계로 */}
          <TouchableOpacity style={styles.card} onPress={() => router.push(next ? `/campaign/${next}` : '/campaign')}>
            <View style={styles.cardBody}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.kicker}>{strings.home.campaign}</Text>
                <TouchableOpacity onPress={() => router.push('/campaign')} hitSlop={10}>
                  <Text style={styles.link}>{strings.home.allStages} ›</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.cardTitle}>
                {next ? `${strings.home.continueLabel} · ${strings.home.continueStage(next)}` : strings.home.allCleared}
              </Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(cleared / STAGES.length) * 100}%` }]} />
              </View>
              <Text style={styles.cardSub}>
                {strings.home.stagesProgress(cleared, STAGES.length)} · ★ {stars} / {MAX_STARS}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.tiles}>
            <TouchableOpacity style={[styles.tile, isNewPlayer && styles.tileHighlight]} onPress={() => router.push('/learn')}>
              <Text style={styles.tileEmoji}>🎓</Text>
              <Text style={styles.tileLabel}>{strings.home.learn}</Text>
              <Text style={styles.tileSub}>
                {lessonsDone === 0 ? strings.home.learnInfoNew : strings.home.learnInfo(lessonsDone, LESSONS.length)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tile} onPress={() => router.push('/play')}>
              <Text style={styles.tileEmoji}>♞</Text>
              <Text style={styles.tileLabel}>{strings.home.freePlay}</Text>
              <Text style={styles.tileSub}>{strings.home.freePlayInfo}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <WelcomeModal
        visible={loaded && !progress.onboarded}
        onNewPlayer={() => finishOnboarding('new', '/learn/king')}
        onKnowsChess={() => finishOnboarding('knows', '/campaign/1')}
        onLater={() => finishOnboarding('later')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  column: { alignSelf: 'center', width: '100%', maxWidth: 440, gap: 14 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  chipMuted: { borderColor: palette.line },
  chipText: { fontSize: 15, fontWeight: '800', color: palette.ink },
  gear: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 18 },
  hero: { alignItems: 'center', marginBottom: 4 },
  logo: { width: 96, height: 96 },
  title: { fontSize: 32, fontWeight: '900', color: palette.ink, marginTop: 6 },
  subtitle: { fontSize: 15, color: palette.inkSoft, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 20, padding: 16, gap: 12 },
  dailyCard: { backgroundColor: palette.butter, paddingVertical: 18 },
  cardBody: { flex: 1, gap: 3 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { fontSize: 13, fontWeight: '800', color: palette.inkSoft },
  cardTitle: { fontSize: 21, fontWeight: '900', color: palette.ink },
  cardSub: { fontSize: 14, color: palette.ink },
  link: { fontSize: 13, fontWeight: '800', color: palette.mintDark },
  pill: { backgroundColor: palette.ink, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  pillDone: { backgroundColor: palette.mintDark },
  pillText: { color: palette.white, fontSize: 15, fontWeight: '900' },
  progressTrack: { height: 10, borderRadius: 5, backgroundColor: palette.line, overflow: 'hidden', marginVertical: 4 },
  progressFill: { height: '100%', backgroundColor: palette.mint, borderRadius: 5 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: palette.white, borderWidth: 2, borderColor: palette.ink, borderRadius: 20, padding: 14, gap: 2 },
  tileHighlight: { backgroundColor: palette.mintLight },
  tileEmoji: { fontSize: 24, color: palette.ink },
  tileLabel: { fontSize: 16, fontWeight: '900', color: palette.ink, marginTop: 4 },
  tileSub: { fontSize: 12, color: palette.inkSoft },
});
