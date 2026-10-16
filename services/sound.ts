import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import { StorageService } from './storage';
import { NotificationSoundSettings } from '../types';

const SOUND_DIR = `${FileSystem.documentDirectory}notification_sounds/`;

async function ensureSoundDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(SOUND_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(SOUND_DIR, { intermediates: true });
  }
}

export async function pickCustomSound(): Promise<{
  success: boolean;
  filename?: string;
  uri?: string;
  error?: string;
}> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/m4a', 'audio/*'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return { success: false, error: 'Cancelled' };
    }

    const asset = result.assets[0];
    const size = asset.size ?? 0;
    if (size > 5 * 1024 * 1024) {
      return { success: false, error: 'File too large (max 5 MB)' };
    }

    const ext = (asset.name || 'sound').split('.').pop()?.toLowerCase() || 'mp3';
    const allowed = ['mp3', 'wav', 'm4a', 'mp4', 'aac', 'ogg'];
    if (!allowed.includes(ext)) {
      return { success: false, error: `Unsupported format: .${ext}` };
    }

    await ensureSoundDir();
    const destName = `custom_${Date.now()}.${ext}`;
    const destUri = `${SOUND_DIR}${destName}`;

    await FileSystem.copyAsync({
      from: asset.uri,
      to: destUri,
    });

    // Version the channel so Android picks up the new sound
    const current = await StorageService.getSoundSettings();
    const versionMatch = current.channelId.match(/v(\d+)$/);
    const nextVersion = versionMatch ? parseInt(versionMatch[1], 10) + 1 : 2;
    const newChannelId = `pulsepay-orders-v${nextVersion}`;

    const settings: NotificationSoundSettings = {
      useCustomSound: true,
      customSoundUri: destUri,
      customSoundFilename: asset.name || destName,
      channelId: newChannelId,
    };
    await StorageService.saveSoundSettings(settings);

    return { success: true, filename: settings.customSoundFilename!, uri: destUri };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to pick sound' };
  }
}

export async function removeCustomSound(): Promise<void> {
  const settings = await StorageService.getSoundSettings();
  if (settings.customSoundUri) {
    try {
      await FileSystem.deleteAsync(settings.customSoundUri, { idempotent: true });
    } catch {
      // ignore
    }
  }
  await StorageService.saveSoundSettings({
    useCustomSound: false,
    customSoundUri: null,
    customSoundFilename: null,
    channelId: 'pulsepay-orders-v1',
  });
}

export async function previewSound(uri: string | null): Promise<{ success: boolean; error?: string }> {
  if (!uri) return { success: false, error: 'No sound selected' };

  try {
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
    // Auto unload after playback roughly
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Playback failed' };
  }
}

export async function getCurrentSoundSettings(): Promise<NotificationSoundSettings> {
  return StorageService.getSoundSettings();
}

/**
 * Note for Android: changing the sound of an existing notification channel
 * is not supported by the OS. We therefore create a new versioned channel
 * whenever the user selects a different custom sound. Old channels are left
 * intact (Android cleans them up eventually) to avoid losing user preferences.
 */
export function getSoundLimitationNote(): string {
  return Platform.OS === 'android'
    ? 'On Android, notification channel sounds cannot be changed after creation. PulsePay creates a new channel version when you pick a different sound. You may need to clear notification settings for the app if the old sound persists.'
    : 'Custom notification sounds are applied to newly scheduled notifications.';
}
