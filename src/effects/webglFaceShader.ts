import { FaceLandmarks } from '../types/lens';

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

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 uv = v_uv;
  float s = clamp(u_faceScale, 0.55, 1.85);

  // 1: BIG NOSE (TikTok Giant Bulbous Nose Magnifier locked onto real nose)
  if (u_lensMode == 1) {
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
  else if (u_lensMode == 2) {
    float pulse = 1.0 + sin(u_time * 2.5) * 0.03;
    // Left & Right Eye 2.45x Magnification
    uv = warpBulgePinch(uv, u_leftEye, 0.165 * s, 1.45 * pulse, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.165 * s, 1.45 * pulse, aspect);
    // Slight nose & chin shrink to make eyes look even more gigantic
    uv = warpBulgePinch(uv, u_nose, 0.12 * s, -0.25, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.16 * s, -0.28, aspect);
  }
  // 3: BIG MOUTH (TikTok Giant Smile / Mouth Magnifier locked onto mouth)
  else if (u_lensMode == 3) {
    float pulse = 1.0 + sin(u_time * 3.2) * 0.05;
    uv = warpEllipse(uv, u_mouth, vec2(0.28 * s, 0.18 * s), 1.58 * pulse, aspect, u_roll);
    uv = warpBulgePinch(uv, u_mouth, 0.19 * s, 0.78 * pulse, aspect);
  }
  // 4: TINY FACE (TikTok Miniature Face Features on Normal Head)
  else if (u_lensMode == 4) {
    vec2 faceCenter = mix(u_nose, u_mouth, 0.35);
    uv = warpBulgePinch(uv, faceCenter, 0.34 * s, -0.68, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.18 * s, -0.35, aspect);
  }
  // 5: WIDE FACE (TikTok Wide Jaw / Gigachad Horizontal Stretch)
  else if (u_lensMode == 5) {
    vec2 midFace = mix(u_nose, u_mouth, 0.4);
    uv = warpHorizontalStretch(uv, midFace, vec2(0.38 * s, 0.32 * s), 1.18, aspect, u_roll);
    uv = warpEllipse(uv, u_chin, vec2(0.28 * s, 0.16 * s), 0.68, aspect, u_roll);
  }
  // 6: ALIEN (Cranium Dome Bulge + V-Chin Pinch + Huge Slanted Eyes + Bio Tint)
  else if (u_lensMode == 6) {
    uv = warpEllipse(uv, u_forehead, vec2(0.34 * s, 0.24 * s), 0.92, aspect, u_roll);
    uv = warpBulgePinch(uv, u_leftEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.13 * s, -0.45, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.22 * s, -0.58, aspect);
    uv = warpBulgePinch(uv, u_mouth, 0.14 * s, -0.38, aspect);
  }
  // 7: SWIRL FACE (TikTok Vortex Twister following nose center)
  else if (u_lensMode == 7) {
    float dynamicAngle = 2.35 * cos(u_time * 1.2);
    uv = warpSwirl(uv, u_nose, 0.32 * s, dynamicAngle, aspect);
  }
  // 8+: PUPPY / BUNNY / GLASSES (Subtle Cute Eye Enlargement)
  else if (u_lensMode >= 8) {
    uv = warpBulgePinch(uv, u_leftEye, 0.13 * s, 0.42, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.13 * s, 0.42, aspect);
  }

  vec2 sampleUv = clamp(uv, 0.002, 0.998);
  if (u_mirror > 0.5) {
    sampleUv.x = 1.0 - sampleUv.x;
  }

  vec4 color = texture2D(u_tex, sampleUv);

  if (u_lensMode == 6) {
    vec2 dFace = (v_uv - u_nose) * vec2(aspect, 1.0);
    float faceMask = smoothstep(0.36 * s, 0.08 * s, length(dFace));
    vec3 alienTint = vec3(color.r * 0.68, min(1.0, color.g * 1.25 + 0.06), color.b * 0.88);
    color.rgb = mix(color.rgb, alienTint, faceMask * 0.65);
  }

  gl_FragColor = color;
}
`;

export const getLensShaderMode = (lensId: string): number => {
  switch (lensId) {
    case 'normal':
      return 0;
    case 'big-nose':
      return 1;
    case 'big-eyes':
      return 2;
    case 'big-mouth':
    case 'funny-glasses':
      return 3;
    case 'tiny-face':
      return 4;
    case 'wide-face':
      return 5;
    case 'alien':
      return 6;
    case 'swirl-face':
      return 7;
    case 'puppy':
    case 'bunny':
    default:
      return 8;
  }
};

/**
 * Smart 3-Tier Real-Time Face & Body Landmark Tracker:
 * 1. MediaPipe FaceLandmarker (478 3D Face Mesh points loaded dynamically from CDN when online)
 * 2. Native Browser FaceDetector API (with eye/nose/mouth landmark parsing)
 * 3. Instant Offline 96x72 Skin + Motion Optical Flow + Dark-Valley Eye/Mouth Detector
 */
export class WebVideoFaceDetector {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private prevLuma: Float32Array | null = null;
  private nativeDetector: any = null;
  private mediaPipeLandmarker: any = null;
  private isDetecting = false;
  private lastTrackedCenter = { x: 0.5, y: 0.48, scale: 0.34, roll: 0 };

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 96;
      this.offscreenCanvas.height = 72;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
        willReadFrequently: true,
      });
      this.prevLuma = new Float32Array(96 * 72);
    }

    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        const FaceDetectorCtor = (window as any).FaceDetector;
        this.nativeDetector = new FaceDetectorCtor({
          fastMode: true,
          maxDetectedFaces: 1,
        });
      } catch {
        this.nativeDetector = null;
      }
    }

    // Asynchronously load MediaPipe 478-point FaceLandmarker in background for pinpoint 3D tracking
    this.initMediaPipeInBackground();
  }

  private async initMediaPipeInBackground() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      // Load MediaPipe Tasks Vision ESM bundle via dynamic import
      const visionModuleUrl =
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
      const vision = await (Function(
        'url',
        'return import(url)'
      )(visionModuleUrl) as Promise<any>);

      if (vision && vision.FilesetResolver && vision.FaceLandmarker) {
        const filesetResolver = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        this.mediaPipeLandmarker = await vision.FaceLandmarker.createFromOptions(
          filesetResolver,
          {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numFaces: 1,
          }
        );
      }
    } catch {
      // Offline or blocked CDN — Tier 2 & Tier 3 handle tracking seamlessly
    }
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

            this.lastTrackedCenter = {
              x: nose.x,
              y: nose.y,
              scale: fw,
              roll: rollDeg,
            };
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
          // Fall through to Tier 2/3
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

      // TIER 3: Smart 96x72 Skin + Motion Optical Flow + Dark-Valley Eye/Mouth Locator
      if (this.offscreenCanvas && this.offscreenCtx && this.prevLuma) {
        const w = this.offscreenCanvas.width;
        const h = this.offscreenCanvas.height;
        this.offscreenCtx.drawImage(video, 0, 0, w, h);
        const imgData = this.offscreenCtx.getImageData(0, 0, w, h).data;

        let sumX = 0;
        let sumY = 0;
        let totalWeight = 0;
        let minX = w;
        let maxX = 0;
        let minY = h;
        let maxY = 0;

        const prevCx = mirror
          ? (1.0 - this.lastTrackedCenter.x) * w
          : this.lastTrackedCenter.x * w;
        const prevCy = this.lastTrackedCenter.y * h;

        for (let y = 2; y < h - 2; y++) {
          for (let x = 2; x < w - 2; x++) {
            const pIdx = y * w + x;
            const idx = pIdx * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            const luma = 0.299 * r + 0.587 * g + 0.114 * b;
            const motion = Math.abs(luma - this.prevLuma[pIdx]);
            this.prevLuma[pIdx] = luma;

            // Broad multi-tone YCbCr + RGB skin detection
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
            const isSkin =
              cb >= 72 &&
              cb <= 136 &&
              cr >= 128 &&
              cr <= 182 &&
              r > 45 &&
              r > g * 0.95 &&
              r > b * 1.05 &&
              luma > 30 &&
              luma < 245;

            if (isSkin || motion > 14) {
              // Spatial continuity weight around last tracked head/body position
              const distFromPrev = Math.hypot((x - prevCx) / w, (y - prevCy) / h);
              const localityBoost = Math.max(0.25, 1.25 - distFromPrev * 1.6);
              const skinScore = isSkin ? 1.8 : 0.0;
              const motionScore = motion > 14 ? Math.min(2.2, motion / 18) : 0.0;
              const weight = (skinScore + motionScore) * localityBoost;

              sumX += x * weight;
              sumY += y * weight;
              totalWeight += weight;

              if (isSkin && weight > 0.9) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
        }

        if (totalWeight > 18) {
          const rawCx = sumX / totalWeight / w;
          const cx = Math.min(
            0.85,
            Math.max(0.15, mirror ? 1.0 - rawCx : rawCx)
          );
          const cy = Math.min(0.82, Math.max(0.18, sumY / totalWeight / h));
          const spanW = maxX > minX ? (maxX - minX) / w : 0.34;
          const detectedWidth = Math.min(0.6, Math.max(0.24, spanW * 0.78));

          // Estimate head tilt (roll) by comparing left-half vs right-half eye-band dark valleys
          const headCenterX = Math.round(rawCx * w);
          const eyeBandYMin = Math.max(2, Math.round((cy - detectedWidth * 0.28) * h));
          const eyeBandYMax = Math.min(h - 3, Math.round((cy - detectedWidth * 0.05) * h));
          const eyeSpanPx = Math.max(6, Math.round(detectedWidth * 0.32 * w));

          let leftEyeDarkY = cy - detectedWidth * 0.16;
          let rightEyeDarkY = cy - detectedWidth * 0.16;
          let minLumaL = 999;
          let minLumaR = 999;

          for (let y = eyeBandYMin; y <= eyeBandYMax; y++) {
            for (
              let x = Math.max(2, headCenterX - eyeSpanPx);
              x < headCenterX - 2;
              x++
            ) {
              const l = this.prevLuma[y * w + x];
              if (l < minLumaL) {
                minLumaL = l;
                leftEyeDarkY = y / h;
              }
            }
            for (
              let x = headCenterX + 2;
              x <= Math.min(w - 3, headCenterX + eyeSpanPx);
              x++
            ) {
              const l = this.prevLuma[y * w + x];
              if (l < minLumaR) {
                minLumaR = l;
                rightEyeDarkY = y / h;
              }
            }
          }

          const screenLeftEyeY = mirror ? rightEyeDarkY : leftEyeDarkY;
          const screenRightEyeY = mirror ? leftEyeDarkY : rightEyeDarkY;
          const eyeHalfSpan = detectedWidth * 0.25;
          const leftEye = { x: cx - eyeHalfSpan, y: screenLeftEyeY };
          const rightEye = { x: cx + eyeHalfSpan, y: screenRightEyeY };

          const rollRad = Math.atan2(
            rightEye.y - leftEye.y,
            rightEye.x - leftEye.x
          );
          const rollDeg = Math.max(-35, Math.min(35, rollRad * (180 / Math.PI)));

          const perpX = -Math.sin(rollRad);
          const perpY = Math.cos(rollRad);
          const eyeMidX = (leftEye.x + rightEye.x) * 0.5;
          const eyeMidY = (leftEye.y + rightEye.y) * 0.5;
          const eyeDist = Math.hypot(
            rightEye.x - leftEye.x,
            rightEye.y - leftEye.y
          );

          const nose = {
            x: eyeMidX + perpX * eyeDist * 0.36,
            y: eyeMidY + perpY * eyeDist * 0.36,
          };
          const mouth = {
            x: eyeMidX + perpX * eyeDist * 0.78,
            y: eyeMidY + perpY * eyeDist * 0.78,
          };
          const forehead = {
            x: eyeMidX - perpX * eyeDist * 0.48,
            y: eyeMidY - perpY * eyeDist * 0.48,
          };
          const chin = {
            x: eyeMidX + perpX * eyeDist * 1.15,
            y: eyeMidY + perpY * eyeDist * 1.15,
          };

          this.lastTrackedCenter = {
            x: nose.x,
            y: nose.y,
            scale: detectedWidth,
            roll: rollDeg,
          };

          this.isDetecting = false;
          return {
            nose,
            leftEye,
            rightEye,
            mouth,
            forehead,
            chin,
            faceWidth: detectedWidth,
            faceHeight: detectedWidth * 1.25,
            roll: rollDeg,
          };
        }
      }
    } catch {
      // Ignore transient frame read errors
    }

    this.isDetecting = false;
    return null;
  }
}
