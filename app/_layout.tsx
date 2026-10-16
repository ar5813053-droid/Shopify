import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    const hide = () => {
      SplashScreen.hideAsync().catch(() => undefined);
    };
    hide();
    const a = setTimeout(hide, 200);
    const b = setTimeout(hide, 800);
    const c = setTimeout(hide, 2000);

    // Notifications never block startup
    import('expo-notifications')
      .then((Notifications) => {
        try {
          Notifications.setNotificationHandler({
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

    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
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
  );
}
