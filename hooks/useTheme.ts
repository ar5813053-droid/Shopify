import { useColorScheme } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { LightColors, DarkColors } from '../constants/theme';
import { AppSettings, ThemeColors } from '../types';

export function useTheme() {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [colors, setColors] = useState<ThemeColors>(LightColors);
  const [isDark, setIsDark] = useState(false);

  const load = useCallback(async () => {
    const s = await StorageService.getSettings();
    setSettings(s);
    const dark =
      s.theme === 'dark' || (s.theme === 'system' && systemScheme === 'dark');
    setIsDark(dark);
    setColors(dark ? DarkColors : LightColors);
  }, [systemScheme]);

  useEffect(() => {
    load();
  }, [load]);

  const setTheme = async (theme: AppSettings['theme']) => {
    const next = { ...settings, theme };
    await StorageService.saveSettings(next);
    setSettings(next);
    const dark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
    setIsDark(dark);
    setColors(dark ? DarkColors : LightColors);
  };

  return { colors, isDark, theme: settings.theme, setTheme, settings, reload: load };
}
