import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore, useNotificationsStore } from '@/store';
import { colors } from '@/theme';
import { PaywallHost } from '@/components/paywall/PaywallHost';

SplashScreen.preventAutoHideAsync().catch(() => null);
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => null);

function RouteGuard() {
  const segments = useSegments();
  const router = useRouter();
  const { session, profile, initialized } = useAuthStore();
  const hydrateNotifications = useNotificationsStore((s) => s.hydrate);

  useEffect(() => {
    if (!initialized) return;
    const inAuth = segments[0] === '(auth)';
    if (!session && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuth) {
      router.replace('/(tabs)');
    }
  }, [session, initialized, segments, router]);

  // Keep the local notifications store in sync with the loaded profile.
  useEffect(() => {
    if (profile) hydrateNotifications();
  }, [profile, hydrateNotifications]);

  return null;
}

export default function RootLayout() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    bootstrap().finally(() => SplashScreen.hideAsync().catch(() => null));
  }, [bootstrap]);

  if (!initialized) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <RouteGuard />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="entry/[id]"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="compose"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="paywall"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="notifications-settings"
            options={{ presentation: 'card', animation: 'slide_from_right' }}
          />
        </Stack>
        <PaywallHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
