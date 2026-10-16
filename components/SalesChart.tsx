import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SalesDataPoint, ThemeColors, CurrencyCode } from '../types';
import { formatMoney } from '../utils/currency';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface Props {
  data: SalesDataPoint[];
  colors: ThemeColors;
  currency: CurrencyCode;
}

/**
 * Pure React Native chart (Views only).
 * Avoids react-native-svg / gifted-charts native libs that were missing
 * from the release APK and caused UnsatisfiedLinkError on device launch.
 */
export function SalesChart({ data, colors, currency }: Props) {
  const { bars, maxVal, total } = useMemo(() => {
    if (!data || data.length === 0) {
      return { bars: [] as { h: number; label: string; amount: number }[], maxVal: 1, total: 0 };
    }
    const amounts = data.map((d) => Math.max(0, (d.amount || 0) / 100));
    const max = Math.max(...amounts, 1);
    const step = Math.max(1, Math.floor(data.length / 6));
    const bars = data.map((d, i) => ({
      h: Math.max(4, ((d.amount || 0) / 100 / max) * 120),
      label: i % step === 0 && d.date ? String(d.date).slice(5) : '',
      amount: d.amount || 0,
    }));
    return {
      bars,
      maxVal: max,
      total: amounts.reduce((a, b) => a + b, 0),
    };
  }, [data]);

  const width = Dimensions.get('window').width - 48;

  if (bars.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sales (Last 30 days)</Text>
        <Text style={{ color: colors.textSecondary, paddingVertical: 24, textAlign: 'center' }}>
          No chart data yet — run the Sales Simulator to generate demo orders.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Sales (Last 30 days)</Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Total {formatMoney(Math.round(total * 100), currency)}
      </Text>
      <View style={[styles.chartRow, { width }]}>
        {bars.map((b, i) => (
          <View key={i} style={styles.barCol}>
            <View
              style={[
                styles.bar,
                {
                  height: b.h,
                  backgroundColor: colors.chartLine,
                  opacity: 0.35 + (b.h / 120) * 0.65,
                },
              ]}
            />
            {b.label ? (
              <Text style={[styles.barLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                {b.label}
              </Text>
            ) : (
              <View style={{ height: 14 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.md,
    fontWeight: '700',
    marginBottom: 4,
  },
  sub: {
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.md,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 150,
    gap: 2,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '80%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 8,
    marginTop: 4,
  },
});
