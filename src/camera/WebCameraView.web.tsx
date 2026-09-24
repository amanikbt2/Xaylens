import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';
import { Colors } from '../constants/colors';

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(({
  facing,
  flash,
  mode,
  activeLens,
  onCameraReady,
  onMountError,
  style,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef(false);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle container layout for responsive dimensions
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setDimensions({ width, height });
    }
  };

  // Start or switch camera stream
  const initWebCamera = useCallback(async () => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported in this browser.');
      }

      // Stop existing tracks if switching facing
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }

      const facingMode = facing === 'front' ? 'user' : 'environment';
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }

      setHasPermission(true);
      setErrorMsg(null);
      onCameraReady?.();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to access web camera.';
      setErrorMsg(msg);
      setHasPermission(false);
      onMountError?.(msg);
    }
  }, [facing, onCameraReady, onMountError]);

  useEffect(() => {
    initWebCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, [initWebCamera]);

  useImperativeHandle(ref, () => ({
    takePictureAsync: async (): Promise<CapturedMedia | null> => {
      if (!videoRef.current) return null;
      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        const w = video.videoWidth || 1280;
        const h = video.videoHeight || 720;
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        // Flash simulation
        if (flash === 'on') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
        }

        // Mirror front camera
        if (facing === 'front') {
          ctx.translate(w, 0);
          ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

        return {
          id: `photo_web_${Date.now()}`,
          type: 'photo',
          uri: dataUrl,
          width: w,
          height: h,
          timestamp: Date.now(),
          lensId: activeLens.id,
          lensName: activeLens.name,
        };
      } catch (err) {
        console.error('Web photo capture error:', err);
        return null;
      }
    },

    startRecordingAsync: async () => {
      if (!streamRef.current || isRecordingRef.current) return;
      try {
        recordedChunksRef.current = [];
        const options: MediaRecorderOptions = { mimeType: 'video/webm;codecs=vp9,opus' };
        let recorder: MediaRecorder;

        try {
          recorder = new MediaRecorder(streamRef.current, options);
        } catch {
          // Fallback mimeType
          recorder = new MediaRecorder(streamRef.current);
        }

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        recorder.start(100);
        mediaRecorderRef.current = recorder;
        isRecordingRef.current = true;
      } catch (err) {
        console.error('Web video start recording error:', err);
      }
    },

    stopRecordingAsync: async (): Promise<CapturedMedia | null> => {
      if (!mediaRecorderRef.current || !isRecordingRef.current) return null;

      return new Promise((resolve) => {
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
          resolve(null);
          return;
        }

        recorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const videoUrl = URL.createObjectURL(blob);
          isRecordingRef.current = false;

          resolve({
            id: `video_web_${Date.now()}`,
            type: 'video',
            uri: videoUrl,
            timestamp: Date.now(),
            lensId: activeLens.id,
            lensName: activeLens.name,
          });
        };

        recorder.stop();
      });
    },
  }));

  return (
    <View style={[styles.container, style]} onLayout={handleLayout}>
      {/* HTML5 video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: facing === 'front' ? 'scaleX(-1)' : 'none',
          backgroundColor: '#09090b',
        }}
      />

      {/* Permission or hardware error fallback */}
      {hasPermission === false && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorTitle}>Web Camera Access Required</Text>
          <Text style={styles.errorText}>
            {errorMsg || 'Please allow camera permission in your browser to test XayLens.'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={initWebCamera}>
            <Text style={styles.retryBtnText}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Real-time Lens overlay on Web */}
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
    position: 'relative',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(9, 9, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    zIndex: 10,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  retryBtnText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 15,
  },
});
