import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LanguagePreference } from '../src/i18n';
import { useLanguage, useStrings } from '../src/i18n/LanguageProvider';
import { track } from '../src/analytics';
import { useBilling } from '../src/billing/BillingProvider';
import { feedback } from '../src/feedback/feedback';
import { disableDailyReminder, enableDailyReminder, isReminderSupported } from '../src/notifications';
import { resetProgress } from '../src/storage/progress';
import { type Settings, getCachedSettings, loadSettings, updateSettings } from '../src/storage/settings';
import { palette } from '../src/theme';
import { Panel } from '../src/ui/Panel';
import { Text } from '../src/ui/Text';

const PRIVACY_URL = 'https://dayainow.github.io/dayainow/site/privacy/';

export default function SettingsScreen() {
  const strings = useStrings();
  const { owned, supported } = useBilling();
  const { language, preference, setPreference } = useLanguage();
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [privacyError, setPrivacyError] = useState(false);
  // 실수로 지우지 않도록 두 번 눌러야 초기화 (확인 대화상자는 웹에서 동작하지 않음)
  const [resetState, setResetState] = useState<'idle' | 'confirming' | 'done'>('idle');
  const [settings, setSettings] = useState<Settings>(getCachedSettings);
  const languages: { value: LanguagePreference; label: string }[] = [
    { value: 'system', label: strings.settings.languageSystem },
    { value: 'ko', label: '한국어' },
    { value: 'en', label: 'English' },
  ];

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  const selectLanguage = async (next: LanguagePreference) => {
    if (next === preference || savingLanguage) return;
    setSavingLanguage(true);
    try {
      await setPreference(next);
      track('setting_change', { key: 'language', value: next });
    } finally {
      setSavingLanguage(false);
    }
  };

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
      const enabled = await enableDailyReminder(strings.notification);
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
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
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

        <Pressable style={styles.cardWidth} accessibilityRole="button" onPress={() => router.push('/themes')}>
          <Panel>
            <View style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>{strings.themes.button}</Text>
              <Text style={styles.value}>{strings.themes.names[getCachedSettings().boardTheme] ?? ''} ›</Text>
            </View>
          </Panel>
        </Pressable>

        {supported && (
          <Pressable style={styles.cardWidth} accessibilityRole="button" onPress={() => router.push('/unlock')}>
            <Panel style={[styles.row, styles.rowLast]}>
              <Text style={styles.label}>{owned ? strings.billing.owned : strings.billing.title}</Text>
              <Text style={styles.value}>›</Text>
            </Panel>
          </Pressable>
        )}

        <Panel style={styles.card}>
          <View style={styles.languageSection}>
            <Text style={styles.label}>{strings.settings.language}</Text>
            <View style={styles.languageOptions}>
              {languages.map(({ value, label }) => (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: preference === value, disabled: savingLanguage }}
                  disabled={savingLanguage}
                  onPress={() => selectLanguage(value)}
                  style={[styles.languageOption, preference === value && styles.languageSelected]}
                >
                  <Text style={styles.value}>{label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{strings.settings.version}</Text>
            <Text style={styles.value}>{Constants.expoConfig?.version ?? '-'}</Text>
          </View>
          <Pressable
            accessibilityRole="link"
            style={[styles.row, styles.rowLast]}
            onPress={() => {
              setPrivacyError(false);
              Linking.openURL(`${PRIVACY_URL}#${language}`).catch(() => setPrivacyError(true));
            }}
          >
            <Text style={styles.label}>{strings.settings.privacy}</Text>
            <Text style={styles.value}>›</Text>
          </Pressable>
          {privacyError && <Text style={styles.linkError}>{strings.settings.privacyError}</Text>}
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { padding: 20, gap: 16, alignItems: 'center' },
  cardWidth: { maxWidth: 440, width: '100%' },
  card: { maxWidth: 440, width: '100%', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowLast: { borderBottomWidth: 0 },
  languageSection: { gap: 10, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: palette.line },
  languageOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  languageOption: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 2, borderRadius: 12, borderColor: palette.line },
  languageSelected: { backgroundColor: palette.mintLight, borderColor: palette.ink },
  linkError: { color: palette.danger, paddingHorizontal: 18, paddingBottom: 14 },
  label: { fontSize: 17 },
  value: { fontSize: 15, color: palette.inkSoft },
  resetButton: { alignSelf: 'stretch', maxWidth: 440, width: '100%', marginHorizontal: 'auto', alignItems: 'center', paddingVertical: 13, borderRadius: 18, borderWidth: 3, borderBottomWidth: 6, borderColor: palette.line, backgroundColor: palette.white },
  resetButtonConfirming: { borderColor: palette.danger, backgroundColor: palette.coralLight },
  resetText: { fontSize: 16, color: palette.inkSoft },
  resetTextConfirming: { color: palette.danger },
});
