import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    const hide = () => {
      SplashScreen.hideAsync().catch(() => undefined);
    };
    hide();
    const timers = [200, 800, 2000].map((ms) => setTimeout(hide, ms));

    // Notifications off the critical path
    import('expo-notifications')
      .then((N) => {
        try {
          N.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        } catch {
          /* ignore */
        }
      })
      .catch(() => undefined);

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.card },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '600' },
              contentStyle: { backgroundColor: colors.background },
              animation: 'fade',
            }}
          >
            <Stack.Screen name="index" options={{ title: 'Shopify', headerShown: true }} />
            <Stack.Screen name="settings" options={{ title: 'Settings' }} />
            <Stack.Screen name="simulator" options={{ title: 'Sales Simulator' }} />
            <Stack.Screen name="notification-settings" options={{ title: 'Notification Sound' }} />
            <Stack.Screen name="order/[id]" options={{ title: 'Order Detail' }} />
          </Stack>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
