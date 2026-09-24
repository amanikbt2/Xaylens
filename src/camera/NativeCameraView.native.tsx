import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, LayoutChangeEvent } from 'react-native';
import { CameraView } from 'expo-camera';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(({
  facing,
  flash,
  mode,
  activeLens,
  onCameraReady,
  onMountError,
  style,
}, ref) => {
  const cameraRef = useRef<CameraView>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const isRecordingRef = useRef(false);

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
        // Starts video recording in background
        cameraRef.current.recordAsync({
          maxDuration: 60,
        }).catch((err: unknown) => {
          console.error('recordAsync error:', err);
          isRecordingRef.current = false;
        });
      } catch (err) {
        console.error('startRecordingAsync failed:', err);
        isRecordingRef.current = false;
      }
    },

    stopRecordingAsync: async (): Promise<CapturedMedia | null> => {
      if (!cameraRef.current || !isRecordingRef.current) return null;
      try {
        isRecordingRef.current = false;
        cameraRef.current.stopRecording();
        return {
          id: `video_${Date.now()}`,
          type: 'video',
          uri: '',
          timestamp: Date.now(),
          lensId: activeLens.id,
          lensName: activeLens.name,
        };
      } catch (err) {
        console.error('stopRecordingAsync error:', err);
        return null;
      }
    },
  }));

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode={mode === 'photo' ? 'picture' : 'video'}
        onCameraReady={onCameraReady}
        onMountError={(error) => onMountError?.(error.message)}
        animateShutter={true}
      />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <LensRenderer
          lens={activeLens}
          width={dimensions.width}
          height={dimensions.height}
        />
      )}
    </View>
  );
});

PlatformCameraView.displayName = 'PlatformCameraView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
});
