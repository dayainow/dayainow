import { type Href, router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ACHIEVEMENTS } from '../src/achievements/list';
import { track } from '../src/analytics';
import { CAPSULES, STAGES_PER_CAPSULE, earnedBadges, opponentFor } from '../src/campaign/league';
import { getStage, nextStageId } from '../src/campaign/stages';
import { RulesButton } from '../src/components/RulesButton';
import { WelcomeModal } from '../src/components/WelcomeModal';
import { strings } from '../src/i18n';
import { getDailyPuzzle } from '../src/puzzles/daily';
import { type Progress, currentStreak, emptyProgress, loadProgress, recordOnboarded, totalStars } from '../src/storage/progress';
import { palette } from '../src/theme';
import { PRACTICE_COUNT } from '../src/puzzles/practice';
import { LESSONS } from '../src/tutorial/lessons';
import { CapsuleBadge } from '../src/ui/CapsuleBadge';
import { Chip } from '../src/ui/Chip';
import { GameButton } from '../src/ui/GameButton';
import { MascotFace } from '../src/ui/MascotFace';
import { Panel } from '../src/ui/Panel';
import { PieceImage } from '../src/ui/PieceImage';
import { Text } from '../src/ui/Text';
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
  const badges = earnedBadges(progress.campaign);
  const achieved = Object.keys(progress.achievements).length;
  const nextId = nextStageId(progress.campaign);
  const nextStage = nextId ? getStage(nextId) : undefined;
  const opponent = nextStage ? opponentFor(nextStage) : null;
  const lessonsDone = LESSONS.filter(l => progress.tutorial[l.id]).length;
  const isNewPlayer = lessonsDone === 0 && !progress.campaign[1];

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

  const openLeague = () => router.push(nextStage ? `/campaign/${nextStage.id}` : '/campaign');

  return (
    <SafeAreaView style={styles.container}>
      {/* 작은 휴대폰에서는 스크롤 (메뉴가 잘리지 않게) */}
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.column}>
          {/* 트레이너 카드: 마스코트 + 연속 기록·별 + 규칙·설정 */}
          <Panel style={styles.trainer}>
            <Pressable style={styles.trainerMain} onPress={() => router.push('/achievements')} accessibilityLabel={strings.achievements.title}>
              <MascotFace mood="happy" size={60} />
              <View style={styles.trainerBody}>
                <Text style={styles.trainerName} numberOfLines={1}>
                  {strings.league.trainer}
                </Text>
                <View style={styles.chips}>
                  <Chip label={`🔥 ${streak}`} />
                  <Chip label={`★ ${stars}`} />
                  <Chip label={strings.achievements.count(achieved, ACHIEVEMENTS.length)} color={palette.sunLight} />
                </View>
              </View>
            </Pressable>
            <RulesButton source="home" />
            <Pressable style={styles.gear} onPress={() => router.push('/settings')} accessibilityLabel={strings.home.settings}>
              <Text style={styles.gearText}>⚙️</Text>
            </Pressable>
          </Panel>

          {/* 배지 케이스 */}
          <Panel style={styles.badges}>
            <View style={styles.rowBetween}>
              <Text style={styles.sectionTitle}>🏅 {strings.league.badgeCase}</Text>
              <Pressable onPress={() => router.push('/campaign')} hitSlop={10}>
                <Text style={styles.link}>
                  {badges.length} / {CAPSULES.length} · {strings.home.allStages} ›
                </Text>
              </Pressable>
            </View>
            <View style={styles.badgeRow}>
              {CAPSULES.map(c => (
                <CapsuleBadge key={c.id} capsule={c.id} earned={badges.includes(c.id)} size={54} />
              ))}
            </View>
          </Panel>

          {/* 가장 중요한 행동: 오늘의 퍼즐 */}
          <Pressable onPress={() => router.push('/daily')}>
            <Panel color={palette.sun} style={styles.daily}>
              {!solvedToday && (
                <View style={styles.newTag}>
                  <Text style={styles.newTagText}>NEW!</Text>
                </View>
              )}
              <Text style={styles.dailyKicker}>
                {strings.home.daily} #{daily.number}
              </Text>
              <Text style={styles.dailyTitle}>{solvedToday ? strings.home.done : strings.daily.mateIn(daily.mateIn)}</Text>
              <View style={styles.rowBetween}>
                <Text style={styles.dailySub}>
                  {solvedToday ? strings.home.nextPuzzleIn(countdown) : streak > 0 ? strings.home.keepStreak(streak) : strings.home.startStreak}
                </Text>
                <GameButton label={solvedToday ? '✓' : `${strings.home.play} ▶`} onPress={() => router.push('/daily')} variant="white" size="sm" />
              </View>
            </Panel>
          </Pressable>

          {/* 캡슐 리그: 다음 상대와 바로 배틀 */}
          <Pressable onPress={openLeague}>
            <Panel style={styles.league}>
              <View style={styles.opponent}>
                <PieceImage piece={opponent?.avatar ?? 'wK'} size={52} />
              </View>
              <View style={styles.leagueBody}>
                <Text style={styles.muted} numberOfLines={1}>
                  {nextStage ? `${strings.league.capsule(nextStage.world)} · ${strings.league.capsuleNames[nextStage.world - 1]}` : strings.league.title}
                </Text>
                <Text style={styles.leagueTitle} numberOfLines={1}>
                  {opponent ? strings.league.nextOpponent(strings.league.opponents[opponent.index]) : strings.league.allCleared}
                </Text>
                {nextStage && (
                  <View style={styles.steps}>
                    {Array.from({ length: STAGES_PER_CAPSULE }, (_, i) => {
                      const id = (nextStage.world - 1) * STAGES_PER_CAPSULE + i + 1;
                      return <View key={id} style={[styles.step, (progress.campaign[id] ?? 0) > 0 && styles.stepDone, id === nextStage.id && styles.stepNow]} />;
                    })}
                  </View>
                )}
              </View>
              <GameButton label={strings.league.battle} onPress={openLeague} variant="blue" size="sm" />
            </Panel>
          </Pressable>

          {/* 작은 메뉴 3개: 배우기 · 퍼즐 도장 · 자유 대전 */}
          <View style={styles.tiles}>
            {[
              {
                key: 'learn',
                href: '/learn' as const,
                piece: 'wB',
                label: strings.home.learn,
                sub: lessonsDone === 0 ? strings.home.learnInfoNew : strings.home.learnInfo(lessonsDone, LESSONS.length),
                color: isNewPlayer ? palette.mintLight : palette.white,
              },
              {
                key: 'practice',
                href: '/practice' as const,
                piece: 'wQ',
                label: strings.practice.tile,
                sub: strings.practice.tileInfo(Object.keys(progress.practice).length, PRACTICE_COUNT),
                color: palette.white,
              },
              { key: 'play', href: '/play' as const, piece: 'wN', label: strings.home.freePlay, sub: strings.home.freePlayInfo, color: palette.white },
            ].map(tile => (
              <Pressable key={tile.key} style={styles.tileWrap} onPress={() => router.push(tile.href)}>
                <Panel color={tile.color} style={styles.tile}>
                  <PieceImage piece={tile.piece} size={46} />
                  <Text style={styles.tileLabel} numberOfLines={1}>
                    {tile.label}
                  </Text>
                  <Text style={styles.tileSub} numberOfLines={2}>
                    {tile.sub}
                  </Text>
                </Panel>
              </Pressable>
            ))}
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
  container: { flex: 1, backgroundColor: palette.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  column: { alignSelf: 'center', width: '100%', maxWidth: 460, gap: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  muted: { flexShrink: 1, fontSize: 14, color: palette.inkSoft },
  link: { fontSize: 14, color: palette.blueDark },
  sectionTitle: { fontSize: 17 },

  trainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  trainerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  trainerBody: { flex: 1, gap: 4 },
  trainerName: { fontSize: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  gear: { width: 38, height: 38, borderRadius: 19, borderWidth: 2.5, borderColor: palette.ink, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 17 },

  badges: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 12, gap: 10 },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-around' },

  daily: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 2 },
  newTag: { position: 'absolute', top: -13, right: 14, backgroundColor: palette.red, borderWidth: 2.5, borderColor: palette.ink, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 1 },
  newTagText: { fontSize: 13, color: palette.white },
  dailyKicker: { fontSize: 15, color: '#7A5B00' },
  dailyTitle: { fontSize: 27 },
  dailySub: { flexShrink: 1, fontSize: 15 },

  league: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  opponent: { width: 62, height: 62, borderRadius: 16, borderWidth: 2.5, borderColor: palette.ink, backgroundColor: palette.redLight, alignItems: 'center', justifyContent: 'center' },
  leagueBody: { flex: 1, gap: 3 },
  leagueTitle: { fontSize: 18 },
  steps: { flexDirection: 'row', gap: 5, marginTop: 3 },
  step: { width: 20, height: 9, borderRadius: 5, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white },
  stepDone: { backgroundColor: palette.mint },
  stepNow: { backgroundColor: palette.sun },

  tiles: { flexDirection: 'row', gap: 10 },
  tileWrap: { flex: 1 },
  tile: { alignItems: 'center', paddingHorizontal: 6, paddingTop: 8, paddingBottom: 10, minHeight: 124 },
  tileLabel: { fontSize: 16, marginTop: 2 },
  tileSub: { fontSize: 11, color: palette.inkSoft, textAlign: 'center' },
});
