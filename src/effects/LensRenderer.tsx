import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  G,
  Path,
} from 'react-native-svg';
import { Lens, FaceLandmarks } from '../types/lens';
import { FaceTracker } from './faceTracker';
import { FaceTrackingState, DEFAULT_TRACKING_STATE } from './effectTypes';
import {
  PuppyOverlay,
  BunnyOverlay,
  FunnyGlassesOverlay,
  AlienOverlay,
} from './overlays';

interface LensRendererProps {
  lens: Lens;
  width?: number;
  height?: number;
  landmarks?: FaceLandmarks;
}

const { width: defaultWidth, height: defaultHeight } = Dimensions.get('window');

export const LensRenderer: React.FC<LensRendererProps> = React.memo(
  ({ lens, width = defaultWidth, height = defaultHeight, landmarks: externalLandmarks }) => {
    const [trackingState, setTrackingState] =
      useState<FaceTrackingState>(DEFAULT_TRACKING_STATE);
    const [tick, setTick] = useState(0);
    const trackerRef = useRef<FaceTracker>(new FaceTracker());
    const animFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(Date.now());

    useEffect(() => {
      let active = true;

      const loop = () => {
        const now = Date.now();
        const delta = Math.min(now - lastTimeRef.current, 60);
        lastTimeRef.current = now;

        if (trackerRef.current) {
          const nextState = trackerRef.current.step(delta);
          setTrackingState(nextState);
        }
        setTick((prev) => (prev + 1) % 1000);

        if (active) {
          animFrameRef.current = requestAnimationFrame(loop);
        }
      };

      animFrameRef.current = requestAnimationFrame(loop);

      return () => {
        active = false;
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
        }
      };
    }, []);

    if (lens.id === 'normal') {
      return null;
    }

    // On Web, pure pixel-warp lenses (big-nose, big-eyes, big-mouth, wide-face, tiny-face, swirl-face)
    // are rendered directly inside the 60fps WebGL fragment shader in WebCameraView.web.tsx!
    const isWeb = Platform.OS === 'web';
    if (
      isWeb &&
      (lens.id === 'big-nose' ||
        lens.id === 'big-eyes' ||
        lens.id === 'big-mouth' ||
        lens.id === 'wide-face' ||
        lens.id === 'tiny-face' ||
        lens.id === 'swirl-face')
    ) {
      return null;
    }

    const landmarks = externalLandmarks || trackingState.landmarks;
    const noseX = landmarks.nose.x * width;
    const noseY = landmarks.nose.y * height;
    const eyeLX = landmarks.leftEye.x * width;
    const eyeLY = landmarks.leftEye.y * height;
    const eyeRX = landmarks.rightEye.x * width;
    const eyeRY = landmarks.rightEye.y * height;
    const mouthX = landmarks.mouth.x * width;
    const mouthY = landmarks.mouth.y * height;
    const faceScale = (landmarks.faceWidth * width) / 200;

    return (
      <View
        style={[StyleSheet.absoluteFill, { width, height }]}
        pointerEvents="none"
      >
        {/* NATIVE 3D SCULPTED BIG NOSE PROSTHETIC (No wireframes or dashed lines) */}
        {!isWeb && lens.id === 'big-nose' && (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="sculptedNoseSkin" cx="42%" cy="36%" r="58%">
                <Stop offset="0%" stopColor="#fde68a" stopOpacity="0.92" />
                <Stop offset="45%" stopColor="#f59e0b" stopOpacity="0.72" />
                <Stop offset="82%" stopColor="#b45309" stopOpacity="0.38" />
                <Stop offset="100%" stopColor="#78350f" stopOpacity="0" />
              </RadialGradient>
              <RadialGradient id="nostrilShadow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#1c1917" stopOpacity="0.88" />
                <Stop offset="75%" stopColor="#44403c" stopOpacity="0.45" />
                <Stop offset="100%" stopColor="#44403c" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <G
              transform={`translate(${noseX}, ${noseY}) scale(${
                faceScale * 1.45
              })`}
            >
              {/* Bulbous 3D Nose Tip & Alar Wings */}
              <Ellipse
                cx="-24"
                cy="10"
                rx="26"
                ry="22"
                fill="url(#sculptedNoseSkin)"
              />
              <Ellipse
                cx="24"
                cy="10"
                rx="26"
                ry="22"
                fill="url(#sculptedNoseSkin)"
              />
              <Circle cx="0" cy="0" r="46" fill="url(#sculptedNoseSkin)" />
              {/* Deep Sculpted Nostrils */}
              <Ellipse
                cx="-19"
                cy="19"
                rx="11"
                ry="8"
                fill="url(#nostrilShadow)"
              />
              <Ellipse
                cx="19"
                cy="19"
                rx="11"
                ry="8"
                fill="url(#nostrilShadow)"
              />
              {/* Natural 3D Skin Highlight */}
              <Ellipse
                cx="-11"
                cy="-12"
                rx="12"
                ry="7"
                fill="#ffffff"
                opacity="0.48"
              />
            </G>
          </Svg>
        )}

        {/* NATIVE 3D GLOSSY ANIME / BUG EYES (No blue rings or wireframes) */}
        {!isWeb && lens.id === 'big-eyes' && (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="sclera3D" cx="48%" cy="45%" r="52%">
                <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
                <Stop offset="80%" stopColor="#f1f5f9" stopOpacity="0.92" />
                <Stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
              </RadialGradient>
              <RadialGradient id="iris3D" cx="45%" cy="40%" r="55%">
                <Stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                <Stop offset="55%" stopColor="#0284c7" stopOpacity="0.95" />
                <Stop offset="95%" stopColor="#0f172a" stopOpacity="0.98" />
                <Stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
              </RadialGradient>
            </Defs>

            {/* Left Giant 3D Eye */}
            <G
              transform={`translate(${eyeLX}, ${eyeLY}) scale(${
                faceScale * 1.38
              })`}
            >
              <Ellipse cx="0" cy="0" rx="34" ry="31" fill="url(#sclera3D)" />
              <Circle cx="0" cy="0" r="21" fill="url(#iris3D)" />
              <Circle cx="0" cy="0" r="11" fill="#020617" />
              <Circle cx="-7" cy="-8" r="6.5" fill="#ffffff" opacity="0.95" />
              <Circle cx="6" cy="6" r="3" fill="#ffffff" opacity="0.8" />
            </G>

            {/* Right Giant 3D Eye */}
            <G
              transform={`translate(${eyeRX}, ${eyeRY}) scale(${
                faceScale * 1.38
              })`}
            >
              <Ellipse cx="0" cy="0" rx="34" ry="31" fill="url(#sclera3D)" />
              <Circle cx="0" cy="0" r="21" fill="url(#iris3D)" />
              <Circle cx="0" cy="0" r="11" fill="#020617" />
              <Circle cx="-7" cy="-8" r="6.5" fill="#ffffff" opacity="0.95" />
              <Circle cx="6" cy="6" r="3" fill="#ffffff" opacity="0.8" />
            </G>
          </Svg>
        )}

        {/* NATIVE 3D GIANT MOUTH / LIPS */}
        {!isWeb && lens.id === 'big-mouth' && (
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <LinearGradient id="plumpLips" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#fb7185" />
                <Stop offset="50%" stopColor="#e11d48" />
                <Stop offset="100%" stopColor="#9f1239" />
              </LinearGradient>
            </Defs>
            <G
              transform={`translate(${mouthX}, ${mouthY}) scale(${
                faceScale * 1.55
              })`}
            >
              <Path
                d="M -52 0 C -34 -28, -10 -24, 0 -12 C 10 -24, 34 -28, 52 0 C 34 32, -34 32, -52 0 Z"
                fill="url(#plumpLips)"
              />
              <Path
                d="M -38 -2 C -20 14, 20 14, 38 -2 C 22 4, -22 4, -38 -2 Z"
                fill="#ffffff"
                opacity="0.92"
              />
              <Ellipse
                cx="-16"
                cy="11"
                rx="12"
                ry="3.5"
                fill="#ffffff"
                opacity="0.55"
              />
            </G>
          </Svg>
        )}

        {/* ALIEN HYBRID LENS */}
        {lens.id === 'alien' && (
          <AlienOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* PUPPY OVERLAY LENS */}
        {lens.id === 'puppy' && (
          <PuppyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* BUNNY OVERLAY LENS */}
        {lens.id === 'bunny' && (
          <BunnyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* FUNNY GLASSES OVERLAY LENS */}
        {lens.id === 'funny-glasses' && (
          <FunnyGlassesOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
          />
        )}
      </View>
    );
  }
);

LensRenderer.displayName = 'LensRenderer';
