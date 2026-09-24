import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient,
  Stop,
  Circle,
  Ellipse,
  G,
  Path,
  Rect,
} from 'react-native-svg';
import { Lens } from '../types/lens';
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
}

const { width: defaultWidth, height: defaultHeight } = Dimensions.get('window');

export const LensRenderer: React.FC<LensRendererProps> = React.memo(({
  lens,
  width = defaultWidth,
  height = defaultHeight,
}) => {
  const [trackingState, setTrackingState] = useState<FaceTrackingState>(DEFAULT_TRACKING_STATE);
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
      setTick(prev => (prev + 1) % 1000);

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

  const { landmarks } = trackingState;
  const noseX = landmarks.nose.x * width;
  const noseY = landmarks.nose.y * height;
  const eyeLX = landmarks.leftEye.x * width;
  const eyeLY = landmarks.leftEye.y * height;
  const eyeRX = landmarks.rightEye.x * width;
  const eyeRY = landmarks.rightEye.y * height;
  const faceScale = (landmarks.faceWidth * width) / 200;

  return (
    <View style={[StyleSheet.absoluteFill, { width, height }]} pointerEvents="none">
      {/* 1. BIG NOSE DISTORTION EFFECT */}
      {lens.id === 'big-nose' && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="bigNoseWarp" cx="45%" cy="40%" r="55%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
              <Stop offset="40%" stopColor="#fbbf24" stopOpacity="0.25" />
              <Stop offset="80%" stopColor="#d97706" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="nostrilBulge" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#78350f" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#78350f" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Expanded Giant Cartoon Nose Sphere */}
          <G transform={`translate(${noseX}, ${noseY}) scale(${faceScale * 1.35})`}>
            {/* Distorted Outer Bulge Sphere */}
            <Circle cx="0" cy="0" r="54" fill="url(#bigNoseWarp)" />
            <Circle cx="0" cy="0" r="50" stroke="#f59e0b" strokeWidth="2.5" opacity="0.6" strokeDasharray="6,4" />

            {/* Hilarious Magnified Nostrils */}
            <Ellipse cx="-20" cy="18" rx="14" ry="10" fill="url(#nostrilBulge)" />
            <Ellipse cx="20" cy="18" rx="14" ry="10" fill="url(#nostrilBulge)" />

            {/* Specular highlight */}
            <Ellipse cx="-14" cy="-14" rx="14" ry="9" fill="#ffffff" opacity="0.75" />
          </G>
        </Svg>
      )}

      {/* 2. BIG EYES DISTORTION EFFECT */}
      {lens.id === 'big-eyes' && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="eyeMagnifyGlow" cx="40%" cy="35%" r="60%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <Stop offset="50%" stopColor="#38bdf8" stopOpacity="0.3" />
              <Stop offset="90%" stopColor="#0284c7" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Left Eye Magnification */}
          <G transform={`translate(${eyeLX}, ${eyeLY}) scale(${faceScale * 1.45})`}>
            <Circle cx="0" cy="0" r="38" fill="url(#eyeMagnifyGlow)" />
            <Circle cx="0" cy="0" r="36" stroke="#38bdf8" strokeWidth="2" opacity="0.75" />
            {/* Anime Sparkles */}
            <Circle cx="-10" cy="-10" r="7" fill="#ffffff" opacity="0.9" />
            <Circle cx="10" cy="8" r="3.5" fill="#ffffff" opacity="0.7" />
          </G>

          {/* Right Eye Magnification */}
          <G transform={`translate(${eyeRX}, ${eyeRY}) scale(${faceScale * 1.45})`}>
            <Circle cx="0" cy="0" r="38" fill="url(#eyeMagnifyGlow)" />
            <Circle cx="0" cy="0" r="36" stroke="#38bdf8" strokeWidth="2" opacity="0.75" />
            {/* Anime Sparkles */}
            <Circle cx="-10" cy="-10" r="7" fill="#ffffff" opacity="0.9" />
            <Circle cx="10" cy="8" r="3.5" fill="#ffffff" opacity="0.7" />
          </G>
        </Svg>
      )}

      {/* 3. TINY FACE DISTORTION EFFECT */}
      {lens.id === 'tiny-face' && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id="tinyFacePinch" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
              <Stop offset="60%" stopColor="#db2777" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <G transform={`translate(${noseX}, ${noseY + 15 * faceScale}) scale(${faceScale})`}>
            {/* Inward pinch vortex guides */}
            <Circle cx="0" cy="0" r="75" fill="url(#tinyFacePinch)" />
            <Circle cx="0" cy="0" r="55" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="4,6" opacity="0.7" />
            <Circle cx="0" cy="0" r="35" stroke="#ec4899" strokeWidth="2" opacity="0.9" />

            {/* Inward arrows indicating pinch deformation */}
            <Path d="M -60 0 L -45 0" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 60 0 L 45 0" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 0 -60 L 0 -45" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
            <Path d="M 0 60 L 0 45" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
          </G>
        </Svg>
      )}

      {/* 4. WIDE FACE DISTORTION EFFECT */}
      {lens.id === 'wide-face' && (
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="wideStretchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <Stop offset="50%" stopColor="#10b981" stopOpacity="0.05" />
              <Stop offset="100%" stopColor="#10b981" stopOpacity="0.4" />
            </LinearGradient>
          </Defs>
          <G transform={`translate(${noseX}, ${noseY}) scale(${faceScale})`}>
            {/* Outward horizontal expansion contours */}
            <Ellipse cx="0" cy="0" rx="140" ry="60" fill="url(#wideStretchGrad)" />
            <Ellipse cx="0" cy="0" rx="135" ry="55" stroke="#34d399" strokeWidth="2" opacity="0.7" strokeDasharray="8,6" />

            {/* Outward horizontal arrows */}
            <Path d="M -90 0 L -120 0 M -115 -8 L -125 0 L -115 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M 90 0 L 120 0 M 115 -8 L 125 0 L 115 8" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </G>
        </Svg>
      )}

      {/* 5. ALIEN HYBRID LENS */}
      {lens.id === 'alien' && (
        <>
          {/* Subtle cosmic green tint over the face */}
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="alienAura" cx="50%" cy="45%" r="60%">
                <Stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
                <Stop offset="70%" stopColor="#16a34a" stopOpacity="0.12" />
                <Stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width={width} height={height} fill="url(#alienAura)" />
          </Svg>
          <AlienOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        </>
      )}

      {/* 6. PUPPY OVERLAY LENS */}
      {lens.id === 'puppy' && (
        <PuppyOverlay
          landmarks={landmarks}
          canvasWidth={width}
          canvasHeight={height}
          animationTick={tick}
        />
      )}

      {/* 7. BUNNY OVERLAY LENS */}
      {lens.id === 'bunny' && (
        <BunnyOverlay
          landmarks={landmarks}
          canvasWidth={width}
          canvasHeight={height}
          animationTick={tick}
        />
      )}

      {/* 8. FUNNY GLASSES OVERLAY LENS */}
      {lens.id === 'funny-glasses' && (
        <FunnyGlassesOverlay
          landmarks={landmarks}
          canvasWidth={width}
          canvasHeight={height}
        />
      )}
    </View>
  );
});

LensRenderer.displayName = 'LensRenderer';
