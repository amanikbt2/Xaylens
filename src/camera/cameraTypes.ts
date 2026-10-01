import { CameraFacing, FlashMode, CaptureMode, CapturedMedia } from '../types/camera';
import { Lens } from '../types/lens';

export interface CameraViewProps {
  facing: CameraFacing;
  flash: FlashMode;
  mode: CaptureMode;
  activeLens: Lens;
  comboLenses?: Lens[];
  isRecording: boolean;
  active?: boolean;
  onCameraReady?: () => void;
  onMountError?: (error: string) => void;
  onFaceStatusChange?: (status: {
    quality: 'perfect' | 'poor' | 'searching';
    lightingStatus: 'good' | 'low_light' | 'backlit' | 'searching';
    hasFace: boolean;
    faceWidth?: number;
  }) => void;
  style?: any;
}

export interface CameraViewRef {
  takePictureAsync: () => Promise<CapturedMedia | null>;
  startRecordingAsync: () => Promise<void>;
  stopRecordingAsync: () => Promise<CapturedMedia | null>;
  pauseRecordingAsync?: () => Promise<void>;
  resumeRecordingAsync?: () => Promise<void>;
}
