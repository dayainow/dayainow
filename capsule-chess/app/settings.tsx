import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { strings } from '../src/i18n';
import { track } from '../src/analytics';
import { feedback } from '../src/feedback/feedback';
import { disableDailyReminder, enableDailyReminder, isReminderSupported } from '../src/notifications';
import { resetProgress } from '../src/storage/progress';
import { DEFAULT_SETTINGS, type Settings, getCachedSettings, loadSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';
import { Panel } from '../src/ui/Panel';
import { Text } from '../src/ui/Text';

export default function SettingsScreen() {
  // 실수로 지우지 않도록 두 번 눌러야 초기화 (확인 대화상자는 웹에서 동작하지 않음)
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'done'>('idle');
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const toggle = async (key: 'soundEnabled' | 'hapticsEnabled', value: boolean) => {
    setSettings(await updateSettings({ [key]: value }));
    track('setting_change', { key, value });
    // 켜는 순간 바로 들리고 느껴지도록 미리 보기
    if (value) feedback.select();
  };

  // 알림은 켤 때 권한을 묻고, 거절하면 꺼진 상태로 둠
  const toggleReminder = async (value: boolean) => {
    track('setting_change', { key: 'reminderEnabled', value });
    if (value) {
      const enabled = await enableDailyReminder();
      setSettings(await updateSettings({ reminderEnabled: enabled }));
    } else {
      await disableDailyReminder();
      setSettings(await updateSettings({ reminderEnabled: false }));
    }
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
      <Panel style={styles.card}>
        {isReminderSupported && (
          <View style={styles.row}>
            <Text style={styles.label}>{strings.settings.reminder}</Text>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={toggleReminder}
              trackColor={{ true: palette.mint, false: palette.line }}
              thumbColor={palette.white}
            />
          </View>
        )}
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
      </Panel>

      <Pressable onPress={() => router.push('/themes')}>
        <Panel style={styles.card}>
          <View style={[styles.row, styles.rowLast]}>
            <Text style={styles.label}>{strings.themes.button}</Text>
            <Text style={styles.value}>{strings.themes.names[getCachedSettings().boardTheme] ?? ''} ›</Text>
          </View>
        </Panel>
      </Pressable>

      <Panel style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{strings.settings.language}</Text>
          <Text style={styles.value}>{strings.settings.languageValue}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{strings.settings.version}</Text>
          <Text style={styles.value}>{Constants.expoConfig?.version ?? '-'}</Text>
        </View>
      </Panel>

      <Pressable
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
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.bg, padding: 20, gap: 16, alignItems: 'center' },
  card: { alignSelf: 'stretch', maxWidth: 440, width: '100%', marginHorizontal: 'auto', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 17 },
  value: { fontSize: 15, color: palette.inkSoft },
  resetButton: { alignSelf: 'stretch', maxWidth: 440, width: '100%', marginHorizontal: 'auto', alignItems: 'center', paddingVertical: 13, borderRadius: 18, borderWidth: 3, borderBottomWidth: 6, borderColor: palette.line, backgroundColor: palette.white },
  resetButtonConfirming: { borderColor: palette.danger, backgroundColor: palette.coralLight },
  resetText: { fontSize: 16, color: palette.inkSoft },
  resetTextConfirming: { color: palette.danger },
});
