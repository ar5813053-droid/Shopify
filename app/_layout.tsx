import React, { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../hooks/useTheme';
import { handleReceivedOrderNotification } from '../services/notifications';

export default function RootLayout() {
  const { isDark, colors } = useTheme();
  const responseListener = useRef<Notifications.Subscription>();
  const receivedListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Listen for notifications received while app is foregrounded
    receivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as any;
      if (data?.type === 'pulsepay_order' && data.orderId) {
        handleReceivedOrderNotification({
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
        });
      }
    });

    // Listen for user tapping a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as any;
      if (data?.type === 'pulsepay_order' && data.orderId) {
        handleReceivedOrderNotification({
          orderId: data.orderId,
          amount: data.amount,
          currency: data.currency,
        });
        // Navigation can be handled via router if needed
      }
    });

    return () => {
      if (receivedListener.current) {
        Notifications.removeNotificationSubscription(receivedListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
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
