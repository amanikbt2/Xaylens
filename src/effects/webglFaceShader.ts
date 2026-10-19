import { FaceLandmarks, Lens } from '../types/lens';

export const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  // Flip Y so (0,0) is top-left matching landmark coordinates
  v_uv.y = 1.0 - v_uv.y;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;
uniform sampler2D u_tex;
uniform vec2 u_resolution;
uniform vec2 u_videoResolution;
uniform float u_mirror;
uniform int u_lensMode;
uniform vec2 u_nose;
uniform vec2 u_leftEye;
uniform vec2 u_rightEye;
uniform vec2 u_mouth;
uniform vec2 u_forehead;
uniform vec2 u_chin;
uniform float u_faceScale;
uniform float u_roll;
uniform float u_time;
uniform vec4 u_customDistortion;
uniform vec2 u_customCenter;

vec2 rotate2D(vec2 v, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

// Radial bulge (strength > 0) or pinch (strength < 0) with C2 smooth falloff
vec2 warpBulgePinch(vec2 uv, vec2 center, float radius, float strength, float aspect) {
  vec2 delta = uv - center;
  vec2 corr = vec2(delta.x * aspect, delta.y);
  float dist = length(corr);
  if (dist >= radius || dist < 0.0001) return uv;
  float t = dist / radius;
  float w = 1.0 - t * t;
  w = w * w;
  if (strength > 0.0) {
    return center + delta / (1.0 + strength * w);
  } else {
    return center + delta * (1.0 + (-strength) * w * 1.4);
  }
}

// Head-tilt-aware Elliptical magnification / squeeze
vec2 warpEllipse(vec2 uv, vec2 center, vec2 radii, float strength, float aspect, float rollRad) {
  vec2 delta = uv - center;
  vec2 corr = rotate2D(vec2(delta.x * aspect, delta.y), -rollRad);
  vec2 normDelta = vec2(corr.x / max(radii.x, 0.001), corr.y / max(radii.y, 0.001));
  float dist = length(normDelta);
  if (dist >= 1.0 || dist < 0.0001) return uv;
  float w = 1.0 - dist * dist;
  w = w * w;
  if (strength > 0.0) {
    return center + delta / (1.0 + strength * w);
  } else {
    return center + delta * (1.0 + (-strength) * w * 1.35);
  }
}

// Head-tilt-aware Horizontal stretch around face midline
vec2 warpHorizontalStretch(vec2 uv, vec2 center, vec2 radii, float strength, float aspect, float rollRad) {
  vec2 delta = uv - center;
  vec2 corr = rotate2D(vec2(delta.x * aspect, delta.y), -rollRad);
  vec2 normDelta = vec2(corr.x / max(radii.x, 0.001), corr.y / max(radii.y, 0.001));
  float dist = length(normDelta);
  if (dist >= 1.0) return uv;
  float w = 1.0 - dist * dist;
  w = w * w;
  float scaleX = 1.0 / (1.0 + strength * w);
  vec2 stretchedCorr = vec2(corr.x * scaleX, corr.y);
  vec2 unrotated = rotate2D(stretchedCorr, rollRad);
  return center + vec2(unrotated.x / aspect, unrotated.y);
}

vec2 warpVerticalStretch(vec2 uv, vec2 center, vec2 radii, float strength, float aspect) {
  vec2 delta = uv - center;
  vec2 corr = vec2(delta.x * aspect, delta.y);
  vec2 normDelta = vec2(corr.x / max(radii.x, 0.001), corr.y / max(radii.y, 0.001));
  float dist = length(normDelta);
  if (dist >= 1.0) return uv;
  float w = 1.0 - dist * dist;
  w = w * w;
  float scaleY = 1.0 / (1.0 + strength * w);
  return center + vec2(delta.x, delta.y * scaleY);
}

// Swirl vortex twist
vec2 warpSwirl(vec2 uv, vec2 center, float radius, float angleRad, float aspect) {
  vec2 delta = uv - center;
  vec2 corr = vec2(delta.x * aspect, delta.y);
  float dist = length(corr);
  if (dist >= radius) return uv;
  float t = dist / radius;
  float w = (1.0 - t * t);
  float theta = w * w * angleRad;
  float s = sin(theta);
  float c = cos(theta);
  vec2 rotated = vec2(
    corr.x * c - corr.y * s,
    corr.x * s + corr.y * c
  );
  return center + vec2(rotated.x / aspect, rotated.y);
}

bool hasMode(int mask, int bitVal) {
  if (mask <= 0) return false;
  float m = float(mask);
  float b = float(bitVal);
  return mod(floor(m / b), 2.0) >= 0.5;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = v_uv;
  float s = clamp(u_faceScale, 0.55, 1.85);

  // 1: BIG NOSE (TikTok Giant Bulbous Nose Magnifier locked onto real nose)
  if (hasMode(u_lensMode, 1)) {
    float pulse = 1.0 + sin(u_time * 3.0) * 0.04;
    // Wide nostril flare aligned with head roll
    uv = warpEllipse(uv, u_nose + vec2(0.0, 0.018 * s), vec2(0.24 * s, 0.14 * s), 0.95 * pulse, aspect, u_roll);
    // Massive central nose tip magnification (2.55x)
    uv = warpBulgePinch(uv, u_nose, 0.20 * s, 1.55 * pulse, aspect);
    // Slight inward pinch between eyes to exaggerate nose bridge
    vec2 bridge = (u_leftEye + u_rightEye) * 0.5;
    uv = warpBulgePinch(uv, bridge, 0.09 * s, -0.28, aspect);
  }
  // 2: BIG EYES (TikTok Huge Bug-Eye / Anime Magnifier locked onto left & right eyes)
  if (hasMode(u_lensMode, 2)) {
    float pulse = 1.0 + sin(u_time * 2.5) * 0.03;
    // Left & Right Eye 2.45x Magnification
    uv = warpBulgePinch(uv, u_leftEye, 0.165 * s, 1.45 * pulse, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.165 * s, 1.45 * pulse, aspect);
    // Slight nose & chin shrink to make eyes look even more gigantic
    uv = warpBulgePinch(uv, u_nose, 0.12 * s, -0.25, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.16 * s, -0.28, aspect);
  }
  // 3: BIG MOUTH (TikTok Giant Smile / Mouth Magnifier locked onto mouth)
  if (hasMode(u_lensMode, 4)) {
    float pulse = 1.0 + sin(u_time * 3.2) * 0.05;
    uv = warpEllipse(uv, u_mouth, vec2(0.28 * s, 0.18 * s), 1.58 * pulse, aspect, u_roll);
    uv = warpBulgePinch(uv, u_mouth, 0.19 * s, 0.78 * pulse, aspect);
  }
  // 4: TINY FACE (TikTok Miniature Face Features on Normal Head)
  if (hasMode(u_lensMode, 8)) {
    vec2 faceCenter = mix(u_nose, u_mouth, 0.35);
    uv = warpBulgePinch(uv, faceCenter, 0.34 * s, -0.68, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.18 * s, -0.35, aspect);
  }
  // 5: WIDE FACE (TikTok Wide Jaw / Gigachad Horizontal Stretch)
  if (hasMode(u_lensMode, 16)) {
    vec2 midFace = mix(u_nose, u_mouth, 0.4);
    uv = warpHorizontalStretch(uv, midFace, vec2(0.38 * s, 0.32 * s), 1.18, aspect, u_roll);
    uv = warpEllipse(uv, u_chin, vec2(0.28 * s, 0.16 * s), 0.68, aspect, u_roll);
  }
  // 6: ALIEN (Cranium Dome Bulge + V-Chin Pinch + Huge Slanted Eyes + Bio Tint)
  if (hasMode(u_lensMode, 32)) {
    uv = warpEllipse(uv, u_forehead, vec2(0.34 * s, 0.24 * s), 0.92, aspect, u_roll);
    uv = warpBulgePinch(uv, u_leftEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.13 * s, -0.45, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.22 * s, -0.58, aspect);
    uv = warpBulgePinch(uv, u_mouth, 0.14 * s, -0.38, aspect);
  }
  // 7: SWIRL FACE (TikTok Vortex Twister following nose center)
  if (hasMode(u_lensMode, 64)) {
    float dynamicAngle = 2.35 * cos(u_time * 1.2);
    uv = warpSwirl(uv, u_nose, 0.32 * s, dynamicAngle, aspect);
  }
  // 8+: PUPPY / BUNNY / GLASSES (Subtle Cute Eye Enlargement)
  if (hasMode(u_lensMode, 128)) {
    uv = warpBulgePinch(uv, u_leftEye, 0.13 * s, 0.42, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.13 * s, 0.42, aspect);
  }

  // Config-driven path for catalog lenses without a bespoke shader mode.
  // Params are [type, intensity, radius, targetRegion], where type is
  // bulge=0, pinch=1, stretch_h=2, stretch_v=3, complex_alien=4.
  if (hasMode(u_lensMode, 256)) {
    float distortionType = u_customDistortion.x;
    float intensity = clamp(u_customDistortion.y, 0.0, 1.0);
    float radius = clamp(u_customDistortion.z * s, 0.08, 0.85);
    float targetRegion = u_customDistortion.w;
    if (targetRegion == 1.0) {
      float eyeRadius = max(0.08, radius * 0.42);
      float eyeStrength = distortionType == 1.0 ? -intensity : intensity;
      uv = warpBulgePinch(uv, u_leftEye, eyeRadius, eyeStrength, aspect);
      uv = warpBulgePinch(uv, u_rightEye, eyeRadius, eyeStrength, aspect);
    } else if (distortionType == 0.0 || distortionType == 1.0) {
      float strength = distortionType == 1.0 ? -intensity : intensity;
      uv = warpBulgePinch(uv, u_customCenter, radius, strength, aspect);
    } else if (distortionType == 2.0) {
      uv = warpHorizontalStretch(uv, u_customCenter, vec2(radius, radius * 0.8), -intensity * 0.55, aspect, u_roll);
    } else if (distortionType == 3.0) {
      uv = warpVerticalStretch(uv, u_customCenter, vec2(radius * 0.8, radius), -intensity * 0.55, aspect);
    } else {
      uv = warpEllipse(uv, u_forehead, vec2(radius * 0.8, radius * 0.55), intensity, aspect, u_roll);
      uv = warpBulgePinch(uv, u_chin, radius * 0.55, -intensity * 0.7, aspect);
      uv = warpBulgePinch(uv, u_leftEye, radius * 0.35, intensity * 0.7, aspect);
      uv = warpBulgePinch(uv, u_rightEye, radius * 0.35, intensity * 0.7, aspect);
    }
  }

  // Match CSS object-fit: cover. The shader canvas itself is a framebuffer,
  // so CSS object-fit does not crop the video texture for us.
  float sourceAspect = u_videoResolution.x / max(u_videoResolution.y, 1.0);
  float viewAspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 sampleUv = uv;
  if (sourceAspect > viewAspect) {
    sampleUv.x = 0.5 + (sampleUv.x - 0.5) * (viewAspect / sourceAspect);
  } else {
    sampleUv.y = 0.5 + (sampleUv.y - 0.5) * (sourceAspect / viewAspect);
  }
  sampleUv = clamp(sampleUv, 0.002, 0.998);
  if (u_mirror > 0.5) {
    sampleUv.x = 1.0 - sampleUv.x;
  }

  vec4 color = texture2D(u_tex, sampleUv);

  if (hasMode(u_lensMode, 32)) {
    vec2 dFace = (v_uv - u_nose) * vec2(aspect, 1.0);
    float faceMask = smoothstep(0.36 * s, 0.08 * s, length(dFace));
    vec3 alienTint = vec3(color.r * 0.68, min(1.0, color.g * 1.25 + 0.06), color.b * 0.88);
    color.rgb = mix(color.rgb, alienTint, faceMask * 0.65);
  }

  gl_FragColor = color;
}
`;

export const getLensShaderMode = (lensInput: any): number => {
  if (!lensInput) return 0;
  if (typeof lensInput === 'string') {
    return getSingleLensModeBit(lensInput);
  }
  const list = Array.isArray(lensInput) ? lensInput : [lensInput];
  let mask = 0;
  for (const l of list) {
    if (!l || !l.id || l.id === 'normal') continue;
    mask |= getSingleLensModeBit(l.id);
    if (!getSingleLensModeBit(l.id) && l.config?.distortion) mask |= 256;
  }
  return mask || 0;
};

export const getCustomLensDistortion = (
  lensInput: Lens | Lens[] | null | undefined,
  landmarks: FaceLandmarks
): { params: [number, number, number, number]; center: { x: number; y: number } } => {
  const list = Array.isArray(lensInput) ? lensInput : lensInput ? [lensInput] : [];
  const lens = list.find(
    (item) => item?.config?.distortion && getSingleLensModeBit(item.id) === 0
  );
  const distortion = lens?.config?.distortion;
  if (!distortion) return { params: [0, 0, 0, 0], center: landmarks.nose };

  const type = {
    bulge: 0,
    pinch: 1,
    stretch_h: 2,
    stretch_v: 3,
    complex_alien: 4,
  }[distortion.type];
  const region = {
    eyes: 1,
    nose: 2,
    mouth: 3,
    forehead: 4,
    jaw: 5,
    face: 6,
    all: 6,
  }[distortion.targetRegion];

  let center = distortion.center || landmarks.nose;
  if (distortion.targetRegion === 'eyes') {
    center = {
      x: (landmarks.leftEye.x + landmarks.rightEye.x) / 2,
      y: (landmarks.leftEye.y + landmarks.rightEye.y) / 2,
    };
  } else if (distortion.targetRegion === 'mouth') center = landmarks.mouth;
  else if (distortion.targetRegion === 'forehead') center = landmarks.forehead;
  else if (distortion.targetRegion === 'jaw') center = landmarks.chin;
  else if (distortion.targetRegion === 'face' || distortion.targetRegion === 'all') {
    center = {
      x: (landmarks.forehead.x + landmarks.chin.x) / 2,
      y: (landmarks.forehead.y + landmarks.chin.y) / 2,
    };
  }

  return {
    params: [type, distortion.intensity, distortion.radius, region],
    center,
  };
};

const getSingleLensModeBit = (lensId: string): number => {
  switch (lensId) {
    case 'big-nose':
      return 1;
    case 'big-eyes':
      return 2;
    case 'big-mouth':
      return 4;
    case 'tiny-face':
      return 8;
    case 'wide-face':
      return 16;
    case 'alien':
      return 32;
    case 'swirl-face':
      return 64;
    case 'puppy':
    case 'bunny':
      return 128;
    default:
      return 0;
  }
};

/**
 * Real-Time Browser Face Landmark Tracker:
 * 1. MediaPipe FaceLandmarker (478 3D Face Mesh points loaded dynamically from CDN when online)
 * 2. Native Browser FaceDetector API (with estimated eye/nose/mouth landmarks)
 * No face detection is claimed when neither detector is available.
 */
export class WebVideoFaceDetector {
  private nativeDetector: any = null;
  private mediaPipeLandmarker: any = null;
  private isDetecting = false;
  private detectorStatus: 'loading' | 'ready' | 'unavailable' = 'loading';
  private detectorError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorCtor = (window as any).FaceDetector;
        this.nativeDetector = new FaceDetectorCtor({
          fastMode: true,
          maxDetectedFaces: 1,
        });
        this.detectorStatus = 'ready';
      } catch {
        this.nativeDetector = null;
      }
    }

    // Asynchronously load MediaPipe 478-point FaceLandmarker in background for pinpoint 3D tracking
    this.initMediaPipeInBackground();
  }

  private async initMediaPipeInBackground() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    const cdnRoots = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14',
      'https://unpkg.com/@mediapipe/tasks-vision@0.10.14',
    ];
    let lastError: unknown;

    for (const cdnRoot of cdnRoots) {
      try {
        // Keep this as a browser runtime import so Metro does not try to bundle
        // the CDN package into native builds.
        const vision = await (Function(
          'url',
          'return import(url)'
        )(`${cdnRoot}/vision_bundle.mjs`) as Promise<any>);

        if (!vision?.FilesetResolver || !vision?.FaceLandmarker) {
          throw new Error('Face model package did not initialize.');
        }
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          `${cdnRoot}/wasm`
        );
        const modelAssetPath =
          'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
        const createOptions = (delegate: 'GPU' | 'CPU') => ({
          baseOptions: {
            modelAssetPath,
            delegate,
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          // Lower thresholds help recover faces in dim, soft-focus webcams.
          // Keep them above zero to avoid locking onto background patterns.
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });

        try {
          this.mediaPipeLandmarker = await vision.FaceLandmarker.createFromOptions(
            filesetResolver,
            createOptions('GPU')
          );
        } catch {
          // Android browsers may expose WebGL but still reject the GPU delegate.
          // CPU keeps the full 478-point model instead of using rough motion tracking.
          this.mediaPipeLandmarker = await vision.FaceLandmarker.createFromOptions(
            filesetResolver,
            createOptions('CPU')
          );
        }
        this.detectorStatus = 'ready';
        this.detectorError = null;
        return;
      } catch (error) {
        lastError = error;
      }
    }

    this.detectorStatus = this.nativeDetector ? 'ready' : 'unavailable';
    this.detectorError = lastError instanceof Error ? lastError.message : 'Could not load the face model.';
    console.warn('Xaylens web face model unavailable:', this.detectorError);
  }

  public getStatus() {
    return this.detectorStatus;
  }

  public getError() {
    return this.detectorError;
  }

  public async detectFromVideo(
    video: HTMLVideoElement,
    mirror: boolean
  ): Promise<Partial<FaceLandmarks> | null> {
    if (this.isDetecting || video.readyState < 2 || !video.videoWidth) {
      return null;
    }
    this.isDetecting = true;

    try {
      // TIER 1: MediaPipe 478-Point 3D Face Mesh (Pinpoint Nose Tip, Left/Right Iris, Mouth, Head Roll)
      if (this.mediaPipeLandmarker) {
        try {
          const result = this.mediaPipeLandmarker.detectForVideo(
            video,
            performance.now()
          );
          if (result?.faceLandmarks && result.faceLandmarks.length > 0) {
            const pts = result.faceLandmarks[0];
            const mapPt = (idx: number) => ({
              x: mirror ? 1.0 - pts[idx].x : pts[idx].x,
              y: pts[idx].y,
            });

            const nose = mapPt(1); // Exact 3D nose tip
            // When mirrored, anatomical left/right swap horizontally on screen
            const rawEyeA = mapPt(33);
            const rawEyeB = mapPt(263);
            const leftEye = rawEyeA.x < rawEyeB.x ? rawEyeA : rawEyeB;
            const rightEye = rawEyeA.x < rawEyeB.x ? rawEyeB : rawEyeA;

            const upperLip = mapPt(13);
            const lowerLip = mapPt(14);
            const mouth = {
              x: (upperLip.x + lowerLip.x) * 0.5,
              y: (upperLip.y + lowerLip.y) * 0.5,
            };
            const forehead = mapPt(10);
            const chin = mapPt(152);
            const cheekL = mapPt(234);
            const cheekR = mapPt(454);

            const fw = Math.min(
              0.7,
              Math.max(0.2, Math.hypot(cheekR.x - cheekL.x, cheekR.y - cheekL.y))
            );
            const fh = Math.min(
              0.75,
              Math.max(0.22, Math.hypot(chin.x - forehead.x, chin.y - forehead.y))
            );
            const rollDeg =
              Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) *
              (180 / Math.PI);
            this.isDetecting = false;
            return {
              nose,
              leftEye,
              rightEye,
              mouth,
              forehead,
              chin,
              faceWidth: fw,
              faceHeight: fh,
              roll: rollDeg,
            };
          }
        } catch {
          // Try the native detector if MediaPipe encounters a frame error.
        }
      }

      // TIER 2: Native Browser FaceDetector API (with landmark parsing)
      if (this.nativeDetector) {
        try {
          const faces = await this.nativeDetector.detect(video);
          if (faces && faces.length > 0) {
            const face = faces[0];
            const box = face.boundingBox;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const rawCx = (box.x + box.width * 0.5) / vw;
            const cx = mirror ? 1.0 - rawCx : rawCx;
            const cy = (box.y + box.height * 0.5) / vh;
            const fw = Math.min(0.65, Math.max(0.22, box.width / vw));
            const fh = Math.min(0.68, Math.max(0.25, box.height / vh));

            let leftEye = { x: cx - fw * 0.24, y: cy - fh * 0.14 };
            let rightEye = { x: cx + fw * 0.24, y: cy - fh * 0.14 };
            let nose = { x: cx, y: cy + fh * 0.04 };
            let mouth = { x: cx, y: cy + fh * 0.26 };

            if (Array.isArray(face.landmarks)) {
              const eyes: { x: number; y: number }[] = [];
              for (const lm of face.landmarks) {
                const pt = lm.locations?.[0];
                if (!pt) continue;
                const lx = mirror ? 1.0 - pt.x / vw : pt.x / vw;
                const ly = pt.y / vh;
                if (lm.type === 'eye') eyes.push({ x: lx, y: ly });
                else if (lm.type === 'nose') nose = { x: lx, y: ly };
                else if (lm.type === 'mouth') mouth = { x: lx, y: ly };
              }
              if (eyes.length >= 2) {
                eyes.sort((a, b) => a.x - b.x);
                leftEye = eyes[0];
                rightEye = eyes[1];
              }
            }

            const rollDeg =
              Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) *
              (180 / Math.PI);

            this.isDetecting = false;
            return {
              nose,
              leftEye,
              rightEye,
              mouth,
              forehead: { x: cx, y: cy - fh * 0.36 },
              chin: { x: cx, y: cy + fh * 0.44 },
              faceWidth: fw,
              faceHeight: fh,
              roll: rollDeg,
            };
          }
        } catch {
          this.nativeDetector = null;
        }
      }

      // No face-safe offline detector is available without MediaPipe or FaceDetector.
      return null;
    } catch {
      // Ignore transient frame read errors and retry on the next frame.
    } finally {
      // Always release the in-flight lock, even when this frame has no face.
      this.isDetecting = false;
    }

    return null;
  }
}
