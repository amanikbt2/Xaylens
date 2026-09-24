import { CameraFacing, FlashMode, CaptureMode, CapturedMedia } from '../types/camera';
import { Lens } from '../types/lens';

export interface CameraViewProps {
  facing: CameraFacing;
  flash: FlashMode;
  mode: CaptureMode;
  activeLens: Lens;
  isRecording: boolean;
  onCameraReady?: () => void;
  onMountError?: (error: string) => void;
  style?: any;
}

export interface CameraViewRef {
  takePictureAsync: () => Promise<CapturedMedia | null>;
  startRecordingAsync: () => Promise<void>;
  stopRecordingAsync: () => Promise<CapturedMedia | null>;
}
