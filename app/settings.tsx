import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { getPermissionStatus } from '../services/notifications';
import { AppSettings, CurrencyCode } from '../types';
import { FONT_SIZES, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, theme, setTheme, settings, reload } = useTheme();
  const [permStatus, setPermStatus] = useState('unknown');
  const [localSettings, setLocalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const s = await StorageService.getSettings();
      setLocalSettings(s);
      const p = await getPermissionStatus();
      setPermStatus(p);
    })();
  }, []);

  const update = async (partial: Partial<AppSettings>) => {
    const next = { ...localSettings, ...partial };
    setLocalSettings(next);
    await StorageService.saveSettings(next);
    reload();
  };

  const clearData = () => {
    Alert.alert(
      'Clear simulated data',
      'This will remove all simulated orders, sales history and reset metrics. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearSimulatedData();
            Alert.alert('Done', 'Simulated data cleared.');
          },
        },
      ]
    );
  };

  const currencies: CurrencyCode[] = ['GBP', 'EUR', 'USD', 'INR'];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <Section title="Appearance" colors={colors}>
        {(['system', 'light', 'dark'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => setTheme(t)}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
            {theme === t && <Ionicons name="checkmark" size={20} color={colors.primary} />}
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Currency" colors={colors}>
        {currencies.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.row, { borderBottomColor: colors.border }]}
            onPress={() => update({ currency: c })}
          >
            <Text style={[styles.rowLabel, { color: colors.text }]}>{c}</Text>
            {localSettings.currency === c && (
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>
        ))}
      </Section>

      <Section title="Notifications" colors={colors}>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/notification-settings')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Notification sound</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Permission status</Text>
          <Text style={{ color: colors.textSecondary, textTransform: 'capitalize' }}>
            {permStatus}
          </Text>
        </View>
      </Section>

      <Section title="Simulator" colors={colors}>
        <TouchableOpacity
          style={[styles.row, { borderBottomColor: colors.border }]}
          onPress={() => router.push('/simulator')}
        >
          <Text style={[styles.rowLabel, { color: colors.text }]}>Sales Simulator</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </Section>

      <Section title="Data" colors={colors}>
        <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={clearData}>
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Clear simulated data</Text>
        </TouchableOpacity>
      </Section>

      <Section title="About" colors={colors}>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Version</Text>
          <Text style={{ color: colors.textSecondary }}>
            {Constants.expoConfig?.version || '1.0.0'}
          </Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.text }]}>Build</Text>
          <Text style={{ color: colors.textSecondary }}>local · Expo</Text>
        </View>
        <Text style={[styles.disclaimer, { color: colors.textSecondary }]}>
          Shopify Demo is a local simulation tool. It is not affiliated with Shopify or any real
          payment processor. All sales data and notifications are generated on-device for demo
          purposes only.
        </Text>
      </Section>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: any;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: { borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: { fontSize: FONT_SIZES.md },
  disclaimer: {
    fontSize: FONT_SIZES.xs,
    lineHeight: 18,
    padding: SPACING.lg,
  },
});
