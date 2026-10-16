import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SalesDataPoint, ThemeColors, CurrencyCode } from '../types';
import { formatMoney } from '../utils/currency';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface Props {
  data: SalesDataPoint[];
  colors: ThemeColors;
  currency: CurrencyCode;
}

export function SalesChart({ data, colors, currency }: Props) {
  const chartData = useMemo(() => {
    return data.map((d, i) => ({
      value: d.amount / 100,
      label: i % 5 === 0 ? d.date.slice(5) : '',
      dataPointText: '',
    }));
  }, [data]);

  const width = Dimensions.get('window').width - 48;

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
        spacing={width / Math.max(data.length - 1, 1)}
        initialSpacing={8}
        endSpacing={8}
        pointerConfig={{
          pointerStripHeight: 160,
          pointerStripColor: colors.border,
          pointerStripWidth: 1,
          pointerColor: colors.primary,
          radius: 5,
          pointerLabelWidth: 100,
          pointerLabelHeight: 60,
          activatePointersOnLongPress: false,
          autoAdjustPointerLabelPosition: true,
          pointerLabelComponent: (items: any) => {
            const item = items[0];
            return (
              <View style={[styles.tooltip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={{ color: colors.text, fontWeight: '600', fontSize: 12 }}>
                  {formatMoney(Math.round(item.value * 100), currency)}
                </Text>
              </View>
            );
          },
        }}
      />
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
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  tooltip: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
});
