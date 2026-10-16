import { CurrencyCode } from '../types';
import { CURRENCY_SYMBOLS, CURRENCY_MINOR_FACTOR } from '../constants/theme';

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode = 'GBP',
  showSymbol = true
): string {
  const factor = CURRENCY_MINOR_FACTOR[currency] || 100;
  const major = amountMinor / factor;
  const formatted = major.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (!showSymbol) return formatted;
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol}${formatted}`;
}

export function toMinor(amountMajor: number, currency: CurrencyCode = 'GBP'): number {
  const factor = CURRENCY_MINOR_FACTOR[currency] || 100;
  return Math.round(amountMajor * factor);
}

export function toMajor(amountMinor: number, currency: CurrencyCode = 'GBP'): number {
  const factor = CURRENCY_MINOR_FACTOR[currency] || 100;
  return amountMinor / factor;
}

export function formatCompact(amountMinor: number, currency: CurrencyCode = 'GBP'): string {
  const major = toMajor(amountMinor, currency);
  if (major >= 1_000_000) {
    return `${CURRENCY_SYMBOLS[currency]}${(major / 1_000_000).toFixed(1)}M`;
  }
  if (major >= 1_000) {
    return `${CURRENCY_SYMBOLS[currency]}${(major / 1_000).toFixed(1)}K`;
  }
  return formatMoney(amountMinor, currency);
}
