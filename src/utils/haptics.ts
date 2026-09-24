import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export const triggerLensSelectHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Haptics may fail silently on unsupported hardware
  }
};

export const triggerShutterPressHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Fallback silently
  }
};

export const triggerRecordingHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Fallback silently
  }
};
