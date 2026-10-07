import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { track } from '../src/analytics';
import { RulesButton } from '../src/components/RulesButton';
import { initFeedback } from '../src/feedback/feedback';
import { RulesProvider } from '../src/rules/RulesProvider';
import { loadProgress } from '../src/storage/progress';
import { strings } from '../src/i18n';
import { palette } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    initFeedback();
    loadProgress().then(progress => track('app_open', { first_open: !progress.onboarded }));
  }, []);

  return (
    <RulesProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.mintMist },
          headerTintColor: palette.ink,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.mintMist },
          // 어느 화면에서든 규칙을 바로 볼 수 있게
          headerRight: () => <RulesButton source="header" />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="learn/index" options={{ title: strings.screens.learn }} />
        <Stack.Screen name="learn/[lesson]" options={{ title: '' }} />
        <Stack.Screen name="daily" options={{ title: strings.screens.daily }} />
        <Stack.Screen name="campaign/index" options={{ title: strings.screens.campaign }} />
        <Stack.Screen name="campaign/[stage]" options={{ title: '' }} />
        <Stack.Screen name="play" options={{ title: strings.screens.freePlay }} />
        <Stack.Screen name="settings" options={{ title: strings.screens.settings }} />
      </Stack>
    </RulesProvider>
  );
}
