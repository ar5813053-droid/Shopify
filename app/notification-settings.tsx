import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import {
  pickCustomSound,
  removeCustomSound,
  previewSound,
  getCurrentSoundSettings,
  getSoundLimitationNote,
} from '../services/sound';
import { NotificationSoundSettings } from '../types';
import { FONT_SIZES, SPACING } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<NotificationSoundSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const s = await getCurrentSoundSettings();
    setSettings(s);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePick = async () => {
    setLoading(true);
    try {
      const result = await pickCustomSound();
      if (result.success) {
        Alert.alert('Sound selected', result.filename || 'Custom sound saved');
        await load();
      } else if (result.error && result.error !== 'Cancelled') {
        Alert.alert('Error', result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    Alert.alert('Remove custom sound', 'Use the system default notification sound instead?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeCustomSound();
          await load();
        },
      },
    ]);
  };

  const handlePreview = async () => {
    if (!settings?.customSoundUri) return;
    setLoading(true);
    try {
      const result = await previewSound(settings.customSoundUri);
      if (!result.success) {
        Alert.alert('Playback failed', result.error || 'Could not play the file');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!settings) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.intro, { color: colors.textSecondary }]}>
        Choose a custom audio file for order notifications or keep the device default sound.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Current sound</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 4 }}>
          {settings.useCustomSound && settings.customSoundFilename
            ? settings.customSoundFilename
            : 'System default notification sound'}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.xs, marginTop: 6 }}>
          Channel: {settings.channelId}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={handlePick}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="musical-notes-outline" size={20} color="#fff" />
            <Text style={styles.btnText}>Choose notification sound</Text>
          </>
        )}
      </TouchableOpacity>

      {settings.useCustomSound && (
        <>
          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: colors.primary }]}
            onPress={handlePreview}
            disabled={loading}
          >
            <Ionicons name="play-outline" size={20} color={colors.primary} />
            <Text style={[styles.btnOutlineText, { color: colors.primary }]}>Play preview</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btnOutline, { borderColor: colors.danger }]}
            onPress={handleRemove}
            disabled={loading}
          >
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.btnOutlineText, { color: colors.danger }]}>
              Remove custom sound
            </Text>
          </TouchableOpacity>
        </>
      )}

      <View style={[styles.noteBox, { backgroundColor: colors.card }]}>
        <Text style={[styles.noteTitle, { color: colors.text }]}>Android limitations</Text>
        <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 20 }}>
          {getSoundLimitationNote()}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 20, marginTop: 8 }}>
          Supported formats: MP3, WAV, M4A (where the device allows). The file is copied into app
          storage so it remains available even if the original is deleted.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: FONT_SIZES.sm, lineHeight: 20, marginTop: 8 }}>
          Changes apply to newly scheduled notifications only. Existing pending notifications keep
          the channel they were created with.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  intro: { fontSize: FONT_SIZES.sm, lineHeight: 20, marginBottom: SPACING.lg },
  card: {
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: { fontWeight: '700', fontSize: FONT_SIZES.md },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: FONT_SIZES.md },
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  btnOutlineText: { fontWeight: '600', fontSize: FONT_SIZES.md },
  noteBox: {
    marginTop: 20,
    borderRadius: 14,
    padding: SPACING.lg,
  },
  noteTitle: { fontWeight: '700', marginBottom: 8 },
});
