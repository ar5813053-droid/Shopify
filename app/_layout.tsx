import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';

// Do NOT call preventAutoHideAsync — allow native splash to dismiss as soon as
// the first React frame paints. Also force-hide after mount as a safety net.
export default function RootLayout() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    let alive = true;
    const hide = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch {
        /* ignore */
      }
    };
    // Immediate + retries (some Android devices need a second tick)
    hide();
    const t1 = setTimeout(hide, 300);
    const t2 = setTimeout(hide, 1000);
    const t3 = setTimeout(hide, 2500);

    // Notifications: background, never block UI
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        if (!alive) return;
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        Notifications.addNotificationReceivedListener((notification) => {
          const data = notification.request.content.data as Record<string, unknown>;
          if (data?.type === 'pulsepay_order' && data.orderId) {
            import('../services/notifications')
              .then((m) =>
                m.handleReceivedOrderNotification({
                  orderId: String(data.orderId),
                  amount: Number(data.amount) || 0,
                  currency: (data.currency as 'GBP') || 'GBP',
                })
              )
              .catch(() => undefined);
          }
        });
        Notifications.addNotificationResponseReceivedListener((resp) => {
          const data = resp.notification.request.content.data as Record<string, unknown>;
          if (data?.type === 'pulsepay_order' && data.orderId) {
            import('../services/notifications')
              .then((m) =>
                m.handleReceivedOrderNotification({
                  orderId: String(data.orderId),
                  amount: Number(data.amount) || 0,
                  currency: (data.currency as 'GBP') || 'GBP',
                })
              )
              .catch(() => undefined);
          }
        });
      } catch (e) {
        console.warn('Notification init skipped', e);
      }
    })();

    return () => {
      alive = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
