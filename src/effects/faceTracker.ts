import { FaceLandmarks } from '../types/lens';
import { DEFAULT_LANDMARKS, FaceTrackingState } from './effectTypes';

export class FaceTracker {
  private currentLandmarks: FaceLandmarks = { ...DEFAULT_LANDMARKS };
  private targetLandmarks: FaceLandmarks = { ...DEFAULT_LANDMARKS };
  private smoothingFactor = 0.25; // 0 (stiff) to 1 (instant)
  private timeOffset = 0;

  /**
   * Update tracker clock for organic natural head sway when idle
   */
  public step(deltaTimeMs: number): FaceTrackingState {
    this.timeOffset += deltaTimeMs * 0.001;

    // Subtle natural head movement dynamics
    const swayX = Math.sin(this.timeOffset * 0.8) * 0.025;
    const swayY = Math.cos(this.timeOffset * 0.6) * 0.015;
    const tiltRoll = Math.sin(this.timeOffset * 0.5) * 3;

    this.targetLandmarks = {
      ...DEFAULT_LANDMARKS,
      nose: { x: DEFAULT_LANDMARKS.nose.x + swayX, y: DEFAULT_LANDMARKS.nose.y + swayY },
      leftEye: { x: DEFAULT_LANDMARKS.leftEye.x + swayX, y: DEFAULT_LANDMARKS.leftEye.y + swayY },
      rightEye: { x: DEFAULT_LANDMARKS.rightEye.x + swayX, y: DEFAULT_LANDMARKS.rightEye.y + swayY },
      mouth: { x: DEFAULT_LANDMARKS.mouth.x + swayX, y: DEFAULT_LANDMARKS.mouth.y + swayY },
      forehead: { x: DEFAULT_LANDMARKS.forehead.x + swayX, y: DEFAULT_LANDMARKS.forehead.y + swayY },
      chin: { x: DEFAULT_LANDMARKS.chin.x + swayX, y: DEFAULT_LANDMARKS.chin.y + swayY },
      roll: tiltRoll,
    };

    // Smooth lerp (exponential smoothing)
    this.currentLandmarks = {
      ...this.targetLandmarks,
      nose: {
        x: this.lerp(this.currentLandmarks.nose.x, this.targetLandmarks.nose.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.nose.y, this.targetLandmarks.nose.y, this.smoothingFactor),
      },
      leftEye: {
        x: this.lerp(this.currentLandmarks.leftEye.x, this.targetLandmarks.leftEye.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.leftEye.y, this.targetLandmarks.leftEye.y, this.smoothingFactor),
      },
      rightEye: {
        x: this.lerp(this.currentLandmarks.rightEye.x, this.targetLandmarks.rightEye.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.rightEye.y, this.targetLandmarks.rightEye.y, this.smoothingFactor),
      },
      forehead: {
        x: this.lerp(this.currentLandmarks.forehead.x, this.targetLandmarks.forehead.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.forehead.y, this.targetLandmarks.forehead.y, this.smoothingFactor),
      },
      mouth: {
        x: this.lerp(this.currentLandmarks.mouth.x, this.targetLandmarks.mouth.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.mouth.y, this.targetLandmarks.mouth.y, this.smoothingFactor),
      },
      chin: {
        x: this.lerp(this.currentLandmarks.chin.x, this.targetLandmarks.chin.x, this.smoothingFactor),
        y: this.lerp(this.currentLandmarks.chin.y, this.targetLandmarks.chin.y, this.smoothingFactor),
      },
      roll: this.lerp(this.currentLandmarks.roll, this.targetLandmarks.roll, this.smoothingFactor),
    };

    return {
      hasFace: true,
      landmarks: this.currentLandmarks,
      confidence: 0.95,
      isMouthOpen: Math.sin(this.timeOffset * 1.5) > 0.7,
      isBlinking: false,
      rotation: { yaw: swayX * 10, pitch: swayY * 10, roll: tiltRoll },
    };
  }

  /**
   * Supply external landmark detection (e.g. from camera detector or browser FaceDetector)
   */
  public updateFromDetector(detected: Partial<FaceLandmarks>) {
    this.targetLandmarks = {
      ...this.targetLandmarks,
      ...detected,
    };
  }

  private lerp(start: number, end: number, amt: number) {
    return (1 - amt) * start + amt * end;
  }
}
