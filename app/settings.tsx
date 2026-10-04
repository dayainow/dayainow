import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { strings } from '../src/i18n';
import { feedback } from '../src/feedback/feedback';
import { resetProgress } from '../src/storage/progress';
import { DEFAULT_SETTINGS, type Settings, loadSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';

export default function SettingsScreen() {
  // 실수로 지우지 않도록 두 번 눌러야 초기화 (확인 대화상자는 웹에서 동작하지 않음)
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'done'>('idle');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const toggle = async (key: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
    setSettings(await updateSettings({ [key]: value }));
    // 켜는 순간 바로 들리고 느껴지도록 미리 보기
    if (value) feedback.select();
  };

  const handleReset = async () => {
    if (resetState !== 'confirming') {
      setResetState('confirming');
      return;
    }
    await resetProgress();
    setResetState('done');
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.settings.sound}</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={value => toggle('soundEnabled', value)}
            trackColor={{ true: palette.mint, false: palette.line }}
            thumbColor={palette.white}
          />
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{strings.settings.haptics}</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={value => toggle('hapticsEnabled', value)}
            trackColor={{ true: palette.mint, false: palette.line }}
            thumbColor={palette.white}
          />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.settings.language}</Text>
          <Text style={styles.value}>{strings.settings.languageValue}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{strings.settings.version}</Text>
          <Text style={styles.value}>{Constants.expoConfig?.version ?? '-'}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.resetButton, resetState === 'confirming' && styles.resetButtonConfirming]}
        onPress={handleReset}
        disabled={resetState === 'done'}
      >
        <Text style={[styles.resetText, resetState === 'confirming' && styles.resetTextConfirming]}>
          {resetState === 'confirming'
            ? strings.settings.resetConfirm
            : resetState === 'done'
              ? strings.settings.resetDone
              : strings.settings.resetProgress}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.mintMist, padding: 20, gap: 16, alignItems: 'center' },
  card: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginHorizontal: 'auto', backgroundColor: palette.white, borderRadius: 18, borderWidth: 2, borderColor: palette.ink },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 16, fontWeight: '700', color: palette.ink },
  value: { fontSize: 14, color: palette.inkSoft },
  resetButton: { alignSelf: 'stretch', maxWidth: 420, width: '100%', marginHorizontal: 'auto', alignItems: 'center', paddingVertical: 14, borderRadius: 18, borderWidth: 2, borderColor: palette.line, backgroundColor: palette.white },
  resetButtonConfirming: { borderColor: palette.danger, backgroundColor: palette.coralLight },
  resetText: { fontSize: 15, fontWeight: '700', color: palette.inkSoft },
  resetTextConfirming: { color: palette.danger },
});
