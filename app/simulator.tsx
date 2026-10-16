import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { StorageService, DEFAULT_SIMULATOR_CONFIG, DEFAULT_SIMULATION_STATE } from '../services/storage';
import { startSimulation, stopSimulation, requestNotificationPermissions } from '../services/notifications';
import { generateAmounts } from '../utils/salesGenerator';
import { formatMoney } from '../utils/currency';
import { SimulatorConfig, SimulationState } from '../types';
import { FONT_SIZES, SPACING } from '../constants/theme';

export default function SimulatorScreen() {
  const { colors } = useTheme();
  const [config, setConfig] = useState<SimulatorConfig>(DEFAULT_SIMULATOR_CONFIG);
  const [state, setState] = useState<SimulationState>(DEFAULT_SIMULATION_STATE);
  const [preview, setPreview] = useState<number[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const [c, s] = await Promise.all([
      StorageService.getSimulatorConfig(),
      StorageService.getSimulationState(),
    ]);
    setConfig(c);
    setState(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateConfig = async (partial: Partial<SimulatorConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    await StorageService.saveSimulatorConfig(next);
  };

  const runPreview = () => {
    const { amounts, error } = generateAmounts(config);
    setPreview(amounts);
    setPreviewError(error);
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission required',
          'Notification permission is needed to schedule simulated order alerts. Please enable it in system settings.'
        );
        setLoading(false);
        return;
      }

      const result = await startSimulation(config);
      if (!result.success) {
        Alert.alert('Cannot start', result.error || 'Unknown error');
      } else {
        await load();
        Alert.alert('Simulation started', `Scheduled ${config.totalNotifications} notifications.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    try {
      await stopSimulation();
      await load();
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Generate local simulated sales events and schedule Android notifications. All data stays
        on-device.
      </Text>

      <Label colors={colors}>Number of notifications</Label>
      <TextInput
        style={inputStyle}
        keyboardType="number-pad"
        value={String(config.totalNotifications)}
        onChangeText={(t) => updateConfig({ totalNotifications: Math.max(1, parseInt(t, 10) || 1) })}
      />

      <Label colors={colors}>Min amount (major units, e.g. 50.00)</Label>
      <TextInput
        style={inputStyle}
        keyboardType="decimal-pad"
        value={(config.minAmount / 100).toFixed(2)}
        onChangeText={(t) => {
          const v = parseFloat(t);
          if (!isNaN(v)) updateConfig({ minAmount: Math.round(v * 100) });
        }}
      />

      <Label colors={colors}>Max amount (major units)</Label>
      <TextInput
        style={inputStyle}
        keyboardType="decimal-pad"
        value={(config.maxAmount / 100).toFixed(2)}
        onChangeText={(t) => {
          const v = parseFloat(t);
          if (!isNaN(v)) updateConfig({ maxAmount: Math.round(v * 100) });
        }}
      />

      <Label colors={colors}>Target total (optional, leave empty for random)</Label>
      <TextInput
        style={inputStyle}
        keyboardType="decimal-pad"
        placeholder="e.g. 500.00"
        placeholderTextColor={colors.textSecondary}
        value={config.targetTotal != null ? (config.targetTotal / 100).toFixed(2) : ''}
        onChangeText={(t) => {
          if (t.trim() === '') {
            updateConfig({ targetTotal: null });
          } else {
            const v = parseFloat(t);
            if (!isNaN(v)) updateConfig({ targetTotal: Math.round(v * 100) });
          }
        }}
      />

      <Label colors={colors}>First delay (seconds)</Label>
      <TextInput
        style={inputStyle}
        keyboardType="number-pad"
        value={String(config.firstDelaySeconds)}
        onChangeText={(t) =>
          updateConfig({ firstDelaySeconds: Math.max(1, parseInt(t, 10) || 5) })
        }
      />

      <Label colors={colors}>Interval between notifications (seconds)</Label>
      <TextInput
        style={inputStyle}
        keyboardType="number-pad"
        value={String(config.intervalSeconds)}
        onChangeText={(t) =>
          updateConfig({ intervalSeconds: Math.max(1, parseInt(t, 10) || 10) })
        }
      />

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={runPreview}
      >
        <Text style={{ color: colors.text, fontWeight: '600' }}>Preview sequence</Text>
      </TouchableOpacity>

      {previewError && (
        <Text style={{ color: colors.danger, marginTop: 8 }}>{previewError}</Text>
      )}

      {preview.length > 0 && !previewError && (
        <View style={[styles.previewBox, { backgroundColor: colors.card }]}>
          <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 8 }}>
            Preview ({preview.length} items, sum{' '}
            {formatMoney(preview.reduce((a, b) => a + b, 0), config.currency)})
          </Text>
          {preview.map((a, i) => (
            <Text key={i} style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm }}>
              #{i + 1}: {formatMoney(a, config.currency)}
            </Text>
          ))}
        </View>
      )}

      {/* Status */}
      <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.statusTitle, { color: colors.text }]}>Simulation status</Text>
        <Text style={{ color: colors.textSecondary }}>
          Running: {state.isRunning ? 'Yes' : 'No'}
        </Text>
        <Text style={{ color: colors.textSecondary }}>
          Scheduled: {state.scheduledCount} · Completed: {state.completedCount} · Remaining:{' '}
          {state.remainingCount}
        </Text>
        {state.startTime && (
          <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.xs }}>
            Started: {new Date(state.startTime).toLocaleString()}
          </Text>
        )}
      </View>

      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: loading ? 0.6 : 1 }]}
          onPress={handleStart}
          disabled={loading || state.isRunning}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Start simulation</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stopBtn, { borderColor: colors.danger }]}
          onPress={handleStop}
          disabled={loading || !state.isRunning}
        >
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Stop / Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.note, { color: colors.textSecondary }]}>
        Timing is approximate. Android may delay notifications under battery restrictions,
        Doze mode, or after force-stop. Exact delivery is not guaranteed.
      </Text>
    </ScrollView>
  );
}

function Label({ children, colors }: { children: string; colors: any }) {
  return (
    <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, marginBottom: 4, marginTop: 12 }}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  intro: { fontSize: FONT_SIZES.sm, lineHeight: 20, marginBottom: SPACING.md },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: FONT_SIZES.md,
  },
  btn: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  previewBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  statusCard: {
    marginTop: 20,
    padding: 16,
    borderRadius: 14,
  },
  statusTitle: { fontWeight: '700', marginBottom: 6, fontSize: FONT_SIZES.md },
  btnRow: { marginTop: 20, gap: 12 },
  primaryBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
  stopBtn: {
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  note: { fontSize: FONT_SIZES.xs, marginTop: 20, lineHeight: 18 },
});
