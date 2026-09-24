import { FaceLandmarks } from '../types/lens';

export interface FaceTrackingState {
  hasFace: boolean;
  landmarks: FaceLandmarks;
  confidence: number; // 0 to 1
  isMouthOpen: boolean;
  isBlinking: boolean;
  rotation: {
    yaw: number;
    pitch: number;
    roll: number;
  };
}

export const DEFAULT_LANDMARKS: FaceLandmarks = {
  nose: { x: 0.5, y: 0.52 },
  leftEye: { x: 0.38, y: 0.42 },
  rightEye: { x: 0.62, y: 0.42 },
  mouth: { x: 0.5, y: 0.64 },
  chin: { x: 0.5, y: 0.78 },
  forehead: { x: 0.5, y: 0.28 },
  leftEar: { x: 0.22, y: 0.45 },
  rightEar: { x: 0.78, y: 0.45 },
  faceWidth: 0.48,
  faceHeight: 0.55,
  yaw: 0,
  pitch: 0,
  roll: 0,
};

export const DEFAULT_TRACKING_STATE: FaceTrackingState = {
  hasFace: true,
  landmarks: DEFAULT_LANDMARKS,
  confidence: 0.95,
  isMouthOpen: false,
  isBlinking: false,
  rotation: { yaw: 0, pitch: 0, roll: 0 },
};
