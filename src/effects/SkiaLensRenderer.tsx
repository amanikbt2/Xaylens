import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
// @ts-ignore
import { Canvas, Fill, Shader, ImageShader, useImage, Skia } from '@shopify/react-native-skia';
import { SKIA_FACE_SHADER_AGSL } from './skiaFaceShader';
import { FaceLandmarks, Lens } from '../types/lens';
import { getLensShaderMode } from './webglFaceShader'; // reuse logic

interface SkiaLensRendererProps {
  lens?: Lens;
  comboLenses?: Lens[];
  width: number;
  height: number;
  landmarks: FaceLandmarks;
  cameraFrameImageUri?: string; // We would need the actual camera frame
}

// Precompile the shader (returns null if Skia is not installed yet)
const faceShader = Skia ? Skia.RuntimeEffect.Make(SKIA_FACE_SHADER_AGSL) : null;

export const SkiaLensRenderer: React.FC<SkiaLensRendererProps> = ({
  lens,
  comboLenses,
  width,
  height,
  landmarks,
  cameraFrameImageUri,
}) => {
  // Try to load the frame as a Skia Image. In a real real-time pipeline, 
  // you would use a Skia frame processor to directly process the frame buffer without React state.
  // @ts-ignore
  const image = useImage(cameraFrameImageUri);

  const activeList = useMemo(() => {
    if (comboLenses && comboLenses.length > 0) return comboLenses.filter(l => l && l.id !== 'normal');
    return lens && lens.id !== 'normal' ? [lens] : [];
  }, [lens, comboLenses]);

  const lensMode = useMemo(() => getLensShaderMode(activeList), [activeList]);

  if (!faceShader || !image || activeList.length === 0 || lensMode === 0) {
    return null; // Return null if no distortion lens is active or Skia isn't ready
  }

  // Map landmarks to normalized coordinates (0 to 1) for the shader
  const uniforms = useMemo(() => {
    return {
      u_resolution: [width, height],
      u_mirror: 1.0, // Assuming front camera is mirrored
      u_lensMode: lensMode,
      u_nose: [landmarks.nose.x, landmarks.nose.y],
      u_leftEye: [landmarks.leftEye.x, landmarks.leftEye.y],
      u_rightEye: [landmarks.rightEye.x, landmarks.rightEye.y],
      u_mouth: [landmarks.mouth.x, landmarks.mouth.y],
      u_forehead: [landmarks.forehead.x, landmarks.forehead.y],
      u_chin: [landmarks.chin.x, landmarks.chin.y],
      u_faceScale: landmarks.faceWidth,
      u_roll: landmarks.roll,
      u_time: (Date.now() / 1000) % 100, // simple time uniform
    };
  }, [width, height, landmarks, lensMode]);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Canvas style={{ width, height }}>
        <Fill>
          <Shader source={faceShader} uniforms={uniforms}>
            <ImageShader image={image} fit="cover" tx="decal" ty="decal" />
          </Shader>
        </Fill>
      </Canvas>
    </View>
  );
};
