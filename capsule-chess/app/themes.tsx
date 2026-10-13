import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { track } from '../src/analytics';
import { MiniBoard } from '../src/components/MiniBoard';
import { INITIAL_BOARD } from '../src/engine/chessEngine';
import { strings } from '../src/i18n';
import { type Progress, emptyProgress, loadProgress } from '../src/storage/progress';
import { getCachedSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';
import { GameButton } from '../src/ui/GameButton';
import { Panel } from '../src/ui/Panel';
import { Text } from '../src/ui/Text';
import { BOARD_THEMES, isThemeUnlocked } from '../src/ui/boardThemes';

// 판 꾸미기: 업적으로 연 판 중에서 골라 쓰기. 잠긴 판은 흐리게 + 여는 조건
export default function ThemesScreen() {
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [selected, setSelected] = useState(getCachedSettings().boardTheme);

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const choose = (id: string) => {
    setSelected(id);
    updateSettings({ boardTheme: id });
    track('theme_select', { id });
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.intro}>{strings.themes.intro}</Text>
        <View style={styles.grid}>
          {BOARD_THEMES.map(theme => {
            const unlocked = isThemeUnlocked(theme, progress.achievements);
            const inUse = selected === theme.id;
            return (
              <Panel key={theme.id} color={inUse ? palette.sunLight : palette.white} style={styles.card}>
                <View style={!unlocked && styles.lockedPreview}>
                  <MiniBoard board={INITIAL_BOARD} size={128} theme={theme} />
                </View>
                <Text style={styles.name}>{strings.themes.names[theme.id]}</Text>
                {inUse ? (
                  <Text style={styles.inUse}>{strings.themes.inUse}</Text>
                ) : unlocked ? (
                  <GameButton label={strings.themes.use} onPress={() => choose(theme.id)} variant="white" size="sm" />
                ) : (
                  <Text style={styles.locked} numberOfLines={2}>
                    {strings.themes.locked(strings.achievements.items[theme.unlock!].title)}
                  </Text>
                )}
              </Panel>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 16, gap: 12, alignSelf: 'center', width: '100%', maxWidth: 480 },
  intro: { fontSize: 16, color: palette.inkSoft, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  card: { width: '48.5%', alignItems: 'center', paddingTop: 12, paddingBottom: 10, paddingHorizontal: 8, gap: 6 },
  lockedPreview: { opacity: 0.35 },
  name: { fontSize: 18 },
  inUse: { fontSize: 15, color: palette.mintDark, paddingVertical: 6 },
  locked: { fontSize: 13, color: palette.inkSoft, textAlign: 'center', paddingVertical: 4 },
});
