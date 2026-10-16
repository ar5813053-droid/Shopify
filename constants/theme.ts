import { ThemeColors } from '../types';

export const LightColors: ThemeColors = {
  background: '#F5F5F7',
  card: '#FFFFFF',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  primary: '#00C853',
  success: '#34C759',
  danger: '#FF3B30',
  border: '#E5E5EA',
  chartLine: '#00C853',
  chartFill: 'rgba(0, 200, 83, 0.15)',
};

export const DarkColors: ThemeColors = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  primary: '#00E676',
  success: '#30D158',
  danger: '#FF453A',
  border: '#38383A',
  chartLine: '#00E676',
  chartFill: 'rgba(0, 230, 118, 0.2)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const FONT_SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  title: 34,
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  GBP: '£',
  EUR: '€',
  USD: '$',
  INR: '₹',
};

export const CURRENCY_MINOR_FACTOR: Record<string, number> = {
  GBP: 100,
  EUR: 100,
  USD: 100,
  INR: 100,
};
