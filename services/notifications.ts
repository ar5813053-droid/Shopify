function makeId() {
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { StorageService, DEFAULT_SOUND_SETTINGS } from './storage';
import { formatMoney } from '../utils/currency';
import { CurrencyCode, ScheduledNotificationMeta, SimulatorConfig } from '../types';


// Notification handler is set during root layout boot (non-blocking).

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('Notifications require a physical device');
    return false;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function getPermissionStatus(): Promise<string> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Create or update a notification channel.
 * Android does not allow changing sound of an existing channel,
 * so we version the channelId when custom sound changes.
 */
export async function ensureNotificationChannel(
  channelId: string,
  soundUri: string | null
): Promise<string> {
  if (Platform.OS !== 'android') return channelId;

  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'PulsePay Orders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00C853',
    sound: soundUri ? soundUri : 'default',
    enableVibrate: true,
    showBadge: true,
  });

  return channelId;
}

export async function scheduleOrderNotification(params: {
  amount: number;
  currency: CurrencyCode;
  orderId: string;
  delaySeconds: number;
  channelId: string;
  soundUri: string | null;
}): Promise<string | null> {
  const { amount, currency, orderId, delaySeconds, channelId, soundUri } = params;

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    console.warn('Notification permission denied');
    return null;
  }

  await ensureNotificationChannel(channelId, soundUri);

  const formatted = formatMoney(amount, currency);
  const title = 'New Order';
  const body = `You have a new order for 1 item totaling ${formatted} from Online Store.`;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          orderId,
          amount,
          currency,
          type: 'pulsepay_order',
        },
        sound: soundUri ? soundUri : true, // true = default
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(1, delaySeconds),
        channelId: Platform.OS === 'android' ? channelId : undefined,
      },
    });
    return id;
  } catch (e) {
    console.error('Failed to schedule notification', e);
    return null;
  }
}

export async function cancelAllScheduled(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await StorageService.saveScheduledNotifications([]);
}

export async function cancelNotification(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

/**
 * Start a simulation: generate amounts, schedule notifications,
 * persist metadata, and update state.
 */
export async function startSimulation(
  config: SimulatorConfig,
  onProgress?: (completed: number, total: number) => void
): Promise<{ success: boolean; error?: string }> {
  const soundSettings = await StorageService.getSoundSettings();
  const { amounts, error } = await import('../utils/salesGenerator').then((m) =>
    m.generateAmounts(config)
  );

  if (error || !amounts.length) {
    return { success: false, error: error || 'No amounts generated' };
  }

  // Cancel any previous
  await cancelAllScheduled();

  const channelId = soundSettings.channelId;
  const soundUri = soundSettings.useCustomSound ? soundSettings.customSoundUri : null;

  const metas: ScheduledNotificationMeta[] = [];
  let delay = config.firstDelaySeconds;

  for (let i = 0; i < amounts.length; i++) {
    const amount = amounts[i];
    const orderId = makeId();

    const notifId = await scheduleOrderNotification({
      amount,
      currency: config.currency,
      orderId,
      delaySeconds: delay,
      channelId,
      soundUri,
    });

    metas.push({
      id: makeId(),
      notificationId: notifId,
      amount,
      scheduledAt: Date.now() + delay * 1000,
      status: notifId ? 'pending' : 'cancelled',
      orderId,
    });

    delay += config.intervalSeconds;
  }

  await StorageService.saveScheduledNotifications(metas);

  const state = {
    isRunning: true,
    isPaused: false,
    scheduledCount: metas.length,
    completedCount: 0,
    remainingCount: metas.filter((m) => m.status === 'pending').length,
    generatedAmounts: amounts,
    startTime: new Date().toISOString(),
    lastError: null,
  };
  await StorageService.saveSimulationState(state);

  return { success: true };
}

export async function stopSimulation(): Promise<void> {
  await cancelAllScheduled();
  const state = await StorageService.getSimulationState();
  await StorageService.saveSimulationState({
    ...state,
    isRunning: false,
    isPaused: false,
    remainingCount: 0,
  });
}

/**
 * When a notification is received / tapped, create the corresponding order
 * and update dashboard metrics.
 */
export async function handleReceivedOrderNotification(data: {
  orderId: string;
  amount: number;
  currency: CurrencyCode;
}): Promise<void> {
  const { orderId, amount, currency } = data;

  const order = {
    id: orderId,
    amount,
    currency,
    itemCount: 1,
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
    source: 'simulation' as const,
  };

  await StorageService.addOrder(order);

  // Update metrics
  const metrics = await StorageService.getMetrics();
  metrics.totalSales += amount;
  metrics.orders += 1;
  metrics.averageOrderValue = Math.round(metrics.totalSales / metrics.orders);
  await StorageService.saveMetrics(metrics);

  // Update simulation state
  const state = await StorageService.getSimulationState();
  state.completedCount += 1;
  state.remainingCount = Math.max(0, state.remainingCount - 1);
  if (state.remainingCount === 0) {
    state.isRunning = false;
  }
  await StorageService.saveSimulationState(state);

  // Mark meta as sent
  const metas = await StorageService.getScheduledNotifications();
  const updated = metas.map((m) =>
    m.orderId === orderId ? { ...m, status: 'sent' as const } : m
  );
  await StorageService.saveScheduledNotifications(updated);
}
