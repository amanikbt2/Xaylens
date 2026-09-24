import { FlashMode, CameraFacing, CaptureMode } from './camera';

export interface AppPreferences {
  defaultFacing: CameraFacing;
  preferredFlash: FlashMode;
  defaultMode: CaptureMode;
  enableHaptics: boolean;
  saveToCameraRoll: boolean;
  highQualityVideo: boolean;
  mirrorFrontCamera: boolean;
  gridEnabled: boolean;
}

export const DEFAULT_PREFERENCES: AppPreferences = {
  defaultFacing: 'front',
  preferredFlash: 'off',
  defaultMode: 'photo',
  enableHaptics: true,
  saveToCameraRoll: true,
  highQualityVideo: true,
  mirrorFrontCamera: true,
  gridEnabled: false,
};
