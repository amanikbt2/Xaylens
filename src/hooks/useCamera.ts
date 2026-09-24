import { useState, useCallback } from 'react';
import { CameraFacing, FlashMode, CaptureMode } from '../types/camera';
import { APP_CONFIG } from '../constants/config';
import { triggerShutterPressHaptic } from '../utils/haptics';

export const useCamera = () => {
  const [facing, setFacing] = useState<CameraFacing>(APP_CONFIG.defaultCameraFacing);
  const [flash, setFlash] = useState<FlashMode>(APP_CONFIG.defaultFlashMode);
  const [mode, setMode] = useState<CaptureMode>(APP_CONFIG.defaultCaptureMode);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Toggle front / back camera
  const toggleFacing = useCallback(() => {
    triggerShutterPressHaptic();
    setFacing((prev) => (prev === 'front' ? 'back' : 'front'));
  }, []);

  // Cycle flash: off -> on -> auto -> off
  const cycleFlash = useCallback(() => {
    triggerShutterPressHaptic();
    setFlash((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  }, []);

  // Switch capture mode (photo vs video)
  const switchMode = useCallback((newMode: CaptureMode) => {
    triggerShutterPressHaptic();
    setMode(newMode);
  }, []);

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback((error: string) => {
    setCameraError(error);
  }, []);

  return {
    facing,
    setFacing,
    toggleFacing,
    flash,
    setFlash,
    cycleFlash,
    mode,
    setMode,
    switchMode,
    isCameraReady,
    cameraError,
    handleCameraReady,
    handleCameraError,
  };
};
