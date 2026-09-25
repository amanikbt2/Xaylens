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
uniform float u_time;

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

// Elliptical magnification / squeeze
vec2 warpEllipse(vec2 uv, vec2 center, vec2 radii, float strength, float aspect) {
  vec2 delta = uv - center;
  vec2 normDelta = vec2((delta.x * aspect) / max(radii.x, 0.001), delta.y / max(radii.y, 0.001));
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

// Horizontal stretch / compression around face midline
vec2 warpHorizontalStretch(vec2 uv, vec2 center, vec2 radii, float strength, float aspect) {
  vec2 delta = uv - center;
  vec2 normDelta = vec2((delta.x * aspect) / max(radii.x, 0.001), delta.y / max(radii.y, 0.001));
  float dist = length(normDelta);
  if (dist >= 1.0) return uv;
  float w = 1.0 - dist * dist;
  w = w * w;
  float scaleX = 1.0 / (1.0 + strength * w);
  return vec2(center.x + delta.x * scaleX, uv.y);
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
  // Compute cover-fit crop UV for video texture
  vec2 uv = v_uv;
  float s = clamp(u_faceScale, 0.65, 1.65);

  // 1: BIG NOSE (TikTok Giant Bulbous Nose Magnifier)
  if (u_lensMode == 1) {
    float pulse = 1.0 + sin(u_time * 3.0) * 0.04;
    // Wide nostril flare
    uv = warpEllipse(uv, u_nose + vec2(0.0, 0.02 * s), vec2(0.24 * s, 0.14 * s), 0.95 * pulse, aspect);
    // Massive central nose tip magnification (2.5x)
    uv = warpBulgePinch(uv, u_nose, 0.20 * s, 1.52 * pulse, aspect);
    // Slight inward pinch between eyes to exaggerate nose bridge
    vec2 bridge = (u_leftEye + u_rightEye) * 0.5;
    uv = warpBulgePinch(uv, bridge, 0.09 * s, -0.28, aspect);
  }
  // 2: BIG EYES (TikTok Huge Bug-Eye / Anime Magnifier)
  else if (u_lensMode == 2) {
    float pulse = 1.0 + sin(u_time * 2.5) * 0.03;
    // Left & Right Eye 2.4x Magnification
    uv = warpBulgePinch(uv, u_leftEye, 0.165 * s, 1.42 * pulse, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.165 * s, 1.42 * pulse, aspect);
    // Slight nose & chin shrink to make eyes look even more gigantic
    uv = warpBulgePinch(uv, u_nose, 0.12 * s, -0.25, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.16 * s, -0.28, aspect);
  }
  // 3: BIG MOUTH (TikTok Giant Smile / Mouth Magnifier)
  else if (u_lensMode == 3) {
    float pulse = 1.0 + sin(u_time * 3.2) * 0.05;
    uv = warpEllipse(uv, u_mouth, vec2(0.28 * s, 0.18 * s), 1.55 * pulse, aspect);
    uv = warpBulgePinch(uv, u_mouth, 0.19 * s, 0.75 * pulse, aspect);
  }
  // 4: TINY FACE (TikTok Miniature Face Features on Normal Head)
  else if (u_lensMode == 4) {
    vec2 faceCenter = mix(u_nose, u_mouth, 0.35);
    // Strong inward pinch of eyes, nose, and mouth into a tiny cluster
    uv = warpBulgePinch(uv, faceCenter, 0.34 * s, -0.68, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.18 * s, -0.35, aspect);
  }
  // 5: WIDE FACE (TikTok Wide Jaw / Gigachad Horizontal Stretch)
  else if (u_lensMode == 5) {
    vec2 midFace = mix(u_nose, u_mouth, 0.4);
    uv = warpHorizontalStretch(uv, midFace, vec2(0.38 * s, 0.32 * s), 1.15, aspect);
    uv = warpEllipse(uv, u_chin, vec2(0.28 * s, 0.16 * s), 0.65, aspect);
  }
  // 6: ALIEN (Cranium Dome Bulge + V-Chin Pinch + Huge Slanted Eyes + Bio Tint)
  else if (u_lensMode == 6) {
    // Expand upper forehead cranium
    uv = warpEllipse(uv, u_forehead, vec2(0.34 * s, 0.24 * s), 0.92, aspect);
    // Huge extraterrestrial eyes
    uv = warpBulgePinch(uv, u_leftEye, 0.16 * s, 1.28, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.16 * s, 1.28, aspect);
    // Tiny pinched nose & sharp V-shaped alien chin
    uv = warpBulgePinch(uv, u_nose, 0.13 * s, -0.45, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.22 * s, -0.58, aspect);
    uv = warpBulgePinch(uv, u_mouth, 0.14 * s, -0.38, aspect);
  }
  // 7: SWIRL FACE (TikTok Vortex Twister)
  else if (u_lensMode == 7) {
    float dynamicAngle = 2.35 * cos(u_time * 1.2);
    uv = warpSwirl(uv, u_nose, 0.32 * s, dynamicAngle, aspect);
  }
  // 8+: PUPPY / BUNNY / GLASSES (Subtle Cute Eye Enlargement + Nose Button Warp)
  else if (u_lensMode >= 8) {
    uv = warpBulgePinch(uv, u_leftEye, 0.13 * s, 0.42, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.13 * s, 0.42, aspect);
  }

  // Clamp UV to avoid edge clamping artifacts
  vec2 sampleUv = clamp(uv, 0.002, 0.998);
  if (u_mirror > 0.5) {
    sampleUv.x = 1.0 - sampleUv.x;
  }

  vec4 color = texture2D(u_tex, sampleUv);

  // Subtle extraterrestrial skin color shift for Alien lens
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
 * Lightweight real-time video face centroid & landmark estimator for web browsers.
 * Uses native window.FaceDetector when available, with a fast 48x36 skin-chromatographic
 * centroid fallback so the distortion lenses track the user's actual head movement in the camera.
 */
export class WebVideoFaceDetector {
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private nativeDetector: any = null;
  private isDetecting = false;

  constructor() {
    if (typeof document !== 'undefined') {
      this.offscreenCanvas = document.createElement('canvas');
      this.offscreenCanvas.width = 48;
      this.offscreenCanvas.height = 36;
      this.offscreenCtx = this.offscreenCanvas.getContext('2d', {
        willReadFrequently: true,
      });
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
      // 1. Try native Chromium / Android WebView FaceDetector first
      if (this.nativeDetector) {
        try {
          const faces = await this.nativeDetector.detect(video);
          if (faces && faces.length > 0) {
            const box = faces[0].boundingBox;
            const vw = video.videoWidth;
            const vh = video.videoHeight;
            const rawCx = (box.x + box.width * 0.5) / vw;
            const cx = mirror ? 1.0 - rawCx : rawCx;
            const cy = (box.y + box.height * 0.5) / vh;
            const fw = Math.min(0.65, Math.max(0.22, box.width / vw));
            const fh = Math.min(0.65, Math.max(0.25, box.height / vh));

            this.isDetecting = false;
            return {
              nose: { x: cx, y: cy + fh * 0.04 },
              leftEye: { x: cx - fw * 0.24, y: cy - fh * 0.14 },
              rightEye: { x: cx + fw * 0.24, y: cy - fh * 0.14 },
              mouth: { x: cx, y: cy + fh * 0.26 },
              forehead: { x: cx, y: cy - fh * 0.36 },
              chin: { x: cx, y: cy + fh * 0.44 },
              faceWidth: fw,
              faceHeight: fh,
            };
          }
        } catch {
          this.nativeDetector = null;
        }
      }

      // 2. Fast 48x36 YCbCr skin-cluster centroid tracker fallback
      if (this.offscreenCanvas && this.offscreenCtx) {
        const w = this.offscreenCanvas.width;
        const h = this.offscreenCanvas.height;
        this.offscreenCtx.drawImage(video, 0, 0, w, h);
        const imgData = this.offscreenCtx.getImageData(0, 0, w, h).data;

        let sumX = 0;
        let sumY = 0;
        let totalWeight = 0;
        let minX = w;
        let maxX = 0;

        for (let y = 3; y < h - 3; y++) {
          for (let x = 4; x < w - 4; x++) {
            const idx = (y * w + x) * 4;
            const r = imgData[idx];
            const g = imgData[idx + 1];
            const b = imgData[idx + 2];

            // YCbCr skin chrominance test (works across diverse skin tones)
            const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
            const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
            const luma = 0.299 * r + 0.587 * g + 0.114 * b;

            if (cb >= 77 && cb <= 132 && cr >= 131 && cr <= 178 && luma > 40 && luma < 240) {
              // Favor center-weighted pixels to reject background walls
              const centerBias =
                1.0 - Math.hypot((x / w - 0.5) * 1.2, (y / h - 0.48) * 1.2);
              if (centerBias > 0.15) {
                const weight = centerBias * centerBias;
                sumX += x * weight;
                sumY += y * weight;
                totalWeight += weight;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              }
            }
          }
        }

        if (totalWeight > 12) {
          const rawCx = sumX / totalWeight / w;
          const cx = Math.min(0.75, Math.max(0.25, mirror ? 1.0 - rawCx : rawCx));
          const cy = Math.min(0.68, Math.max(0.32, sumY / totalWeight / h));
          const detectedWidth = Math.min(0.55, Math.max(0.28, ((maxX - minX) / w) * 0.85));

          this.isDetecting = false;
          return {
            nose: { x: cx, y: cy + 0.02 },
            leftEye: { x: cx - detectedWidth * 0.27, y: cy - detectedWidth * 0.19 },
            rightEye: { x: cx + detectedWidth * 0.27, y: cy - detectedWidth * 0.19 },
            mouth: { x: cx, y: cy + detectedWidth * 0.27 },
            forehead: { x: cx, y: cy - detectedWidth * 0.42 },
            chin: { x: cx, y: cy + detectedWidth * 0.46 },
            faceWidth: detectedWidth,
            faceHeight: detectedWidth * 1.25,
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
