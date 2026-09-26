import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  LayoutChangeEvent,
} from 'react-native';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';
import { Colors } from '../constants/colors';
import {
  VERTEX_SHADER_SOURCE,
  FRAGMENT_SHADER_SOURCE,
  getLensShaderMode,
  WebVideoFaceDetector,
} from '../effects/webglFaceShader';
import { FaceTracker } from '../effects/faceTracker';
import { DEFAULT_LANDMARKS } from '../effects/effectTypes';
import { FaceLandmarks } from '../types/lens';

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(
  ({ facing, flash, activeLens, onCameraReady, onMountError, style }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const isRecordingRef = useRef(false);

    const activeLensIdRef = useRef(activeLens.id);
    activeLensIdRef.current = activeLens.id;

    const facingRef = useRef(facing);
    facingRef.current = facing;

    const trackerRef = useRef(new FaceTracker());
    const detectorRef = useRef<WebVideoFaceDetector | null>(null);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [liveLandmarks, setLiveLandmarks] =
      useState<FaceLandmarks>(DEFAULT_LANDMARKS);

    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    const initWebCamera = useCallback(async () => {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error('Camera API is not supported in this browser.');
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
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
        const msg =
          err instanceof Error ? err.message : 'Unable to access web camera.';
        setErrorMsg(msg);
        setHasPermission(false);
        onMountError?.(msg);
      }
    }, [facing, onCameraReady, onMountError]);

    useEffect(() => {
      initWebCamera();
      return () => {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }
      };
    }, [initWebCamera]);

    // Real-time 60fps WebGL Face-Distortion & Pixel-Magnification Pipeline
    useEffect(() => {
      const canvas = glCanvasRef.current;
      const video = videoRef.current;
      if (!canvas || !video) return;

      if (!detectorRef.current) {
        detectorRef.current = new WebVideoFaceDetector();
      }

      const gl =
        canvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
        (canvas.getContext('experimental-webgl', {
          preserveDrawingBuffer: true,
        }) as WebGLRenderingContext | null);

      if (!gl) return;

      const compileShader = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
      const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
      if (!vs || !fs) return;

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

      gl.useProgram(program);

      // Fullscreen quad
      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Video frame texture
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

      const uResolution = gl.getUniformLocation(program, 'u_resolution');
      const uMirror = gl.getUniformLocation(program, 'u_mirror');
      const uLensMode = gl.getUniformLocation(program, 'u_lensMode');
      const uNose = gl.getUniformLocation(program, 'u_nose');
      const uLeftEye = gl.getUniformLocation(program, 'u_leftEye');
      const uRightEye = gl.getUniformLocation(program, 'u_rightEye');
      const uMouth = gl.getUniformLocation(program, 'u_mouth');
      const uForehead = gl.getUniformLocation(program, 'u_forehead');
      const uChin = gl.getUniformLocation(program, 'u_chin');
      const uFaceScale = gl.getUniformLocation(program, 'u_faceScale');
      const uRoll = gl.getUniformLocation(program, 'u_roll');
      const uTime = gl.getUniformLocation(program, 'u_time');

      let animId: number;
      let lastFrameTime = performance.now();
      let lastDetectTime = 0;
      let lastOverlaySyncTime = 0;
      const startTime = performance.now();

      const renderFrame = (now: number) => {
        const dt = Math.min(now - lastFrameTime, 60);
        lastFrameTime = now;

        // Detect real face & upper-body coordinates from video stream (~28fps)
        if (
          now - lastDetectTime > 35 &&
          video.readyState >= 2 &&
          detectorRef.current
        ) {
          lastDetectTime = now;
          detectorRef.current
            .detectFromVideo(video, facingRef.current === 'front')
            .then((detected) => {
              if (detected) {
                trackerRef.current.updateFromDetector(detected);
              }
            })
            .catch(() => {});
        }

        const state = trackerRef.current.step(dt);
        const lm = state.landmarks;

        if (now - lastOverlaySyncTime > 32) {
          lastOverlaySyncTime = now;
          setLiveLandmarks({ ...lm });
        }

        if (video.readyState >= 2 && video.videoWidth > 0) {
          const targetW = canvas.clientWidth || 720;
          const targetH = canvas.clientHeight || 1280;
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const pixelW = Math.round(targetW * dpr);
          const pixelH = Math.round(targetH * dpr);

          if (canvas.width !== pixelW || canvas.height !== pixelH) {
            canvas.width = pixelW;
            canvas.height = pixelH;
            gl.viewport(0, 0, pixelW, pixelH);
          }

          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            video
          );

          gl.uniform2f(uResolution, pixelW, pixelH);
          gl.uniform1f(uMirror, facingRef.current === 'front' ? 1.0 : 0.0);
          gl.uniform1i(uLensMode, getLensShaderMode(activeLensIdRef.current));
          gl.uniform2f(uNose, lm.nose.x, lm.nose.y);
          gl.uniform2f(uLeftEye, lm.leftEye.x, lm.leftEye.y);
          gl.uniform2f(uRightEye, lm.rightEye.x, lm.rightEye.y);
          gl.uniform2f(uMouth, lm.mouth.x, lm.mouth.y);
          gl.uniform2f(uForehead, lm.forehead.x, lm.forehead.y);
          gl.uniform2f(uChin, lm.chin.x, lm.chin.y);
          gl.uniform1f(uFaceScale, (lm.faceWidth || 0.35) / 0.32);
          gl.uniform1f(uRoll, ((lm.roll || 0) * Math.PI) / 180.0);
          gl.uniform1f(uTime, (now - startTime) * 0.001);

          gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        animId = requestAnimationFrame(renderFrame);
      };

      animId = requestAnimationFrame(renderFrame);

      return () => {
        cancelAnimationFrame(animId);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      takePictureAsync: async (): Promise<CapturedMedia | null> => {
        const canvas = glCanvasRef.current;
        if (!canvas) return null;
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          return {
            id: `photo_web_${Date.now()}`,
            type: 'photo',
            uri: dataUrl,
            width: canvas.width,
            height: canvas.height,
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
        if (isRecordingRef.current) return;
        try {
          recordedChunksRef.current = [];

          // Record directly from the WebGL warped canvas stream (+ microphone audio)
          let recordStream: MediaStream | null = null;
          if (
            glCanvasRef.current &&
            typeof glCanvasRef.current.captureStream === 'function'
          ) {
            recordStream = glCanvasRef.current.captureStream(30);
            if (streamRef.current) {
              streamRef.current.getAudioTracks().forEach((audioTrack) => {
                recordStream?.addTrack(audioTrack);
              });
            }
          } else {
            recordStream = streamRef.current;
          }

          if (!recordStream) return;

          const options: MediaRecorderOptions = {
            mimeType: 'video/webm;codecs=vp9,opus',
          };
          let recorder: MediaRecorder;

          try {
            recorder = new MediaRecorder(recordStream, options);
          } catch {
            recorder = new MediaRecorder(recordStream);
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

      pauseRecordingAsync: async () => {
        try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
          }
        } catch (err) {
          console.error('Web video pause error:', err);
        }
      },

      resumeRecordingAsync: async () => {
        try {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
          }
        } catch (err) {
          console.error('Web video resume error:', err);
        }
      },

      stopRecordingAsync: async (): Promise<CapturedMedia | null> => {
        isRecordingRef.current = false;
        const recorder = mediaRecorderRef.current;
        if (!recorder) {
          const canvas = glCanvasRef.current;
          if (canvas) {
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            return {
              id: `video_web_${Date.now()}`,
              type: 'video',
              uri: dataUrl,
              timestamp: Date.now(),
              lensId: activeLens.id,
              lensName: activeLens.name,
            };
          }
          return null;
        }

        return new Promise((resolve) => {
          let hasResolved = false;
          const finish = (blob: Blob) => {
            if (hasResolved) return;
            hasResolved = true;
            const videoUrl = URL.createObjectURL(blob);
            resolve({
              id: `video_web_${Date.now()}`,
              type: 'video',
              uri: videoUrl,
              timestamp: Date.now(),
              lensId: activeLens.id,
              lensName: activeLens.name,
            });
          };

          const timeoutId = setTimeout(() => {
            const blob = new Blob(recordedChunksRef.current, {
              type: 'video/webm',
            });
            finish(blob);
          }, 600);

          recorder.onstop = () => {
            clearTimeout(timeoutId);
            const blob = new Blob(recordedChunksRef.current, {
              type: 'video/webm',
            });
            finish(blob);
          };

          try {
            if (recorder.state === 'recording') {
              recorder.stop();
            } else {
              const blob = new Blob(recordedChunksRef.current, {
                type: 'video/webm',
              });
              finish(blob);
            }
          } catch {
            const blob = new Blob(recordedChunksRef.current, {
              type: 'video/webm',
            });
            finish(blob);
          }
        });
      },
    }));

    return (
      <View style={[styles.container, style]} onLayout={handleLayout}>
        {/* Hidden source video element feeding the 60fps WebGL distortion shader */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        {/* Real-Time 60fps WebGL Warped Camera Canvas */}
        <canvas
          ref={glCanvasRef}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#09090b',
          }}
        />

        {/* Front flash screen illumination */}
        {flash === 'on' && (
          <View style={[styles.frontFlashOverlay, { pointerEvents: 'none' }]} />
        )}

        {/* Permission or hardware error fallback */}
        {hasPermission === false && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Web Camera Access Required</Text>
            <Text style={styles.errorText}>
              {errorMsg ||
                'Please allow camera permission in your browser to test XayLens.'}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={initWebCamera}>
              <Text style={styles.retryBtnText}>Allow Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 3D AR Overlays (Puppy, Bunny, Funny Glasses, Alien Antennae) following live tracked landmarks */}
        {dimensions.width > 0 && dimensions.height > 0 && (
          <LensRenderer
            lens={activeLens}
            width={dimensions.width}
            height={dimensions.height}
            landmarks={liveLandmarks}
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
    position: 'relative',
  },
  frontFlashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 252, 235, 0.22)',
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
