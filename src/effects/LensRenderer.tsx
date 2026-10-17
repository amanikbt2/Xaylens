import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { Lens, FaceLandmarks } from '../types/lens';
import { FaceTracker } from './faceTracker';
import { FaceTrackingState, DEFAULT_TRACKING_STATE } from './effectTypes';
import {
  PuppyOverlay,
  BunnyOverlay,
  FunnyGlassesOverlay,
  AlienOverlay,
  BigEyesOverlay,
  BigNoseOverlay,
  BigMouthOverlay,
  TinyFaceOverlay,
  WideFaceOverlay,
  SwirlFaceOverlay,
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
    const isWeb = Platform.OS === 'web';

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





        {/* FACE28 SIGNATURE LENSES (Native only - Web uses WebGL fragment shaders) */}
        {/* BIG EYES (Sparkling Anime / Giant Comic Eyes) */}
        {!isWeb && renderList.some((l) => ['big-eyes', 'surprised-eyes', 'wide-eyes', 'deer-eyes', 'star-eyes'].includes(l.id)) && (
          <BigEyesOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* BIG NOSE (Clown / Bulbous Comical 3D Nose) */}
        {!isWeb && renderList.some((l) => ['big-nose', 'wobble-nose'].includes(l.id)) && (
          <BigNoseOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* BIG MOUTH (Plump 3D Giant Lips & Teeth & Animated Tongue) */}
        {!isWeb && renderList.some((l) => ['big-mouth', 'wide-smile', 'fish-lips', 'robot-smile'].includes(l.id)) && (
          <BigMouthOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* TINY FACE / BUTTON FACE */}
        {!isWeb && renderList.some((l) => ['tiny-face', 'button-face', 'squeaky-face', 'tiny-mouth'].includes(l.id)) && (
          <TinyFaceOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
          />
        )}

        {/* WIDE FACE / CHUBBY CHEEKS */}
        {!isWeb && renderList.some((l) => ['wide-face', 'chipmunk-cheeks', 'clown-cheeks', 'pancake-face', 'marshmallow-head'].includes(l.id)) && (
          <WideFaceOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
          />
        )}

        {/* SWIRL FACE / HYPNOTIC VORTEX */}
        {!isWeb && renderList.some((l) => ['swirl-face', 'dizzy-swirl'].includes(l.id)) && (
          <SwirlFaceOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* ALIEN MARTIAN LENS */}
        {!isWeb && renderList.some((l) => ['alien', 'alien-smile'].includes(l.id)) && (
          <AlienOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* PUPPY OVERLAY LENS */}
        {renderList.some((l) => ['puppy', 'puppy-love'].includes(l.id)) && (
          <PuppyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* BUNNY OVERLAY LENS */}
        {renderList.some((l) => ['bunny', 'bunny-hop'].includes(l.id)) && (
          <BunnyOverlay
            landmarks={landmarks}
            canvasWidth={width}
            canvasHeight={height}
            animationTick={tick}
          />
        )}

        {/* FUNNY GLASSES OVERLAY LENS */}
        {renderList.some((l) => ['funny-glasses', 'goofy-glasses'].includes(l.id)) && (
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
