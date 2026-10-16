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
import { CreativeLensOverlay } from './CreativeLensOverlay';

import { getWarpedLandmarks } from '../utils/landmarkWarper';

interface LensRendererProps {
  lens?: Lens;
  comboLenses?: Lens[];
  width?: number;
  height?: number;
  landmarks?: FaceLandmarks;
}

const { width: defaultWidth, height: defaultHeight } = Dimensions.get('window');

export const LensRenderer: React.FC<LensRendererProps> = React.memo(
  ({ lens, comboLenses, width = defaultWidth, height = defaultHeight, landmarks: externalLandmarks }) => {
    const [trackingState, setTrackingState] =
      useState<FaceTrackingState>(DEFAULT_TRACKING_STATE);
    const [tick, setTick] = useState(0);
    const trackerRef = useRef<FaceTracker>(new FaceTracker());
    const animFrameRef = useRef<number | null>(null);
    const lastTimeRef = useRef<number>(Date.now());
    const hasFaceLens = Boolean(
      (comboLenses && comboLenses.some((item) => item.category !== 'background' && item.category !== 'ar' && item.id !== 'normal')) ||
        (lens && lens.category !== 'background' && lens.category !== 'ar' && lens.id !== 'normal')
    );

    useEffect(() => {
      if (!hasFaceLens) return;
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
    }, [hasFaceLens]);

    const activeList = React.useMemo(() => {
      if (comboLenses && comboLenses.length > 0) {
        return comboLenses.filter((l) => l && l.id !== 'normal');
      }
      return lens && lens.id !== 'normal' ? [lens] : [];
    }, [lens, comboLenses]);

    // The web background compositor already owns the full-screen background.
    // Do not let the background lens' decorative gradient cover face lenses.
    const renderList = React.useMemo(
      () =>
        Platform.OS === 'web'
          ? activeList.filter((item) => item.category !== 'background' && item.category !== 'ar')
          : activeList,
      [activeList]
    );

    if (renderList.length === 0) {
      return null;
    }

    const rawLandmarks = externalLandmarks || trackingState.landmarks;
    const landmarks = getWarpedLandmarks(rawLandmarks, renderList);
    const noseX = landmarks.nose.x * width;
    const noseY = landmarks.nose.y * height;
    const eyeLX = landmarks.leftEye.x * width;
    const eyeLY = landmarks.leftEye.y * height;
    const eyeRX = landmarks.rightEye.x * width;
    const eyeRY = landmarks.rightEye.y * height;
    const mouthX = landmarks.mouth.x * width;
    const mouthY = landmarks.mouth.y * height;
    const faceScale = (landmarks.faceWidth * width) / 200;
    const isWeb = Platform.OS === 'web';

    const hasLens = (id: string) => renderList.some((l) => l.id === id);

    return (
      <View
        style={[StyleSheet.absoluteFill, { width, height, pointerEvents: 'none' }]}
      >
        {renderList.map((l) => (
          <CreativeLensOverlay
            key={l.id}
            lens={l}
            width={width}
            height={height}
            landmarks={landmarks}
            animationTick={tick}
          />
        ))}





        {/* NATIVE 3D GIANT MOUTH / LIPS */}
        {!isWeb && hasLens('big-mouth') && (
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
        {hasLens('alien') && (
          <AlienOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* PUPPY OVERLAY LENS */}
        {hasLens('puppy') && (
          <PuppyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* BUNNY OVERLAY LENS */}
        {hasLens('bunny') && (
          <BunnyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* FUNNY GLASSES OVERLAY LENS */}
        {hasLens('funny-glasses') && (
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
