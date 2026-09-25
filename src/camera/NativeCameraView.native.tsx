import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { StyleSheet, View, LayoutChangeEvent, Animated } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(
  (
    { facing, flash, mode, activeLens, onCameraReady, onMountError, style },
    ref
  ) => {
    const cameraRef = useRef<CameraView>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const isRecordingRef = useRef(false);
    const recordPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(
      null
    );

    // Animated real-time optical viewport distortion for Native camera
    const scaleXAnim = useRef(new Animated.Value(1)).current;
    const scaleYAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      let targetX = 1;
      let targetY = 1;

      switch (activeLens.id) {
        case 'wide-face':
          targetX = 1.42;
          targetY = 0.92;
          break;
        case 'tiny-face':
          targetX = 0.84;
          targetY = 0.86;
          break;
        case 'big-nose':
          targetX = 1.16;
          targetY = 1.12;
          break;
        case 'big-eyes':
          targetX = 1.08;
          targetY = 1.14;
          break;
        case 'big-mouth':
          targetX = 1.18;
          targetY = 1.1;
          break;
        case 'alien':
          targetX = 0.9;
          targetY = 1.18;
          break;
        default:
          targetX = 1;
          targetY = 1;
          break;
      }

      Animated.parallel([
        Animated.spring(scaleXAnim, {
          toValue: targetX,
          tension: 120,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.spring(scaleYAnim, {
          toValue: targetY,
          tension: 120,
          friction: 11,
          useNativeDriver: true,
        }),
      ]).start();
    }, [activeLens.id, scaleXAnim, scaleYAnim]);

    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    useImperativeHandle(ref, () => ({
      takePictureAsync: async (): Promise<CapturedMedia | null> => {
        if (!cameraRef.current) return null;
        try {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.95,
            skipProcessing: false,
          });

          if (!photo || !photo.uri) return null;

          return {
            id: `photo_${Date.now()}`,
            type: 'photo',
            uri: photo.uri,
            width: photo.width,
            height: photo.height,
            timestamp: Date.now(),
            lensId: activeLens.id,
            lensName: activeLens.name,
          };
        } catch (err) {
          console.error('takePictureAsync error:', err);
          return null;
        }
      },

      startRecordingAsync: async () => {
        if (!cameraRef.current || isRecordingRef.current) return;
        isRecordingRef.current = true;
        try {
          recordPromiseRef.current = cameraRef.current.recordAsync({
            maxDuration: 60,
          });
        } catch (err) {
          console.error('startRecordingAsync failed:', err);
          isRecordingRef.current = false;
          recordPromiseRef.current = null;
        }
      },

      stopRecordingAsync: async (): Promise<CapturedMedia | null> => {
        if (!cameraRef.current || !isRecordingRef.current) return null;
        try {
          isRecordingRef.current = false;
          cameraRef.current.stopRecording();
          const recorded = await recordPromiseRef.current;
          recordPromiseRef.current = null;

          if (!recorded || !recorded.uri) return null;

          return {
            id: `video_${Date.now()}`,
            type: 'video',
            uri: recorded.uri,
            timestamp: Date.now(),
            lensId: activeLens.id,
            lensName: activeLens.name,
          };
        } catch (err) {
          console.error('stopRecordingAsync error:', err);
          recordPromiseRef.current = null;
          return null;
        }
      },
    }));

    return (
      <View style={[styles.container, style]} onLayout={handleLayout}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              transform: [{ scaleX: scaleXAnim }, { scaleY: scaleYAnim }],
            },
          ]}
        >
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
            mode={mode === 'photo' ? 'picture' : 'video'}
            onCameraReady={onCameraReady}
            onMountError={(error) => onMountError?.(error.message)}
            animateShutter={false}
          />
        </Animated.View>

        {dimensions.width > 0 && dimensions.height > 0 && (
          <LensRenderer
            lens={activeLens}
            width={dimensions.width}
            height={dimensions.height}
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
});
