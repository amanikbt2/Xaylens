export type CameraFacing = 'front' | 'back';
export type FlashMode = 'off' | 'on' | 'auto';
export type CaptureMode = 'photo' | 'video';

export interface CapturedMedia {
  id: string;
  type: 'photo' | 'video';
  uri: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  timestamp: number;
  lensId?: string;
  lensName?: string;
}

export interface CameraState {
  facing: CameraFacing;
  flash: FlashMode;
  mode: CaptureMode;
  isReady: boolean;
  isRecording: boolean;
  recordingDuration: number;
  zoom: number;
  hasPermission: boolean | null;
  permissionCanAskAgain: boolean;
  error: string | null;
}

export interface CameraRefHandle {
  takePictureAsync: () => Promise<CapturedMedia | null>;
  startRecordingAsync: () => Promise<void>;
  stopRecordingAsync: () => Promise<CapturedMedia | null>;
}
