import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { useDashboard } from '../hooks/useDashboard';
import { MetricCard } from '../components/MetricCard';
import { SalesChart } from '../components/SalesChart';
import { OrderItem } from '../components/OrderItem';
import { formatMoney, formatCompact } from '../utils/currency';
import { FONT_SIZES, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { metrics, orders, salesHistory, currency, loading, refresh, updateMetrics } =
    useDashboard();
  const [search, setSearch] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [editMode, setEditMode] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase())
  );

  const visitors = 30; // demo static matching screenshot vibe
  const conversionChange = -0.5;
  const ordersChange = 4;
  const salesChange = 2;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}
    >
      {/* Header bar inspired by screenshot */}
      <View style={styles.headerRow}>
        <View style={[styles.chip, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontSize: FONT_SIZES.sm }}>Last 30 days ▾</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: colors.card }]}>
          <View style={[styles.dot, { backgroundColor: colors.success }]} />
          <Text style={{ color: colors.text, fontSize: FONT_SIZES.sm }}>{visitors} visitors</Text>
        </View>
        <TouchableOpacity
          style={[styles.chip, { backgroundColor: colors.card }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={16} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: FONT_SIZES.sm, marginLeft: 4 }}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Main metrics */}
      <View style={styles.metricsRow}>
        <View style={{ flex: 1.4 }}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total sales</Text>
          {editMode ? (
            <TextInput
              style={[styles.editInput, { color: colors.text, borderColor: colors.border }]}
              keyboardType="numeric"
              defaultValue={(metrics.totalSales / 100).toFixed(1)}
              onEndEditing={(e) => {
                const v = parseFloat(e.nativeEvent.text);
                if (!isNaN(v)) updateMetrics({ totalSales: Math.round(v * 100) });
              }}
            />
          ) : (
            <Text style={[styles.bigValue, { color: colors.text }]}>
              {formatMoney(metrics.totalSales, currency)}
            </Text>
          )}
          <Text style={{ color: colors.success, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            ↑ {salesChange}%
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Orders</Text>
          <Text style={[styles.bigValue, { color: colors.text }]}>
            {(metrics.orders / 1000).toFixed(2)}K
          </Text>
          <Text style={{ color: colors.success, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            ↑ {ordersChange}%
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Conversion</Text>
          <Text style={[styles.bigValue, { color: colors.text }]}>
            {metrics.conversionRate.toFixed(2)}%
          </Text>
          <Text style={{ color: colors.danger, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            ↓ {Math.abs(conversionChange)}%
          </Text>
        </View>
      </View>

      {/* Chart */}
      <SalesChart data={salesHistory} colors={colors} currency={currency} />

      {/* Quick stats cards */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.card }]}>
          <Ionicons name="cube-outline" size={20} color={colors.primary} />
          <Text style={[styles.quickValue, { color: colors.text }]}>50+</Text>
          <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Orders to fulfill</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.card }]}>
          <Ionicons name="card-outline" size={20} color={colors.primary} />
          <Text style={[styles.quickValue, { color: colors.text }]}>1</Text>
          <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>Payment to capture</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickCard, { backgroundColor: colors.card }]}>
          <Ionicons name="warning-outline" size={20} color={colors.danger} />
          <Text style={[styles.quickValue, { color: colors.text }]}>9</Text>
          <Text style={[styles.quickLabel, { color: colors.textSecondary }]}>High risk orders</Text>
        </TouchableOpacity>
      </View>

      {/* Available balance */}
      <View style={[styles.balanceCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Available demo balance</Text>
        <Text style={[styles.bigValue, { color: colors.primary }]}>
          {formatMoney(metrics.availableBalance, currency)}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.xs, marginTop: 4 }}>
          Simulated funds · not real money
        </Text>
      </View>

      {/* Recent orders */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent activity</Text>
        <TouchableOpacity onPress={() => setEditMode(!editMode)}>
          <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm }}>
            {editMode ? 'Done' : 'Edit metrics'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[
          styles.search,
          { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Search orders..."
        placeholderTextColor={colors.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      {filteredOrders.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>That's it for now</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            Check back later for more insights and advice about your business
          </Text>
        </View>
      ) : (
        filteredOrders.slice(0, 15).map((o) => (
          <OrderItem
            key={o.id}
            order={o}
            colors={colors}
            onPress={() => router.push(`/order/${o.id}`)}
          />
        ))
      )}

      {/* Discreet simulator entry */}
      <TouchableOpacity
        style={styles.devEntry}
        onLongPress={() => router.push('/simulator')}
        delayLongPress={800}
      >
        <Text style={{ color: colors.textSecondary, fontSize: 11 }}>Shopify Demo · Simulator</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
    flexWrap: 'wrap',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.xl,
  },
  metricLabel: { fontSize: FONT_SIZES.sm, marginBottom: 2 },
  bigValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  editInput: {
    fontSize: 22,
    fontWeight: '700',
    borderBottomWidth: 1,
    paddingVertical: 2,
    marginBottom: 2,
  },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: SPACING.lg },
  quickCard: {
    flex: 1,
    borderRadius: 14,
    padding: SPACING.md,
    alignItems: 'center',
  },
  quickValue: { fontSize: FONT_SIZES.lg, fontWeight: '700', marginTop: 6 },
  quickLabel: { fontSize: 11, textAlign: 'center', marginTop: 2 },
  balanceCard: {
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700' },
  search: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    fontSize: FONT_SIZES.md,
  },
  empty: {
    borderRadius: 16,
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: FONT_SIZES.sm, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  devEntry: { alignItems: 'center', paddingVertical: 20 },
});
