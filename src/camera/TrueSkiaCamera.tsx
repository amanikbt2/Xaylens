import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
// @ts-ignore
import { SkiaCamera } from 'react-native-vision-camera-skia';
import { useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useFaceDetectorOutput } from 'react-native-vision-camera-face-detector';
// @ts-ignore
import { Skia } from '@shopify/react-native-skia';
// @ts-ignore
import { useSharedValue } from 'react-native-worklets-core';

import { SKIA_FACE_SHADER_AGSL } from '../effects/skiaFaceShader';
import { getLensShaderMode } from '../effects/webglFaceShader';
import { Lens } from '../types/lens';

// Pre-compile the RuntimeEffect once
const faceRuntimeEffect = Skia ? Skia.RuntimeEffect.Make(SKIA_FACE_SHADER_AGSL) : null;

interface TrueSkiaCameraProps {
  lens?: Lens;
  comboLenses?: Lens[];
}

export const TrueSkiaCamera: React.FC<TrueSkiaCameraProps> = ({ lens, comboLenses }) => {
  const device = useCameraDevice('front');
  const { hasPermission } = useCameraPermission();
  
  const activeList = useMemo(() => {
    if (comboLenses && comboLenses.length > 0) return comboLenses.filter(l => l && l.id !== 'normal');
    return lens && lens.id !== 'normal' ? [lens] : [];
  }, [lens, comboLenses]);
  
  const lensMode = useMemo(() => getLensShaderMode(activeList), [activeList]);
  
  // We use a shared value for landmarks to avoid bridging overhead on every frame!
  const sharedLandmarks = useSharedValue(new Float32Array(13)); // [mode, noseX, noseY, leftEyeX, leftEyeY, rightEyeX, rightEyeY, mouthX, mouthY, foreheadX, foreheadY, chinX, chinY]
  const sharedMeta = useSharedValue(new Float32Array([1.0, 0.0])); // [faceScale, roll]

  const output = useFaceDetectorOutput({
    onFacesDetected: (faces) => {
      if (faces.length > 0) {
        const f = faces[0];
        // Populate the shared array for the worklet
        sharedLandmarks.value = new Float32Array([
          lensMode,
          f.contours?.NOSE_BRIDGE?.[0]?.x || 0, f.contours?.NOSE_BRIDGE?.[0]?.y || 0,
          f.contours?.LEFT_EYE?.[0]?.x || 0, f.contours?.LEFT_EYE?.[0]?.y || 0,
          f.contours?.RIGHT_EYE?.[0]?.x || 0, f.contours?.RIGHT_EYE?.[0]?.y || 0,
          f.contours?.LOWER_LIP_BOTTOM?.[0]?.x || 0, f.contours?.LOWER_LIP_BOTTOM?.[0]?.y || 0,
          f.bounds.y, f.bounds.y,
          f.contours?.FACE?.[18]?.x || 0, f.contours?.FACE?.[18]?.y || 0,
        ]);
        sharedMeta.value = new Float32Array([f.bounds.width, f.rollAngle]);
      }
    },
    onError: (e) => console.error(e),
  });

  if (!hasPermission || !device) return <View style={StyleSheet.absoluteFill} />;

  return (
    <View style={StyleSheet.absoluteFill}>
      <SkiaCamera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        outputs={[output]}
        onFrame={(frame, render) => {
          'worklet';
          render(({ frameTexture, canvas }) => {
            const width = frame.width;
            const height = frame.height;
            
            const landmarks = sharedLandmarks.value;
            const meta = sharedMeta.value;
            const mode = landmarks[0];
            
            if (mode === 0 || !faceRuntimeEffect) {
               // Just draw the normal camera frame if no lens or skia is missing
               canvas.drawImage(frameTexture, 0, 0);
            } else {
               // We have a lens active! Pass uniforms to our AGSL shader
               const uniforms = [
                 width, height, // u_resolution
                 1.0, // u_mirror
                 mode, // u_lensMode
                 landmarks[1], landmarks[2], // u_nose
                 landmarks[3], landmarks[4], // u_leftEye
                 landmarks[5], landmarks[6], // u_rightEye
                 landmarks[7], landmarks[8], // u_mouth
                 landmarks[9], landmarks[10], // u_forehead
                 landmarks[11], landmarks[12], // u_chin
                 meta[0], // u_faceScale
                 meta[1], // u_roll
                 0.0 // u_time (simplified for worklet)
               ];
               
               const textureShader = frameTexture.makeShaderOptions('clamp' as any, 'clamp' as any, 'nearest' as any, 'nearest' as any);
               const activeShader = faceRuntimeEffect.makeShaderWithChildren(uniforms, [textureShader]);
               
               const paint = Skia.Paint();
               paint.setShader(activeShader);
               canvas.drawRect(Skia.XYWHRect(0, 0, width, height), paint);
            }
          });
          frame.dispose();
        }}
      />
    </View>
  );
};
