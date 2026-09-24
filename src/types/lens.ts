import { CameraFacing } from './camera';

export type LensEffectType = 'distortion' | 'overlay' | 'hybrid' | 'color_filter' | 'none';

export type LensCategory = 'funny' | 'animal' | 'creature' | 'style' | 'classic';

export interface FaceLandmarkPoint {
  x: number; // 0 to 1 normalized coordinate
  y: number; // 0 to 1 normalized coordinate
}

export interface FaceLandmarks {
  nose: FaceLandmarkPoint;
  leftEye: FaceLandmarkPoint;
  rightEye: FaceLandmarkPoint;
  mouth: FaceLandmarkPoint;
  chin: FaceLandmarkPoint;
  forehead: FaceLandmarkPoint;
  leftEar: FaceLandmarkPoint;
  rightEar: FaceLandmarkPoint;
  faceWidth: number;
  faceHeight: number;
  yaw: number;
  pitch: number;
  roll: number;
}

export interface DistortionConfig {
  type: 'bulge' | 'pinch' | 'stretch_h' | 'stretch_v' | 'complex_alien';
  targetRegion: 'nose' | 'eyes' | 'face' | 'jaw' | 'forehead' | 'all';
  intensity: number; // 0 to 1
  radius: number; // normalized radius of effect
  center?: FaceLandmarkPoint;
}

export interface OverlayConfig {
  element: 'puppy_ears' | 'bunny_ears' | 'funny_glasses' | 'alien_antennae' | 'mustache' | 'snout' | 'blush';
  anchor: keyof FaceLandmarks;
  offsetY?: number;
  offsetX?: number;
  scale?: number;
  color?: string;
}

export interface LensConfig {
  distortion?: DistortionConfig;
  overlays?: OverlayConfig[];
  colorFilter?: {
    tint?: string;
    glow?: string;
    contrast?: number;
    brightness?: number;
    saturation?: number;
  };
  animation?: {
    pulseSpeed?: number;
    wiggle?: boolean;
    sparkle?: boolean;
  };
}

export interface Lens {
  id: string;
  name: string;
  category: LensCategory;
  description: string;
  supportedCamera: CameraFacing | 'both';
  effectType: LensEffectType;
  iconName: string; // Vector icon or thumbnail name
  accentColor: string;
  config: LensConfig;
  requiresFrontCameraNotice?: boolean;
}
