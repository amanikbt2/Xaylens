import { DistortionConfig, FaceLandmarks, FaceLandmarkPoint } from '../types/lens';

export interface WarpVertex {
  origX: number;
  origY: number;
  warpedX: number;
  warpedY: number;
}

/**
 * Apply radial bulge or pinch mathematical distortion to a point (x, y)
 * given a center, radius, and factor (>0 for bulge, <0 for pinch).
 */
export const applyBulgePinch = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  radius: number,
  factor: number
): FaceLandmarkPoint => {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.hypot(dx, dy);

  if (dist >= radius || dist === 0) {
    return { x, y };
  }

  // Normalized distance 0..1
  const normDist = dist / radius;
  // Non-linear polynomial distortion curve
  const r = normDist;
  const distortedR = factor > 0
    ? Math.pow(r, 1 - factor * 0.75) // bulge
    : Math.pow(r, 1 - factor * 0.9); // pinch

  const newDist = distortedR * radius;
  const scale = newDist / dist;

  return {
    x: cx + dx * scale,
    y: cy + dy * scale,
  };
};

/**
 * Apply horizontal wide-face stretch
 */
export const applyHorizontalStretch = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  radius: number,
  factor: number
): FaceLandmarkPoint => {
  const dx = x - cx;
  const dy = y - cy;
  const distY = Math.abs(dy);

  if (distY >= radius) {
    return { x, y };
  }

  const verticalWeight = Math.cos((distY / radius) * (Math.PI / 2));
  const stretch = 1 + factor * verticalWeight * 0.6;

  return {
    x: cx + dx * stretch,
    y: y,
  };
};

/**
 * Compute SVG filter parameters or HTML5 Canvas warp parameters for a given lens distortion
 */
export const getDistortionWarpParams = (
  config: DistortionConfig,
  landmarks: FaceLandmarks,
  width: number,
  height: number
) => {
  let center: FaceLandmarkPoint = { x: 0.5, y: 0.5 };
  let radius = config.radius * Math.min(width, height);
  let factor = config.intensity;

  if (config.targetRegion === 'nose') {
    center = {
      x: landmarks.nose.x * width,
      y: landmarks.nose.y * height,
    };
  } else if (config.targetRegion === 'eyes') {
    // Return centers for both eyes
    return {
      type: config.type,
      dual: true,
      leftEye: {
        center: { x: landmarks.leftEye.x * width, y: landmarks.leftEye.y * height },
        radius: (config.radius * 0.8) * Math.min(width, height),
        factor: factor,
      },
      rightEye: {
        center: { x: landmarks.rightEye.x * width, y: landmarks.rightEye.y * height },
        radius: (config.radius * 0.8) * Math.min(width, height),
        factor: factor,
      },
    };
  } else if (config.targetRegion === 'face') {
    center = {
      x: landmarks.nose.x * width,
      y: (landmarks.nose.y * 0.4 + landmarks.mouth.y * 0.6) * height,
    };
    factor = -factor; // Pinch
  } else {
    center = {
      x: landmarks.nose.x * width,
      y: landmarks.nose.y * height,
    };
  }

  return {
    type: config.type,
    dual: false,
    center,
    radius,
    factor: config.type === 'pinch' ? -factor : factor,
  };
};
