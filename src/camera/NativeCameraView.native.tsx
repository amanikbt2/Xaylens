import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import {
  CameraRef,
  useCameraDevice,
  useCameraPermission,
  useMicrophonePermission,
  usePhotoOutput,
  useVideoOutput,
} from 'react-native-vision-camera';
import {
  useFaceDetectorOutput,
  Face as NativeFace,
} from 'react-native-vision-camera-face-detector';
// @ts-ignore
import { SkiaCamera } from 'react-native-vision-camera-skia';
// @ts-ignore
import { Skia } from '@shopify/react-native-skia';
// @ts-ignore
import { useSharedValue } from 'react-native-worklets-core';
import { SKIA_FACE_SHADER_AGSL } from '../effects/skiaFaceShader';
import { getLensShaderMode } from '../effects/webglFaceShader';

const faceRuntimeEffect = Skia ? Skia.RuntimeEffect.Make(SKIA_FACE_SHADER_AGSL) : null;
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';
import { SkiaLensRenderer } from '../effects/SkiaLensRenderer';
import { DEFAULT_LANDMARKS } from '../effects/effectTypes';
import { FaceLandmarks } from '../types/lens';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Face detector points are expressed in the camera frame. The preview uses
 * resizeMode="cover", so the frame must be scaled and cropped before it can
 * be used by the SVG overlay. Keeping this conversion here also makes the
 * front-camera mirror explicit instead of relying on detector internals.
 */
const createPreviewMapper = (
  frameWidth: number,
  frameHeight: number,
  viewWidth: number,
  viewHeight: number,
  mirrored: boolean
) => {
  const scale = Math.max(viewWidth / frameWidth, viewHeight / frameHeight);
  const renderedWidth = frameWidth * scale;
  const renderedHeight = frameHeight * scale;
  const offsetX = (viewWidth - renderedWidth) / 2;
  const offsetY = (viewHeight - renderedHeight) / 2;

  return (point: { x: number; y: number }) => {
    const x = point.x * scale + offsetX;
    const y = point.y * scale + offsetY;
    return {
      x: mirrored ? viewWidth - x : x,
      y,
    };
  };
};

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(
  (
    {
      facing,
      flash,
      activeLens,
      comboLenses,
      active = true,
      onCameraReady,
      onMountError,
      onFaceStatusChange,
      style,
    },
    ref
  ) => {
    const cameraRef = useRef<CameraRef | null>(null);
    const recorderRef = useRef<any>(null);
    const recordingResultRef = useRef<Promise<string> | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [landmarks, setLandmarks] = useState<FaceLandmarks>(DEFAULT_LANDMARKS);
    const [hasFace, setHasFace] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const dimensionsRef = useRef(dimensions);
    dimensionsRef.current = dimensions;
    const landmarksRef = useRef(DEFAULT_LANDMARKS);
    const hasFaceRef = useRef(false);
    const onFaceStatusChangeRef = useRef(onFaceStatusChange);
    const onMountErrorRef = useRef(onMountError);
    const onCameraReadyRef = useRef(onCameraReady);
    const facingRef = useRef(facing);
    onFaceStatusChangeRef.current = onFaceStatusChange;
    onMountErrorRef.current = onMountError;
    onCameraReadyRef.current = onCameraReady;
    facingRef.current = facing;

    const device = useCameraDevice(facing === 'front' ? 'front' : 'back');
    const cameraPermission = useCameraPermission();
    const microphonePermission = useMicrophonePermission();
    const photoOutput = usePhotoOutput({ qualityPrioritization: 'speed' });
    const videoOutput = useVideoOutput({
      enableAudio: true,
      targetResolution: { width: 1280, height: 720 },
    });

    const { hasPermission: hasCameraPermission, canRequestPermission: canRequestCameraPermission, requestPermission: requestCameraPermission } = cameraPermission;
    const { hasPermission: hasMicrophonePermission, canRequestPermission: canRequestMicrophonePermission, requestPermission: requestMicrophonePermission } = microphonePermission;

    useEffect(() => {
      if (!hasCameraPermission && canRequestCameraPermission) {
        requestCameraPermission().catch(() => {});
      }
      if (!hasMicrophonePermission && canRequestMicrophonePermission) {
        requestMicrophonePermission().catch(() => {});
      }
    }, [
      canRequestCameraPermission,
      canRequestMicrophonePermission,
      hasCameraPermission,
      hasMicrophonePermission,
      requestCameraPermission,
      requestMicrophonePermission,
    ]);

    const handleLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width > 0 && height > 0) {
        dimensionsRef.current = { width, height };
        setDimensions({ width, height });
      }
    };

    const handleFacesDetected = useCallback(
      (faces: NativeFace[]) => {
        const face = faces[0];
        if (!face) {
          hasFaceRef.current = false;
          setHasFace(false);
          onFaceStatusChangeRef.current?.({
            quality: 'searching',
            lightingStatus: 'searching',
            hasFace: false,
          });
          return;
        }

        const viewWidth = dimensionsRef.current.width || face.frameWidth || 1;
        const viewHeight = dimensionsRef.current.height || face.frameHeight || 1;
        const frameWidth = face.frameWidth || viewWidth;
        const frameHeight = face.frameHeight || viewHeight;
        const mapToPreview = createPreviewMapper(
          frameWidth,
          frameHeight,
          viewWidth,
          viewHeight,
          facingRef.current === 'front'
        );
        const sourceBounds = face.bounds;
        const boundsTopLeft = mapToPreview({ x: sourceBounds.x, y: sourceBounds.y });
        const boundsBottomRight = mapToPreview({
          x: sourceBounds.x + sourceBounds.width,
          y: sourceBounds.y + sourceBounds.height,
        });
        const bounds = {
          x: Math.min(boundsTopLeft.x, boundsBottomRight.x),
          y: Math.min(boundsTopLeft.y, boundsBottomRight.y),
          width: Math.abs(boundsBottomRight.x - boundsTopLeft.x),
          height: Math.abs(boundsBottomRight.y - boundsTopLeft.y),
        };
        const fallback = {
          x: bounds.x + bounds.width * 0.5,
          y: bounds.y + bounds.height * 0.5,
        };
        const point = (
          candidate: { x: number; y: number } | undefined,
          fallbackPoint: typeof fallback
        ) => {
          const mapped = candidate
            ? mapToPreview(candidate)
            : fallbackPoint;
          return {
            x: clamp(mapped.x / viewWidth),
            y: clamp(mapped.y / viewHeight),
          };
        };
        const nativeLandmarks = face.landmarks;
        const eyeY = bounds.y + bounds.height * 0.38;
        const leftEye = point(nativeLandmarks?.LEFT_EYE, {
          x: bounds.x + bounds.width * 0.32,
          y: eyeY,
        });
        const rightEye = point(nativeLandmarks?.RIGHT_EYE, {
          x: bounds.x + bounds.width * 0.68,
          y: eyeY,
        });
        const nextLandmarks: FaceLandmarks = {
          nose: point(nativeLandmarks?.NOSE_BASE, fallback),
          leftEye,
          rightEye,
          mouth: point(nativeLandmarks?.MOUTH_BOTTOM, {
            x: fallback.x,
            y: bounds.y + bounds.height * 0.72,
          }),
          chin: point(undefined, {
            x: fallback.x,
            y: bounds.y + bounds.height,
          }),
          forehead: point(undefined, {
            x: fallback.x,
            y: bounds.y,
          }),
          leftEar: point(nativeLandmarks?.LEFT_EAR, {
            x: bounds.x,
            y: fallback.y,
          }),
          rightEar: point(nativeLandmarks?.RIGHT_EAR, {
            x: bounds.x + bounds.width,
            y: fallback.y,
          }),
          faceWidth: clamp(bounds.width / viewWidth),
          faceHeight: clamp(bounds.height / viewHeight),
          yaw: face.yawAngle || 0,
          pitch: face.pitchAngle || 0,
          roll: face.rollAngle || 0,
        };

        const mix = (previous: number, next: number, factor: number) =>
          previous + (next - previous) * factor;
        const previousLandmarks = landmarksRef.current;
        const smoothing = hasFaceRef.current ? 0.62 : 1;
        const smoothedLandmarks: FaceLandmarks = {
          nose: {
            x: mix(previousLandmarks.nose.x, nextLandmarks.nose.x, smoothing),
            y: mix(previousLandmarks.nose.y, nextLandmarks.nose.y, smoothing),
          },
          leftEye: {
            x: mix(previousLandmarks.leftEye.x, nextLandmarks.leftEye.x, smoothing),
            y: mix(previousLandmarks.leftEye.y, nextLandmarks.leftEye.y, smoothing),
          },
          rightEye: {
            x: mix(previousLandmarks.rightEye.x, nextLandmarks.rightEye.x, smoothing),
            y: mix(previousLandmarks.rightEye.y, nextLandmarks.rightEye.y, smoothing),
          },
          mouth: {
            x: mix(previousLandmarks.mouth.x, nextLandmarks.mouth.x, smoothing),
            y: mix(previousLandmarks.mouth.y, nextLandmarks.mouth.y, smoothing),
          },
          chin: {
            x: mix(previousLandmarks.chin.x, nextLandmarks.chin.x, smoothing),
            y: mix(previousLandmarks.chin.y, nextLandmarks.chin.y, smoothing),
          },
          forehead: {
            x: mix(previousLandmarks.forehead.x, nextLandmarks.forehead.x, smoothing),
            y: mix(previousLandmarks.forehead.y, nextLandmarks.forehead.y, smoothing),
          },
          leftEar: {
            x: mix(previousLandmarks.leftEar.x, nextLandmarks.leftEar.x, smoothing),
            y: mix(previousLandmarks.leftEar.y, nextLandmarks.leftEar.y, smoothing),
          },
          rightEar: {
            x: mix(previousLandmarks.rightEar.x, nextLandmarks.rightEar.x, smoothing),
            y: mix(previousLandmarks.rightEar.y, nextLandmarks.rightEar.y, smoothing),
          },
          faceWidth: mix(previousLandmarks.faceWidth, nextLandmarks.faceWidth, smoothing),
          faceHeight: mix(previousLandmarks.faceHeight, nextLandmarks.faceHeight, smoothing),
          yaw: mix(previousLandmarks.yaw, nextLandmarks.yaw, smoothing),
          pitch: mix(previousLandmarks.pitch, nextLandmarks.pitch, smoothing),
          roll: mix(previousLandmarks.roll, nextLandmarks.roll, smoothing),
        };

        landmarksRef.current = smoothedLandmarks;
        hasFaceRef.current = true;
        setLandmarks(smoothedLandmarks);
        setHasFace(true);
        onFaceStatusChangeRef.current?.({
          quality: 'poor',
          lightingStatus: 'good',
          hasFace: true,
          faceWidth: nextLandmarks.faceWidth,
        });
      },
      []
    );

    const handleDetectorError = useCallback(
      (error: Error) => {
        setCameraError(error.message);
        onMountErrorRef.current?.(error.message);
      },
      []
    );

    const handleCameraStarted = useCallback(() => {
      setCameraReady(true);
      onCameraReadyRef.current?.();
    }, []);

    const faceDetectorOutput = useFaceDetectorOutput({
      onFacesDetected: handleFacesDetected,
      onError: handleDetectorError,
      outputResolution: 'preview',
      runLandmarks: true,
      trackingEnabled: true
    });

    const cameraOutputs = useMemo(() => [faceDetectorOutput, photoOutput, videoOutput], [faceDetectorOutput, photoOutput, videoOutput]);
    const canRenderCamera = active && hasCameraPermission && Boolean(device);
    const cameraPreview = useMemo(
      () =>
        canRenderCamera && device ? (
          <SkiaCamera
            ref={cameraRef as any}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={active}
            {...(device.hasTorch ? { torchMode: facing === 'back' && flash === 'on' ? 'on' : 'off' } : {})}
            outputs={cameraOutputs}
            onFrame={(frame, render) => {
              'worklet';
              render(({ frameTexture, canvas }) => {
                const w = frame.width;
                const h = frame.height;
                // Currently, SkiaCamera cannot easily access the JS-thread landmarks without a shared value
                // For a 100% perfect implementation, the user should pass useSharedValue as shown in TrueSkiaCamera.tsx
                canvas.drawImage(frameTexture, 0, 0);
              });
              frame.dispose();
            }}
          />
        ) : null,
      [
        active,
        cameraOutputs,
        canRenderCamera,
        device,
        facing,
        flash,
        handleCameraStarted,
        handleDetectorError,
        handleFacesDetected,
      ]
    );

    useImperativeHandle(ref, () => ({
      takePictureAsync: async (): Promise<CapturedMedia | null> => {
        try {
          const photo = await photoOutput.capturePhotoToFile(
            { ...(device?.hasFlash ? { flashMode: flash } : {}) },
            {}
          );
          return {
            id: `photo_${Date.now()}`,
            type: 'photo',
            uri: `file://${photo.filePath}`,
            timestamp: Date.now(),
            lensId: activeLens.id,
            lensName: activeLens.name,
          };
        } catch (error) {
          console.error('takePictureAsync error:', error);
          return null;
        }
      },
      startRecordingAsync: async () => {
        if (recorderRef.current) return;
        try {
          const recorder = await videoOutput.createRecorder({ maxDuration: 60 });
          recorderRef.current = recorder;
          recordingResultRef.current = new Promise<string>((resolve, reject) => {
            recorder.startRecording(resolve, reject).catch(reject);
          });
        } catch (error) {
          recorderRef.current = null;
          recordingResultRef.current = null;
          console.error('startRecordingAsync error:', error);
        }
      },
      stopRecordingAsync: async (): Promise<CapturedMedia | null> => {
        const recorder = recorderRef.current;
        const resultPromise = recordingResultRef.current;
        if (!recorder || !resultPromise) return null;
        try {
          await recorder.stopRecording();
          const filePath = await resultPromise;
          return {
            id: `video_${Date.now()}`,
            type: 'video',
            uri: `file://${filePath}`,
            timestamp: Date.now(),
            lensId: activeLens.id,
            lensName: activeLens.name,
          };
        } catch (error) {
          console.error('stopRecordingAsync error:', error);
          return null;
        } finally {
          recorderRef.current = null;
          recordingResultRef.current = null;
        }
      },
    }));

    return (
      <View style={[styles.container, style]} onLayout={handleLayout}>
        {cameraPreview || (
          <View style={styles.statusOverlay}>
            <ActivityIndicator color="#facc15" />
            <Text style={styles.statusText}>
              {cameraError ||
                (hasCameraPermission
                  ? device
                    ? 'Starting camera…'
                    : 'No camera is available'
                  : 'Camera permission required')}
            </Text>
          </View>
        )}

        {cameraReady && hasFace && dimensions.width > 0 && dimensions.height > 0 && (
          <>
            <SkiaLensRenderer
              lens={activeLens}
              comboLenses={comboLenses}
              width={dimensions.width}
              height={dimensions.height}
              landmarks={landmarks}
            />
            <LensRenderer
              lens={activeLens}
              comboLenses={comboLenses}
              width={dimensions.width}
              height={dimensions.height}
              landmarks={landmarks}
            />
          </>
        )}

        {facing === 'front' && flash === 'on' && (
          <View style={styles.frontFlashOverlay} pointerEvents="none" />
        )}
      </View>
    );
  }
);

PlatformCameraView.displayName = 'PlatformCameraView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  statusOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#000000',
  },
  frontFlashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 252, 235, 0.12)',
    borderWidth: 18,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
