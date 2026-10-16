import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  DashboardMetrics,
  NotificationSoundSettings,
  Order,
  SalesDataPoint,
  SimulatorConfig,
  SimulationState,
  ScheduledNotificationMeta,
} from '../types';

const KEYS = {
  SETTINGS: '@pulsepay/settings',
  METRICS: '@pulsepay/metrics',
  ORDERS: '@pulsepay/orders',
  SALES_HISTORY: '@pulsepay/sales_history',
  SIMULATOR_CONFIG: '@pulsepay/simulator_config',
  SIMULATION_STATE: '@pulsepay/simulation_state',
  SOUND_SETTINGS: '@pulsepay/sound_settings',
  SCHEDULED_NOTIFS: '@pulsepay/scheduled_notifs',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  currency: 'GBP',
  dashboardEditable: true,
  notificationPermissionAsked: false,
};

export const DEFAULT_METRICS: DashboardMetrics = {
  totalSales: 47880930, // £478,809.30 in minor units
  orders: 1530,
  conversionRate: 1.42,
  averageOrderValue: 31294, // ~£312.94
  availableBalance: 12500000, // £125,000 demo
};


export const DEFAULT_SALES_HISTORY: SalesDataPoint[] = Array.from({ length: 30 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (29 - i));
  return {
    date: d.toISOString().slice(0, 10),
    amount: Math.round(800000 + Math.sin(i / 3) * 200000 + i * 15000),
  };
});

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  totalNotifications: 5,
  minAmount: 5000, // £50.00
  maxAmount: 25000, // £250.00
  targetTotal: null,
  firstDelaySeconds: 5,
  intervalSeconds: 10,
  currency: 'GBP',
};

export const DEFAULT_SOUND_SETTINGS: NotificationSoundSettings = {
  useCustomSound: false,
  customSoundUri: null,
  customSoundFilename: null,
  channelId: 'pulsepay-orders-v1',
};

export const DEFAULT_SIMULATION_STATE: SimulationState = {
  isRunning: false,
  isPaused: false,
  scheduledCount: 0,
  completedCount: 0,
  remainingCount: 0,
  generatedAmounts: [],
  startTime: null,
  lastError: null,
};

async function getItem<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Storage set failed', key, e);
  }
}

export const StorageService = {
  async getSettings(): Promise<AppSettings> {
    return getItem(KEYS.SETTINGS, DEFAULT_SETTINGS);
  },
  async saveSettings(settings: AppSettings): Promise<void> {
    return setItem(KEYS.SETTINGS, settings);
  },

  async getMetrics(): Promise<DashboardMetrics> {
    return getItem(KEYS.METRICS, DEFAULT_METRICS);
  },
  async saveMetrics(metrics: DashboardMetrics): Promise<void> {
    return setItem(KEYS.METRICS, metrics);
  },

  async getOrders(): Promise<Order[]> {
    return getItem(KEYS.ORDERS, []);
  },
  async saveOrders(orders: Order[]): Promise<void> {
    return setItem(KEYS.ORDERS, orders);
  },
  async addOrder(order: Order): Promise<void> {
    const orders = await this.getOrders();
    orders.unshift(order);
    // keep last 200
    await this.saveOrders(orders.slice(0, 200));
  },

  async getSalesHistory(): Promise<SalesDataPoint[]> {
    return getItem(KEYS.SALES_HISTORY, DEFAULT_SALES_HISTORY));
  },
  async saveSalesHistory(data: SalesDataPoint[]): Promise<void> {
    return setItem(KEYS.SALES_HISTORY, data);
  },

  async getSimulatorConfig(): Promise<SimulatorConfig> {
    return getItem(KEYS.SIMULATOR_CONFIG, DEFAULT_SIMULATOR_CONFIG);
  },
  async saveSimulatorConfig(config: SimulatorConfig): Promise<void> {
    return setItem(KEYS.SIMULATOR_CONFIG, config);
  },

  async getSimulationState(): Promise<SimulationState> {
    return getItem(KEYS.SIMULATION_STATE, DEFAULT_SIMULATION_STATE);
  },
  async saveSimulationState(state: SimulationState): Promise<void> {
    return setItem(KEYS.SIMULATION_STATE, state);
  },

  async getSoundSettings(): Promise<NotificationSoundSettings> {
    return getItem(KEYS.SOUND_SETTINGS, DEFAULT_SOUND_SETTINGS);
  },
  async saveSoundSettings(settings: NotificationSoundSettings): Promise<void> {
    return setItem(KEYS.SOUND_SETTINGS, settings);
  },

  async getScheduledNotifications(): Promise<ScheduledNotificationMeta[]> {
    return getItem(KEYS.SCHEDULED_NOTIFS, []);
  },
  async saveScheduledNotifications(list: ScheduledNotificationMeta[]): Promise<void> {
    return setItem(KEYS.SCHEDULED_NOTIFS, list);
  },

  async clearSimulatedData(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.ORDERS,
      KEYS.SALES_HISTORY,
      KEYS.SIMULATION_STATE,
      KEYS.SCHEDULED_NOTIFS,
      KEYS.METRICS,
    ]);
  },
};

function generateDefaultSalesHistory(): SalesDataPoint[] {
  const points: SalesDataPoint[] = [];
  const start = new Date('2025-07-02');
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const base = 12000 + Math.sin(i / 3) * 4000 + Math.random() * 5000;
    points.push({
      date: d.toISOString().slice(0, 10),
      amount: Math.round(base * 100),
      orders: Math.floor(30 + Math.random() * 40),
    });
  }
  return points;
}
