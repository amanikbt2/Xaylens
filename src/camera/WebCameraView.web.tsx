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
  ActivityIndicator,
} from 'react-native';
import { CameraViewProps, CameraViewRef } from './cameraTypes';
import { CapturedMedia } from '../types/camera';
import { LensRenderer } from '../effects/LensRenderer';
import { Colors } from '../constants/colors';
import {
  VERTEX_SHADER_SOURCE,
  FRAGMENT_SHADER_SOURCE,
  getCustomLensDistortion,
  getLensShaderMode,
  WebVideoFaceDetector,
} from '../effects/webglFaceShader';
import { drawOverlayToCanvas2D } from '../effects/canvasOverlayRenderer';
import { FaceTracker } from '../effects/faceTracker';
import { DEFAULT_LANDMARKS } from '../effects/effectTypes';
import { FaceLandmarks } from '../types/lens';
import { WebBackgroundReplacement } from './WebBackgroundReplacement.web';

const getSupportedRecorderMimeType = (): string => {
  if (typeof MediaRecorder === 'undefined') return '';

  // Prefer broadly playable H.264/AAC MP4 when the browser exposes it.
  // Chromium commonly does not, so keep WebM as a real (not mislabeled)
  // fallback rather than changing the file extension after recording.
  const candidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
  ];

  return candidates.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

export const PlatformCameraView = forwardRef<CameraViewRef, CameraViewProps>(
  ({ facing, flash, activeLens, comboLenses, active = true, backgroundVideoPaused = false, backgroundVideoAudioEnabled = false, backgroundVideoRestartToken = 0, onCameraReady, onMountError, onFaceStatusChange, style }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const compCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const backgroundCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const backgroundVideoElementRef = useRef<HTMLVideoElement | null>(null);
    const backgroundAudioGraphRef = useRef<{
      context: AudioContext;
      destination: MediaStreamAudioDestinationNode;
      micGain: GainNode;
      videoGain: GainNode;
      video: HTMLVideoElement;
    } | null>(null);
    const backgroundVideoAudioEnabledRef = useRef(backgroundVideoAudioEnabled);
    backgroundVideoAudioEnabledRef.current = backgroundVideoAudioEnabled;
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const recordingMimeTypeRef = useRef('video/webm');
    const isRecordingRef = useRef(false);

    const onFaceStatusChangeRef = useRef(onFaceStatusChange);
    onFaceStatusChangeRef.current = onFaceStatusChange;

    const activeRef = useRef(active);
    activeRef.current = active;

    const activeLensRef = useRef(activeLens);
    activeLensRef.current = activeLens;

    const comboLensesRef = useRef(comboLenses);
    comboLensesRef.current = comboLenses;

    const activeLensIdRef = useRef(activeLens.id);
    activeLensIdRef.current = activeLens.id;

    const backgroundLens = [...(comboLenses || []), activeLens]
      .filter((lens) => lens.config.background?.removeBackground)
      .slice(-1)[0] || null;
    const isBackgroundLens = Boolean(backgroundLens);
    const hasFaceLens = [...(comboLenses || []), activeLens].some(
      (lens) =>
        lens.id !== 'normal' && !lens.config.background?.removeBackground
    );
    const skipHiddenBackgroundWebGL = isBackgroundLens && !hasFaceLens;
    const isBackgroundLensRef = useRef(isBackgroundLens);
    const skipHiddenBackgroundWebGLRef = useRef(skipHiddenBackgroundWebGL);
    isBackgroundLensRef.current = isBackgroundLens;
    skipHiddenBackgroundWebGLRef.current = skipHiddenBackgroundWebGL;

    const facingRef = useRef(facing);
    facingRef.current = facing;

    const syncBackgroundAudio = useCallback(() => {
      const graph = backgroundAudioGraphRef.current;
      const video = backgroundVideoElementRef.current;
      const videoAudioEnabled = backgroundVideoAudioEnabledRef.current;
      if (video) video.muted = !videoAudioEnabled;
      if (graph) {
        graph.micGain.gain.value = videoAudioEnabled ? 0 : 1;
        graph.videoGain.gain.value = videoAudioEnabled ? 1 : 0;
      }
      streamRef.current?.getAudioTracks().forEach((track) => {
        track.enabled = !videoAudioEnabled;
      });
    }, []);

    useEffect(() => {
      syncBackgroundAudio();
    }, [backgroundVideoAudioEnabled, syncBackgroundAudio]);

    const handleBackgroundVideoElement = useCallback(
      (video: HTMLVideoElement | null) => {
        backgroundVideoElementRef.current = video;
        syncBackgroundAudio();
      },
      [syncBackgroundAudio]
    );

    const trackerRef = useRef(new FaceTracker());
    const detectorRef = useRef<WebVideoFaceDetector | null>(null);

    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [liveLandmarks, setLiveLandmarks] =
      useState<FaceLandmarks>(DEFAULT_LANDMARKS);
    const [backgroundReady, setBackgroundReady] = useState(false);
    const [backgroundLoading, setBackgroundLoading] = useState(false);
    const handleLayout = (e: LayoutChangeEvent) => {
      const { width, height } = e.nativeEvent.layout;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    };

    const stopWebCamera = useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
    }, []);

    const initWebCamera = useCallback(async () => {
      try {
        if (
          typeof navigator === 'undefined' ||
          !navigator.mediaDevices?.getUserMedia
        ) {
          throw new Error('Camera API is not supported in this browser.');
        }

        stopWebCamera();

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
    }, [facing, onCameraReady, onMountError, stopWebCamera]);

    useEffect(() => {
      if (active) {
        initWebCamera();
      } else {
        stopWebCamera();
      }
      return () => {
        stopWebCamera();
      };
    }, [active, initWebCamera, stopWebCamera]);

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
      const uVideoResolution = gl.getUniformLocation(program, 'u_videoResolution');
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
      const uCustomDistortion = gl.getUniformLocation(program, 'u_customDistortion');
      const uCustomCenter = gl.getUniformLocation(program, 'u_customCenter');

      let animId: number;
      let lastFrameTime = performance.now();
      let lastDetectTime = 0;
      let lastOverlaySyncTime = 0;
      const startTime = performance.now();

      const renderFrame = (now: number) => {
        const dt = Math.min(now - lastFrameTime, 60);
        lastFrameTime = now;

        // A background-only lens is already rendered by the segmentation
        // canvas, so avoid face detection and hidden WebGL work in that mode.
        if (skipHiddenBackgroundWebGLRef.current) {
          animId = requestAnimationFrame(renderFrame);
          return;
        }

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
        const sourceLm = state.landmarks;

        if (now - lastOverlaySyncTime > 32) {
          lastOverlaySyncTime = now;
          const viewWidth = canvas.clientWidth || 720;
          const viewHeight = canvas.clientHeight || 1280;
          const sourceAspect = video.videoWidth / Math.max(video.videoHeight, 1);
          const viewAspect = viewWidth / Math.max(viewHeight, 1);
          const cropWidth = sourceAspect > viewAspect ? viewAspect / sourceAspect : 1;
          const cropHeight = sourceAspect > viewAspect ? 1 : sourceAspect / viewAspect;
          const toViewPoint = (point: { x: number; y: number }) => ({
            x: (point.x - (1 - cropWidth) / 2) / cropWidth,
            y: (point.y - (1 - cropHeight) / 2) / cropHeight,
          });
          const lm = {
            ...sourceLm,
            nose: toViewPoint(sourceLm.nose),
            leftEye: toViewPoint(sourceLm.leftEye),
            rightEye: toViewPoint(sourceLm.rightEye),
            mouth: toViewPoint(sourceLm.mouth),
            forehead: toViewPoint(sourceLm.forehead),
            chin: toViewPoint(sourceLm.chin),
            leftEar: toViewPoint(sourceLm.leftEar),
            rightEar: toViewPoint(sourceLm.rightEar),
            faceWidth: sourceLm.faceWidth / cropWidth,
            faceHeight: sourceLm.faceHeight / cropHeight,
          };
          setLiveLandmarks(lm);
          if (onFaceStatusChangeRef.current) {
            onFaceStatusChangeRef.current({
              quality: state.quality,
              lightingStatus: state.lightingStatus,
              hasFace: state.hasFace,
              faceWidth: lm.faceWidth,
              detectorStatus: detectorRef.current?.getStatus(),
            });
          }
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

          const sourceAspect = video.videoWidth / Math.max(video.videoHeight, 1);
          const viewAspect = pixelW / Math.max(pixelH, 1);
          const cropWidth = sourceAspect > viewAspect ? viewAspect / sourceAspect : 1;
          const cropHeight = sourceAspect > viewAspect ? 1 : sourceAspect / viewAspect;
          const toViewPoint = (point: { x: number; y: number }) => ({
            x: (point.x - (1 - cropWidth) / 2) / cropWidth,
            y: (point.y - (1 - cropHeight) / 2) / cropHeight,
          });
          const lm = {
            ...sourceLm,
            nose: toViewPoint(sourceLm.nose),
            leftEye: toViewPoint(sourceLm.leftEye),
            rightEye: toViewPoint(sourceLm.rightEye),
            mouth: toViewPoint(sourceLm.mouth),
            forehead: toViewPoint(sourceLm.forehead),
            chin: toViewPoint(sourceLm.chin),
            faceWidth: sourceLm.faceWidth / cropWidth,
            faceHeight: sourceLm.faceHeight / cropHeight,
          };
          gl.uniform2f(uResolution, pixelW, pixelH);
          gl.uniform2f(uVideoResolution, video.videoWidth, video.videoHeight);
          gl.uniform1f(uMirror, facingRef.current === 'front' ? 1.0 : 0.0);
          const selectedLenses = comboLensesRef.current && comboLensesRef.current.length > 0
            ? comboLensesRef.current
            : activeLensRef.current;
          gl.uniform1i(
            uLensMode,
            state.hasFace
              ? getLensShaderMode(selectedLenses)
              : 0
          );
          gl.uniform2f(uNose, lm.nose.x, lm.nose.y);
          gl.uniform2f(uLeftEye, lm.leftEye.x, lm.leftEye.y);
          gl.uniform2f(uRightEye, lm.rightEye.x, lm.rightEye.y);
          gl.uniform2f(uMouth, lm.mouth.x, lm.mouth.y);
          gl.uniform2f(uForehead, lm.forehead.x, lm.forehead.y);
          gl.uniform2f(uChin, lm.chin.x, lm.chin.y);
          gl.uniform1f(uFaceScale, (lm.faceWidth || 0.35) / 0.32);
          gl.uniform1f(uRoll, ((lm.roll || 0) * Math.PI) / 180.0);
          gl.uniform1f(uTime, (now - startTime) * 0.001);
          const customDistortion = getCustomLensDistortion(selectedLenses, lm);
          gl.uniform4f(uCustomDistortion, ...customDistortion.params);
          gl.uniform2f(uCustomCenter, customDistortion.center.x, customDistortion.center.y);

          gl.drawArrays(gl.TRIANGLES, 0, 6);

          const compCanvas = compCanvasRef.current;
          if (compCanvas) {
            const compCtx = compCanvas.getContext('2d');
            if (compCtx) {
              if (compCanvas.width !== pixelW || compCanvas.height !== pixelH) {
                compCanvas.width = pixelW;
                compCanvas.height = pixelH;
              }
              compCtx.drawImage(canvas, 0, 0);
              drawOverlayToCanvas2D(
                compCtx,
                comboLensesRef.current && comboLensesRef.current.length > 0
                  ? comboLensesRef.current
                  : activeLensRef.current,
                pixelW,
                pixelH,
                lm,
                now
              );
            }
          }
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
        const canvas =
          isBackgroundLensRef.current
            ? backgroundCanvasRef.current || compCanvasRef.current || glCanvasRef.current
            : compCanvasRef.current || glCanvasRef.current;
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

          // Record directly from the composited canvas stream (+ microphone audio)
          let recordStream: MediaStream | null = null;
          const targetCanvas =
            isBackgroundLensRef.current
              ? backgroundCanvasRef.current || compCanvasRef.current || glCanvasRef.current
              : compCanvasRef.current || glCanvasRef.current;
          if (
            targetCanvas &&
            typeof targetCanvas.captureStream === 'function'
          ) {
            recordStream = targetCanvas.captureStream(30);
            if (streamRef.current) {
              const microphoneTracks = streamRef.current.getAudioTracks();
              const backgroundVideo = backgroundVideoElementRef.current;
              const AudioContextConstructor =
                window.AudioContext || (window as any).webkitAudioContext;

              if (backgroundVideo && AudioContextConstructor) {
                let graph = backgroundAudioGraphRef.current;
                if (!graph || graph.video !== backgroundVideo) {
                  const context = new AudioContextConstructor();
                  const destination = context.createMediaStreamDestination();
                  const micSource = context.createMediaStreamSource(new MediaStream(microphoneTracks));
                  const micGain = context.createGain();
                  const videoSource = context.createMediaElementSource(backgroundVideo);
                  const videoGain = context.createGain();
                  micSource.connect(micGain).connect(destination);
                  videoSource.connect(videoGain);
                  videoGain.connect(destination);
                  videoGain.connect(context.destination);
                  graph = { context, destination, micGain, videoGain, video: backgroundVideo };
                  backgroundAudioGraphRef.current = graph;
                }
                await graph.context.resume();
                syncBackgroundAudio();
                graph.destination.stream.getAudioTracks().forEach((audioTrack) => {
                  recordStream?.addTrack(audioTrack);
                });
              } else {
                microphoneTracks.forEach((audioTrack) => {
                  recordStream?.addTrack(audioTrack);
                });
              }
            }
          } else {
            recordStream = streamRef.current;
          }

          if (!recordStream) return;

          const preferredMimeType = getSupportedRecorderMimeType();
          let recorder: MediaRecorder;

          try {
            recorder = preferredMimeType
              ? new MediaRecorder(recordStream, { mimeType: preferredMimeType })
              : new MediaRecorder(recordStream);
          } catch {
            recorder = new MediaRecorder(recordStream);
          }

          recordingMimeTypeRef.current =
            recorder.mimeType || preferredMimeType || 'video/webm';

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
          const canvas =
            isBackgroundLensRef.current
              ? backgroundCanvasRef.current || compCanvasRef.current || glCanvasRef.current
              : compCanvasRef.current || glCanvasRef.current;
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
              mimeType: blob.type || recordingMimeTypeRef.current,
              timestamp: Date.now(),
              lensId: activeLens.id,
              lensName: activeLens.name,
            });
          };

          const timeoutId = setTimeout(() => {
            const blob = new Blob(recordedChunksRef.current, {
              type: recordingMimeTypeRef.current,
            });
            finish(blob);
          }, 600);

          recorder.onstop = () => {
            clearTimeout(timeoutId);
            const blob = new Blob(recordedChunksRef.current, {
              type: recordingMimeTypeRef.current,
            });
            finish(blob);
          };

          try {
            if (recorder.state === 'recording') {
              recorder.stop();
            } else {
              const blob = new Blob(recordedChunksRef.current, {
                type: recordingMimeTypeRef.current,
              });
              finish(blob);
            }
          } catch {
            const blob = new Blob(recordedChunksRef.current, {
              type: recordingMimeTypeRef.current,
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
            opacity: isBackgroundLens && backgroundReady ? 0 : 1,
          }}
        />

        {/* Offscreen Composited Canvas for Video Recording & Photo Capture */}
        <canvas
          ref={compCanvasRef}
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />

        <WebBackgroundReplacement
          videoRef={videoRef}
          sourceCanvasRef={hasFaceLens ? glCanvasRef : undefined}
          mirrored={facing === 'front'}
          outputCanvasRef={backgroundCanvasRef}
          lens={backgroundLens || activeLens}
          width={dimensions.width}
          height={dimensions.height}
          enabled={isBackgroundLens}
          backgroundVideoPaused={backgroundVideoPaused}
          backgroundVideoAudioEnabled={backgroundVideoAudioEnabled}
          backgroundVideoRestartToken={backgroundVideoRestartToken}
          onVideoElement={handleBackgroundVideoElement}
          onReady={setBackgroundReady}
          onLoadingChange={setBackgroundLoading}
        />

        {backgroundLoading && (
          <View style={styles.lensLoadingOverlay} pointerEvents="none">
            <View style={styles.lensLoadingCard}>
              <ActivityIndicator size="small" color="#facc15" />
              <Text style={styles.lensLoadingText}>Loading lens…</Text>
            </View>
          </View>
        )}

        {/* Front flash screen illumination */}
        {facing === 'front' && flash === 'on' && (
          <View style={[styles.frontFlashOverlay, { pointerEvents: 'none' }]} />
        )}

        {/* Permission or hardware error fallback */}
        {hasPermission === false && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorTitle}>Web Camera Access Required</Text>
            <Text style={styles.errorText}>
              {errorMsg ||
                'Please allow camera permission in your browser to test Xaylens.'}
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
            comboLenses={comboLenses}
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
    backgroundColor: 'rgba(255, 252, 235, 0.10)',
    borderWidth: 18,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  lensLoadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  lensLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(9, 9, 11, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.55)',
  },
  lensLoadingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
