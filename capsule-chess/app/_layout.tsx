import { Fredoka_600SemiBold, Fredoka_700Bold } from '@expo-google-fonts/fredoka';
import { Jua_400Regular } from '@expo-google-fonts/jua';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { track } from '../src/analytics';
import { AchievementToast } from '../src/components/AchievementToast';
import { RulesButton } from '../src/components/RulesButton';
import { initFeedback } from '../src/feedback/feedback';
import { strings } from '../src/i18n';
import { RulesProvider } from '../src/rules/RulesProvider';
import { backfillAchievements, loadProgress } from '../src/storage/progress';
import { palette } from '../src/theme';
import { fonts } from '../src/ui/fonts';

// 글꼴을 다 불러올 때까지 시작 화면을 유지 (글꼴이 바뀌며 깜빡이지 않게)
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Jua_400Regular, Fredoka_600SemiBold, Fredoka_700Bold });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    initFeedback();
    backfillAchievements();
    loadProgress().then(progress => track('app_open', { first_open: !progress.onboarded }));
  }, []);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <RulesProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.bg },
          headerTintColor: palette.ink,
          headerTitleStyle: { fontFamily: fonts.body, fontSize: 20 },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.bg },
          // 어느 화면에서든 규칙을 바로 볼 수 있게
          headerRight: () => <RulesButton source="header" />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="learn/index" options={{ title: strings.screens.learn }} />
        <Stack.Screen name="learn/[lesson]" options={{ title: '' }} />
        <Stack.Screen name="daily" options={{ title: strings.screens.daily }} />
        <Stack.Screen name="campaign/index" options={{ title: strings.league.title }} />
        <Stack.Screen name="campaign/[stage]" options={{ title: '' }} />
        <Stack.Screen name="play" options={{ title: strings.screens.freePlay }} />
        <Stack.Screen name="settings" options={{ title: strings.screens.settings }} />
        <Stack.Screen name="achievements" options={{ title: strings.achievements.title }} />
        <Stack.Screen name="practice/index" options={{ title: strings.practice.title }} />
        <Stack.Screen name="practice/[id]" options={{ title: '' }} />
      </Stack>
      <AchievementToast />
    </RulesProvider>
  );
}
