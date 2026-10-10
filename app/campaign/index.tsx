import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CAPSULES, isCapsuleCleared, opponentFor } from '../../src/campaign/league';
import { STAGES, isStageUnlocked } from '../../src/campaign/stages';
import { strings } from '../../src/i18n';
import { type Progress, emptyProgress, loadProgress } from '../../src/storage/progress';
import { palette } from '../../src/theme';
import { CapsuleBadge } from '../../src/ui/CapsuleBadge';
import { Panel } from '../../src/ui/Panel';
import { PieceImage } from '../../src/ui/PieceImage';
import { Text } from '../../src/ui/Text';

// 캡슐 리그 지도: 캡슐마다 배지 + 상대 5명 (마지막은 마스터)
export default function CampaignScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {CAPSULES.map(capsule => {
          const stages = STAGES.filter(s => s.world === capsule.id);
          const cleared = stages.filter(s => (progress.campaign[s.id] ?? 0) > 0).length;
          const earned = isCapsuleCleared(progress.campaign, capsule.id);
          return (
            <Panel key={capsule.id} style={styles.capsule}>
              <View style={styles.header}>
                <CapsuleBadge capsule={capsule.id} earned={earned} size={46} />
                <View style={styles.headerBody}>
                  <Text style={styles.capsuleName}>
                    {strings.league.capsule(capsule.id)} · {strings.league.capsuleNames[capsule.id - 1]}
                  </Text>
                  <Text style={styles.badgeName}>
                    {earned ? `🏅 ${strings.league.badgeNames[capsule.id - 1]}` : `${cleared} / ${stages.length}`}
                  </Text>
                </View>
              </View>
              <View style={styles.row}>
                {stages.map(stage => {
                  const stars = progress.campaign[stage.id] ?? 0;
                  const unlocked = isStageUnlocked(progress.campaign, stage.id);
                  const opponent = opponentFor(stage);
                  return (
                    <Pressable
                      key={stage.id}
                      disabled={!unlocked}
                      style={styles.node}
                      onPress={() => router.push(`/campaign/${stage.id}`)}
                      accessibilityLabel={strings.league.opponents[opponent.index]}
                    >
                      <View style={[styles.face, opponent.isMaster && styles.master, stars > 0 && styles.cleared, !unlocked && styles.locked]}>
                        {unlocked ? <PieceImage piece={opponent.avatar} size={46} /> : <Text style={styles.lock}>🔒</Text>}
                      </View>
                      <Text style={[styles.stars, stars === 0 && styles.starsEmpty]}>{'★'.repeat(stars) + '☆'.repeat(3 - stars)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </Panel>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 16, alignSelf: 'center', width: '100%', maxWidth: 480 },
  capsule: { padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBody: { flex: 1 },
  capsuleName: { fontSize: 18 },
  badgeName: { fontSize: 14, color: palette.inkSoft },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  node: { alignItems: 'center', gap: 3 },
  face: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, borderColor: palette.ink, backgroundColor: palette.redLight, alignItems: 'center', justifyContent: 'center' },
  master: { backgroundColor: palette.sunLight, borderWidth: 4 },
  cleared: { backgroundColor: palette.mintLight },
  locked: { backgroundColor: palette.line, borderColor: '#B9C3CF' },
  lock: { fontSize: 20 },
  stars: { fontSize: 12, color: palette.star, letterSpacing: 1 },
  starsEmpty: { color: '#B9C3CF' },
});
