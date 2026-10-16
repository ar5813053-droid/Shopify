import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { SalesDataPoint, ThemeColors, CurrencyCode } from '../types';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface Props {
  data: SalesDataPoint[];
  colors: ThemeColors;
  currency: CurrencyCode;
}

/** Safe chart: empty data or chart lib errors must not crash the app. */
export function SalesChart({ data, colors }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({
      value: Math.max(0, (d.amount || 0) / 100),
      label: i % 5 === 0 && d.date ? String(d.date).slice(5) : '',
    }));
  }, [data]);

  const width = Dimensions.get('window').width - 48;

  if (chartData.length < 2) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sales (Last 30 days)</Text>
        <Text style={{ color: colors.textSecondary, paddingVertical: 24, textAlign: 'center' }}>
          No chart data yet — run the Sales Simulator to generate demo orders.
        </Text>
      </View>
    );
  }

  try {
    // Lazy require so a native/chart failure doesn't break the whole screen module graph
    const { LineChart } = require('react-native-gifted-charts');
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sales (Last 30 days)</Text>
        <LineChart
          data={chartData}
          width={width}
          height={180}
          color={colors.chartLine}
          thickness={2.5}
          startFillColor={colors.chartFill}
          endFillColor="transparent"
          startOpacity={0.4}
          endOpacity={0.05}
          areaChart
          hideDataPoints
          curved
          yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
          xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
          yAxisColor={colors.border}
          xAxisColor={colors.border}
          rulesColor={colors.border}
          rulesType="solid"
          noOfSections={4}
          spacing={width / Math.max(chartData.length - 1, 1)}
          initialSpacing={8}
          endSpacing={8}
        />
      </View>
    );
  } catch (e) {
    console.warn('Chart render failed', e);
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Sales (Last 30 days)</Text>
        <Text style={{ color: colors.textSecondary }}>Chart unavailable</Text>
      </View>
    );
  }
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
    marginBottom: SPACING.md,
  },
});
