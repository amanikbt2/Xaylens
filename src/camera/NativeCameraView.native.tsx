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
  Camera as FaceDetectorCamera,
  Face as NativeFace,
} from 'react-native-vision-camera-face-detector';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';
import { DEFAULT_LANDMARKS } from '../effects/effectTypes';
import { FaceLandmarks } from '../types/lens';

const clamp = (value: number) => Math.max(0, Math.min(1, value));

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
    onFaceStatusChangeRef.current = onFaceStatusChange;
    onMountErrorRef.current = onMountError;
    onCameraReadyRef.current = onCameraReady;

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
        const bounds = face.bounds;
        const fallback = {
          x: bounds.x + bounds.width * 0.5,
          y: bounds.y + bounds.height * 0.5,
        };
        const point = (
          candidate: { x: number; y: number } | undefined,
          fallbackPoint: typeof fallback
        ) => ({
          x: clamp((candidate?.x ?? fallbackPoint.x) / viewWidth),
          y: clamp((candidate?.y ?? fallbackPoint.y) / viewHeight),
        });
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
          chin: {
            x: clamp(fallback.x / viewWidth),
            y: clamp((bounds.y + bounds.height) / viewHeight),
          },
          forehead: {
            x: clamp(fallback.x / viewWidth),
            y: clamp(bounds.y / viewHeight),
          },
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

    const cameraOutputs = useMemo(() => [photoOutput, videoOutput], [photoOutput, videoOutput]);
    const canRenderCamera = active && hasCameraPermission && Boolean(device);
    const cameraPreview = useMemo(
      () =>
        canRenderCamera && device ? (
          <FaceDetectorCamera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={active}
            cameraFacing={facing}
            mirrorMode={facing === 'front' ? 'on' : 'off'}
            resizeMode="cover"
            autoMode
            performanceMode="fast"
            outputResolution="preview"
            runLandmarks
            trackingEnabled
            onFacesDetected={handleFacesDetected}
            onError={handleDetectorError}
            outputs={cameraOutputs}
            onPreviewStarted={handleCameraStarted}
          />
        ) : null,
      [
        active,
        cameraOutputs,
        canRenderCamera,
        device,
        facing,
        handleCameraStarted,
        handleDetectorError,
        handleFacesDetected,
      ]
    );

    useImperativeHandle(ref, () => ({
      takePictureAsync: async (): Promise<CapturedMedia | null> => {
        try {
          const photo = await photoOutput.capturePhotoToFile(
            { flashMode: flash === 'auto' ? 'off' : flash },
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
          <LensRenderer
            lens={activeLens}
            comboLenses={comboLenses}
            width={dimensions.width}
            height={dimensions.height}
            landmarks={landmarks}
          />
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
  statusText: {
    color: '#ffffff',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
