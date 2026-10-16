import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Order, ThemeColors } from '../types';
import { formatMoney } from '../utils/currency';
import { FONT_SIZES, SPACING } from '../constants/theme';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  order: Order;
  colors: ThemeColors;
  onPress?: () => void;
}

export function OrderItem({ order, colors, onPress }: Props) {
  const statusColor =
    order.status === 'high_risk'
      ? colors.danger
      : order.status === 'fulfilled'
      ? colors.success
      : colors.textSecondary;

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <Text style={[styles.id, { color: colors.text }]} numberOfLines={1}>
          #{order.id.slice(0, 8)}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {order.itemCount} item · {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: colors.text }]}>
          {formatMoney(order.amount, order.currency)}
        </Text>
        <Text style={[styles.status, { color: statusColor }]}>{order.status.replace('_', ' ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
  id: { fontSize: FONT_SIZES.md, fontWeight: '600' },
  meta: { fontSize: FONT_SIZES.sm, marginTop: 2 },
  amount: { fontSize: FONT_SIZES.md, fontWeight: '700' },
  status: { fontSize: FONT_SIZES.xs, marginTop: 2, textTransform: 'capitalize' },
});
