export const triggerLensSelectHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  } catch {
    // Fallback silently
  }
};

export const triggerShutterPressHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  } catch {
    // Fallback silently
  }
};

export const triggerRecordingHaptic = async (enabled: boolean = true) => {
  if (!enabled) return;
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([30, 50, 30]);
    }
  } catch {
    // Fallback silently
  }
};
