import 'react-native-gesture-handler';
import 'react-native-reanimated';

// Capture fatal JS errors so they appear in logcat under ReactNativeJS
try {
  const ErrorUtils = global.ErrorUtils;
  if (ErrorUtils && ErrorUtils.getGlobalHandler && ErrorUtils.setGlobalHandler) {
    const prev = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      console.error('[ShopifySim] fatal=' + isFatal, error && error.message, error && error.stack);
      if (typeof prev === 'function') prev(error, isFatal);
    });
  }
} catch (_) {}

import 'expo-router/entry';
