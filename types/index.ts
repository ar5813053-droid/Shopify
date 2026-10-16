export type CurrencyCode = 'GBP' | 'EUR' | 'USD' | 'INR';

export interface DashboardMetrics {
  totalSales: number; // in minor units (paise/cents)
  orders: number;
  conversionRate: number; // percentage
  averageOrderValue: number; // minor units
  availableBalance: number; // minor units
}

export interface SalesDataPoint {
  date: string; // ISO date
  amount: number; // minor units
  orders: number;
}

export interface Order {
  id: string;
  amount: number; // minor units
  currency: CurrencyCode;
  itemCount: number;
  status: 'pending' | 'fulfilled' | 'cancelled' | 'high_risk';
  createdAt: string; // ISO
  customerName?: string;
  source: 'simulation' | 'demo';
}

export interface SimulatorConfig {
  totalNotifications: number;
  minAmount: number; // minor units
  maxAmount: number; // minor units
  targetTotal?: number | null; // minor units, optional
  firstDelaySeconds: number;
  intervalSeconds: number;
  currency: CurrencyCode;
}

export interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  scheduledCount: number;
  completedCount: number;
  remainingCount: number;
  generatedAmounts: number[];
  startTime: string | null;
  lastError: string | null;
}

export interface NotificationSoundSettings {
  useCustomSound: boolean;
  customSoundUri: string | null;
  customSoundFilename: string | null;
  channelId: string; // versioned channel
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  currency: CurrencyCode;
  dashboardEditable: boolean;
  notificationPermissionAsked: boolean;
}

export interface ScheduledNotificationMeta {
  id: string;
  notificationId: string | null;
  amount: number;
  scheduledAt: number; // timestamp
  status: 'pending' | 'sent' | 'cancelled';
  orderId: string;
}

export type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  success: string;
  danger: string;
  border: string;
  chartLine: string;
  chartFill: string;
};
