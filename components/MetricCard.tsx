import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors } from '../types';
import { FONT_SIZES, SPACING } from '../constants/theme';

interface Props {
  label: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  colors: ThemeColors;
}

export function MetricCard({ label, value, change, changePositive, colors }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {change != null && (
        <Text
          style={[
            styles.change,
            { color: changePositive ? colors.success : colors.danger },
          ]}
        >
          {changePositive ? '↑ ' : '↓ '}
          {change}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 16,
    padding: SPACING.lg,
    minWidth: 100,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    marginBottom: 4,
  },
  value: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
  },
  change: {
    fontSize: FONT_SIZES.sm,
    marginTop: 4,
    fontWeight: '600',
  },
});
