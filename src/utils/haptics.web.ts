const canVibrate = (): boolean => {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
  if ('userActivation' in navigator && !(navigator as any).userActivation?.hasBeenActive) {
    return false;
  }
  return true;
};

export const triggerLensSelectHaptic = async (enabled: boolean = true) => {
  if (!enabled || !canVibrate()) return;
  try {
    navigator.vibrate(10);
  } catch {
    // Fallback silently
  }
};

export const triggerShutterPressHaptic = async (enabled: boolean = true) => {
  if (!enabled || !canVibrate()) return;
  try {
    navigator.vibrate(25);
  } catch {
    // Fallback silently
  }
};

export const triggerRecordingHaptic = async (enabled: boolean = true) => {
  if (!enabled || !canVibrate()) return;
  try {
    navigator.vibrate([30, 50, 30]);
  } catch {
    // Fallback silently
  }
};
