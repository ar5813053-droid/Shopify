import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';

// Keep splash until we explicitly hide it (prevents blank flash).
// Always hide later even if init fails — this was the stuck-splash bug.
SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  const { isDark, colors } = useTheme();
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);

  const finishBoot = useCallback(async () => {
    setReady(true);
    try {
      await SplashScreen.hideAsync();
    } catch {
      /* already hidden */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const safety = setTimeout(() => {
      if (!cancelled) finishBoot();
    }, 2500);

    (async () => {
      try {
        // Nonessential services — never block the UI
        try {
          const Notifications = await import('expo-notifications');
          Notifications.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: true,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
          const received = Notifications.addNotificationReceivedListener((notification) => {
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
          const response = Notifications.addNotificationResponseReceivedListener((resp) => {
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
          // store cleanup on unmount via cancelled flag only; subscriptions are app-lifetime
          void received;
          void response;
        } catch (e) {
          console.warn('Notification init skipped', e);
        }

        if (!cancelled) await finishBoot();
      } catch (e) {
        if (!cancelled) {
          setBootError(e instanceof Error ? e.message : 'Startup failed');
          await finishBoot();
        }
      } finally {
        clearTimeout(safety);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safety);
    };
  }, [finishBoot]);

  if (!ready) {
    // Native splash still visible; tiny JS placeholder under it
    return (
      <View style={[styles.boot, { backgroundColor: '#000' }]}>
        <ActivityIndicator color="#5FB437" />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={[styles.boot, { backgroundColor: '#0A0A0A' }]}>
        <Text style={styles.errTitle}>Could not finish startup</Text>
        <Text style={styles.errBody}>{bootError}</Text>
        <Pressable
          style={styles.retry}
          onPress={() => {
            setBootError(null);
            setReady(false);
            finishBoot();
          }}
        >
          <Text style={styles.retryText}>Continue anyway</Text>
        </Pressable>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  errBody: { color: '#aaa', textAlign: 'center', marginBottom: 20 },
  retry: {
    backgroundColor: '#5FB437',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
