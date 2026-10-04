import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { STAGES, type Stage, isStageUnlocked } from '../../src/campaign/stages';
import { strings } from '../../src/i18n';
import { type Progress, emptyProgress, loadProgress } from '../../src/storage/progress';
import { palette } from '../../src/theme';

const WORLDS = STAGES.reduce<Record<number, Stage[]>>((acc, stage) => {
  (acc[stage.world] ??= []).push(stage);
  return acc;
}, {});

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
        {Object.entries(WORLDS).map(([world, stages]) => (
          <View key={world} style={styles.world}>
            <Text style={styles.worldTitle}>{strings.campaign.world(Number(world))}</Text>
            <View style={styles.grid}>
              {stages.map(stage => {
                const stars = progress.campaign[stage.id] ?? 0;
                const unlocked = isStageUnlocked(progress.campaign, stage.id);
                return (
                  <TouchableOpacity
                    key={stage.id}
                    disabled={!unlocked}
                    style={[styles.stage, stars > 0 && styles.stageCleared, !unlocked && styles.stageLocked]}
                    onPress={() => router.push(`/campaign/${stage.id}`)}
                  >
                    <Text style={styles.stageNumber}>{unlocked ? stage.id : '🔒'}</Text>
                    <Text style={styles.stars}>{'★'.repeat(stars) + '☆'.repeat(3 - stars)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist },
  content: { padding: 20, gap: 20, alignItems: 'center' },
  world: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginHorizontal: 'auto' },
  worldTitle: { fontSize: 16, fontWeight: '800', color: palette.ink, marginBottom: 8 },
  grid: { flexDirection: 'row', justifyContent: 'space-between' },
  stage: { width: 60, height: 68, borderRadius: 16, borderWidth: 2, borderColor: palette.ink, backgroundColor: palette.white, alignItems: 'center', justifyContent: 'center' },
  stageCleared: { backgroundColor: palette.butterLight },
  stageLocked: { borderColor: palette.line, backgroundColor: palette.line },
  stageNumber: { fontSize: 20, fontWeight: '900', color: palette.ink },
  stars: { fontSize: 11, color: palette.ink, marginTop: 2, letterSpacing: 1 },
});
