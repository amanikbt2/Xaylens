import { FaceLandmarks } from '../types/lens';
import { DEFAULT_LANDMARKS, FaceTrackingState } from './effectTypes';

export class FaceTracker {
  private currentLandmarks: FaceLandmarks = { ...DEFAULT_LANDMARKS };
  private detectedLandmarks: FaceLandmarks = { ...DEFAULT_LANDMARKS };
  private lastDetectionTimestamp = 0;
  private smoothingFactor = 0.45; // Fast, responsive lock onto real face movement
  private timeOffset = 0;

  /**
   * Step the tracker forward and return smoothly interpolated real-time landmarks
   */
  public step(deltaTimeMs: number): FaceTrackingState {
    this.timeOffset += deltaTimeMs * 0.001;
    const now = Date.now();
    const hasRecentDetection = now - this.lastDetectionTimestamp < 1800;

    // If no face was recently detected by camera CV, slowly return toward center with tiny natural breathing
    const base = hasRecentDetection ? this.detectedLandmarks : DEFAULT_LANDMARKS;
    const microSwayX = hasRecentDetection
      ? Math.sin(this.timeOffset * 1.4) * 0.002
      : Math.sin(this.timeOffset * 0.8) * 0.015;
    const microSwayY = hasRecentDetection
      ? Math.cos(this.timeOffset * 1.1) * 0.002
      : Math.cos(this.timeOffset * 0.6) * 0.01;

    const target: FaceLandmarks = {
      ...base,
      nose: { x: base.nose.x + microSwayX, y: base.nose.y + microSwayY },
      leftEye: { x: base.leftEye.x + microSwayX, y: base.leftEye.y + microSwayY },
      rightEye: { x: base.rightEye.x + microSwayX, y: base.rightEye.y + microSwayY },
      mouth: { x: base.mouth.x + microSwayX, y: base.mouth.y + microSwayY },
      forehead: { x: base.forehead.x + microSwayX, y: base.forehead.y + microSwayY },
      chin: { x: base.chin.x + microSwayX, y: base.chin.y + microSwayY },
      faceWidth: base.faceWidth,
      faceHeight: base.faceHeight,
      roll: base.roll,
    };

    const alpha = hasRecentDetection ? this.smoothingFactor : 0.12;

    this.currentLandmarks = {
      ...target,
      nose: {
        x: this.lerp(this.currentLandmarks.nose.x, target.nose.x, alpha),
        y: this.lerp(this.currentLandmarks.nose.y, target.nose.y, alpha),
      },
      leftEye: {
        x: this.lerp(this.currentLandmarks.leftEye.x, target.leftEye.x, alpha),
        y: this.lerp(this.currentLandmarks.leftEye.y, target.leftEye.y, alpha),
      },
      rightEye: {
        x: this.lerp(this.currentLandmarks.rightEye.x, target.rightEye.x, alpha),
        y: this.lerp(this.currentLandmarks.rightEye.y, target.rightEye.y, alpha),
      },
      forehead: {
        x: this.lerp(this.currentLandmarks.forehead.x, target.forehead.x, alpha),
        y: this.lerp(this.currentLandmarks.forehead.y, target.forehead.y, alpha),
      },
      mouth: {
        x: this.lerp(this.currentLandmarks.mouth.x, target.mouth.x, alpha),
        y: this.lerp(this.currentLandmarks.mouth.y, target.mouth.y, alpha),
      },
      chin: {
        x: this.lerp(this.currentLandmarks.chin.x, target.chin.x, alpha),
        y: this.lerp(this.currentLandmarks.chin.y, target.chin.y, alpha),
      },
      faceWidth: this.lerp(this.currentLandmarks.faceWidth, target.faceWidth, alpha),
      faceHeight: this.lerp(this.currentLandmarks.faceHeight, target.faceHeight, alpha),
      roll: this.lerp(this.currentLandmarks.roll, target.roll, alpha),
    };

    return {
      hasFace: true,
      landmarks: this.currentLandmarks,
      confidence: hasRecentDetection ? 0.98 : 0.75,
      isMouthOpen: false,
      isBlinking: false,
      rotation: {
        yaw: (this.currentLandmarks.nose.x - 0.5) * 45,
        pitch: (this.currentLandmarks.nose.y - 0.5) * 35,
        roll: this.currentLandmarks.roll,
      },
    };
  }

  /**
   * Update target landmarks from real-time camera face/body detection
   */
  public updateFromDetector(detected: Partial<FaceLandmarks>) {
    this.lastDetectionTimestamp = Date.now();
    this.detectedLandmarks = {
      ...this.detectedLandmarks,
      ...detected,
    };
  }

  public getCurrentLandmarks(): FaceLandmarks {
    return this.currentLandmarks;
  }

  private lerp(start: number, end: number, amt: number) {
    return (1 - amt) * start + amt * end;
  }
}
