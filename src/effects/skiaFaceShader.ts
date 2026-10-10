// skiaFaceShader.ts
// AGSL (Android Graphics Shading Language) port of the WebGL face distortion shader.
// Used with @shopify/react-native-skia RuntimeEffect.

export const SKIA_FACE_SHADER_AGSL = `
uniform shader image;
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

half4 main(vec2 xy) {
  vec2 uv = xy / u_resolution;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float s = clamp(u_faceScale, 0.55, 1.85);

  if (hasMode(u_lensMode, 1) || u_lensMode == 1) {
    float pulse = 1.0 + sin(u_time * 3.0) * 0.04;
    uv = warpEllipse(uv, u_nose + vec2(0.0, 0.018 * s), vec2(0.24 * s, 0.14 * s), 0.95 * pulse, aspect, u_roll);
    uv = warpBulgePinch(uv, u_nose, 0.20 * s, 1.55 * pulse, aspect);
    vec2 bridge = (u_leftEye + u_rightEye) * 0.5;
    uv = warpBulgePinch(uv, bridge, 0.09 * s, -0.28, aspect);
  }
  if (hasMode(u_lensMode, 2) || u_lensMode == 2) {
    float pulse = 1.0 + sin(u_time * 2.5) * 0.03;
    uv = warpBulgePinch(uv, u_leftEye, 0.165 * s, 1.45 * pulse, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.165 * s, 1.45 * pulse, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.12 * s, -0.25, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.16 * s, -0.28, aspect);
  }
  if (hasMode(u_lensMode, 4) || u_lensMode == 3) {
    float pulse = 1.0 + sin(u_time * 3.2) * 0.05;
    uv = warpEllipse(uv, u_mouth, vec2(0.28 * s, 0.18 * s), 1.58 * pulse, aspect, u_roll);
    uv = warpBulgePinch(uv, u_mouth, 0.19 * s, 0.78 * pulse, aspect);
  }
  if (hasMode(u_lensMode, 8) || u_lensMode == 4) {
    vec2 faceCenter = mix(u_nose, u_mouth, 0.35);
    uv = warpBulgePinch(uv, faceCenter, 0.34 * s, -0.68, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.18 * s, -0.35, aspect);
  }
  if (hasMode(u_lensMode, 16) || u_lensMode == 5) {
    vec2 midFace = mix(u_nose, u_mouth, 0.4);
    uv = warpHorizontalStretch(uv, midFace, vec2(0.38 * s, 0.32 * s), 1.18, aspect, u_roll);
    uv = warpEllipse(uv, u_chin, vec2(0.28 * s, 0.16 * s), 0.68, aspect, u_roll);
  }
  if (hasMode(u_lensMode, 32) || u_lensMode == 6) {
    uv = warpEllipse(uv, u_forehead, vec2(0.34 * s, 0.24 * s), 0.92, aspect, u_roll);
    uv = warpBulgePinch(uv, u_leftEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.16 * s, 1.30, aspect);
    uv = warpBulgePinch(uv, u_nose, 0.13 * s, -0.45, aspect);
    uv = warpBulgePinch(uv, u_chin, 0.22 * s, -0.58, aspect);
    uv = warpBulgePinch(uv, u_mouth, 0.14 * s, -0.38, aspect);
  }
  if (hasMode(u_lensMode, 64) || u_lensMode == 7) {
    float dynamicAngle = 2.35 * cos(u_time * 1.2);
    uv = warpSwirl(uv, u_nose, 0.32 * s, dynamicAngle, aspect);
  }
  if (hasMode(u_lensMode, 128) || u_lensMode >= 8) {
    uv = warpBulgePinch(uv, u_leftEye, 0.13 * s, 0.42, aspect);
    uv = warpBulgePinch(uv, u_rightEye, 0.13 * s, 0.42, aspect);
  }

  vec2 sampleUv = clamp(uv, 0.002, 0.998);
  if (u_mirror > 0.5) {
    sampleUv.x = 1.0 - sampleUv.x;
  }

  vec2 finalXY = sampleUv * u_resolution;
  half4 color = image.eval(finalXY);

  if (hasMode(u_lensMode, 32) || u_lensMode == 6) {
    vec2 dFace = (v_uv - u_nose) * vec2(aspect, 1.0);
    float faceMask = smoothstep(0.36 * s, 0.08 * s, length(dFace));
    vec3 alienTint = vec3(color.r * 0.68, min(1.0, color.g * 1.25 + 0.06), color.b * 0.88);
    color.rgb = mix(color.rgb, alienTint, faceMask * 0.65);
  }

  return color;
}
`;
