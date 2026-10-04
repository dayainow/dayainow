import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { initFeedback } from '../src/feedback/feedback';
import { strings } from '../src/i18n';
import { palette } from '../src/theme';

export default function RootLayout() {
  useEffect(() => {
    initFeedback();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.mintMist },
          headerTintColor: palette.ink,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: palette.mintMist },
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
    </>
  );
}
