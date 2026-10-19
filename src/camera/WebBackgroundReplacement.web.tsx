import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Lens } from '../types/lens';

interface WebBackgroundReplacementProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sourceCanvasRef?: React.RefObject<HTMLCanvasElement | null>;
  mirrored?: boolean;
  outputCanvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  lens: Lens;
  width: number;
  height: number;
  enabled: boolean;
  backgroundVideoPaused?: boolean;
  backgroundVideoAudioEnabled?: boolean;
  backgroundVideoRestartToken?: number;
  onVideoElement?: (video: HTMLVideoElement | null) => void;
  onReady: (ready: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type Scene = NonNullable<Lens['config']['background']>['scene'];

const sceneForLens = (lens: Lens): Scene => lens.config.background?.scene || 'forest';

const imageCache: Map<string, HTMLImageElement> = new Map();

const getPreloadedImage = (url: string): HTMLImageElement | null => {
  if (typeof window === 'undefined') return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    if (url.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = url;
    imageCache.set(url, img);
  }
  return img.complete && img.naturalWidth !== 0 ? img : null;
};

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number
) => {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(cw / iw, ch / ih);
  const nw = iw * scale;
  const nh = ih * scale;
  const cx = (cw - nw) / 2;
  const cy = (ch - nh) / 2;
  ctx.drawImage(img, cx, cy, nw, nh);
};

const drawVideoCover = (
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  cw: number,
  ch: number
) => {
  const iw = video.videoWidth || video.clientWidth;
  const ih = video.videoHeight || video.clientHeight;
  if (!iw || !ih) return;
  drawSourceCover(ctx, video, iw, ih, cw, ch);
};

const drawSourceCover = (
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number
) => {
  if (!sourceWidth || !sourceHeight || !targetWidth || !targetHeight) return;

  const sourceAspect = sourceWidth / sourceHeight;
  const targetAspect = targetWidth / targetHeight;
  let sx = 0;
  let sy = 0;
  let sw = sourceWidth;
  let sh = sourceHeight;

  if (sourceAspect > targetAspect) {
    sw = sourceHeight * targetAspect;
    sx = (sourceWidth - sw) / 2;
  } else {
    sh = sourceWidth / targetAspect;
    sy = (sourceHeight - sh) / 2;
  }

  ctx.drawImage(
    source,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    targetWidth,
    targetHeight
  );
};

type ARSceneEffect = NonNullable<
  NonNullable<Lens['config']['background']>['arEffect']
>;

const drawARSceneEffect = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  effect: ARSceneEffect
) => {
  ctx.save();

  if (effect === 'birds') {
    const scale = Math.max(12, width * 0.026);
    ctx.strokeStyle = 'rgba(24, 39, 34, 0.78)';
    ctx.lineWidth = Math.max(1.5, scale * 0.13);
    ctx.lineCap = 'round';
    for (let index = 0; index < 5; index += 1) {
      const progress = (time * 0.000025 + index * 0.23) % 1.2;
      const x = (progress - 0.1) * width;
      const y =
        height * (0.13 + (index % 3) * 0.065) +
        Math.sin(time * 0.0012 + index * 1.7) * height * 0.012;
      const wingLift = Math.sin(time * 0.009 + index * 1.9) * scale * 0.42;
      ctx.beginPath();
      ctx.moveTo(x - scale, y - wingLift);
      ctx.quadraticCurveTo(x - scale * 0.42, y + scale * 0.22, x, y);
      ctx.quadraticCurveTo(x + scale * 0.42, y + scale * 0.22, x + scale, y - wingLift);
      ctx.stroke();
    }
  } else if (effect === 'butterflies') {
    const colors = ['#f472b6', '#a78bfa', '#fbbf24', '#67e8f9'];
    for (let index = 0; index < 6; index += 1) {
      const phase = time * 0.001 + index * 1.13;
      const x = (((time * 0.000012 + index * 0.19) % 1.15) - 0.075) * width;
      const y = height * (0.24 + (index % 4) * 0.15) + Math.sin(phase) * height * 0.035;
      const size = Math.max(5, width * (0.009 + (index % 2) * 0.002));
      const flap = 0.55 + Math.abs(Math.sin(time * 0.012 + index)) * 0.45;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.sin(phase * 0.6) * 0.35);
      ctx.fillStyle = colors[index % colors.length];
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.ellipse(-size * 0.48, 0, size * 0.48, size * flap, -0.35, 0, Math.PI * 2);
      ctx.ellipse(size * 0.48, 0, size * 0.48, size * flap, 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.9;
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = Math.max(1, size * 0.12);
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.35);
      ctx.lineTo(0, size * 0.42);
      ctx.stroke();
      ctx.restore();
    }
  } else if (effect === 'fireflies') {
    for (let index = 0; index < 22; index += 1) {
      const phase = time * (0.0005 + (index % 4) * 0.00012) + index * 2.1;
      const x = ((index * 0.173 + Math.sin(phase) * 0.035 + 1) % 1) * width;
      const y = ((index * 0.317 + Math.cos(phase * 0.8) * 0.045 + 1) % 1) * height;
      const pulse = 0.35 + (Math.sin(phase * 2) + 1) * 0.3;
      const radius = Math.max(1.5, width * 0.003);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = Math.min(1, pulse + 0.25);
      ctx.fillStyle = '#fff7cc';
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const colors = ['rgba(251, 113, 133, 0.88)', 'rgba(244, 114, 182, 0.84)', 'rgba(255, 228, 230, 0.9)'];
    for (let index = 0; index < 18; index += 1) {
      const phase = time * 0.00022 + index * 0.31;
      const progress = (time * (0.000035 + (index % 4) * 0.000008) + index * 0.137) % 1;
      const x = ((index * 0.271 + Math.sin(phase) * 0.12 + 1) % 1) * width;
      const y = progress * height - height * 0.08;
      const size = Math.max(3, width * (0.004 + (index % 3) * 0.001));
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(phase + progress * 4);
      ctx.fillStyle = colors[index % colors.length];
      ctx.globalAlpha = 0.72;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.7, size * 1.35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
};

const drawScene = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  time: number,
  customVideo?: HTMLVideoElement,
  customImageUri?: string,
  arEffect?: ARSceneEffect
) => {
  const drift = Math.sin(time * 0.00025) * width * 0.04;
  // Preset backgrounds are drawn locally so using a lens never requires a
  // remote image request. User-picked images remain local browser assets.
  const imageUrl = customImageUri;
  const realImg = imageUrl ? getPreloadedImage(imageUrl) : null;

  if (customVideo) {
    drawVideoCover(ctx, customVideo, width, height);
  } else if (realImg) {
    drawImageCover(ctx, realImg, width, height);
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    if (scene === 'office') {
      sky.addColorStop(0, '#1e293b');
      sky.addColorStop(0.5, '#334155');
      sky.addColorStop(1, '#0f172a');
    } else if (scene === 'park') {
      sky.addColorStop(0, '#052e16');
      sky.addColorStop(0.5, '#15803d');
      sky.addColorStop(1, '#022c22');
    } else if (scene === 'car') {
      sky.addColorStop(0, '#09090b');
      sky.addColorStop(0.6, '#18181b');
      sky.addColorStop(1, '#27272a');
    } else if (scene === 'cafe') {
      sky.addColorStop(0, '#451a03');
      sky.addColorStop(0.5, '#78350f');
      sky.addColorStop(1, '#292524');
    } else if (scene === 'gaming') {
      sky.addColorStop(0, '#581c87');
      sky.addColorStop(0.5, '#0284c7');
      sky.addColorStop(1, '#09090b');
    } else if (scene === 'penthouse') {
      sky.addColorStop(0, '#0f172a');
      sky.addColorStop(0.5, '#1e1b4b');
      sky.addColorStop(1, '#020617');
    } else if (scene === 'sunset') {
      sky.addColorStop(0, '#fb7185');
      sky.addColorStop(0.55, '#f97316');
      sky.addColorStop(1, '#431407');
    } else if (scene === 'galaxy') {
      sky.addColorStop(0, '#090514');
      sky.addColorStop(0.5, '#2e1065');
      sky.addColorStop(1, '#020617');
    } else if (scene === 'cyber-alley') {
      sky.addColorStop(0, '#020617');
      sky.addColorStop(0.6, '#1e1b4b');
      sky.addColorStop(1, '#09090b');
    } else if (scene === 'underwater') {
      sky.addColorStop(0, '#0284c7');
      sky.addColorStop(0.6, '#0369a1');
      sky.addColorStop(1, '#082f49');
    } else if (scene === 'volcano') {
      sky.addColorStop(0, '#450a0a');
      sky.addColorStop(0.6, '#7c2d12');
      sky.addColorStop(1, '#1c1917');
    } else if (scene === 'aurora') {
      sky.addColorStop(0, '#022c22');
      sky.addColorStop(0.5, '#064e3b');
      sky.addColorStop(1, '#020617');
    } else if (scene === 'sakura') {
      sky.addColorStop(0, '#fbcfe8');
      sky.addColorStop(0.5, '#f472b6');
      sky.addColorStop(1, '#831843');
    } else if (scene === 'synth-sun') {
      sky.addColorStop(0, '#701a75');
      sky.addColorStop(0.5, '#4c1d95');
      sky.addColorStop(1, '#0f172a');
    } else if (scene === 'studio-pro') {
      sky.addColorStop(0, '#27272a');
      sky.addColorStop(0.6, '#18181b');
      sky.addColorStop(1, '#09090b');
    } else if (scene === 'beach') {
      sky.addColorStop(0, '#38bdf8');
      sky.addColorStop(0.6, '#bae6fd');
      sky.addColorStop(1, '#0e7490');
    } else if (scene === 'mountains') {
      sky.addColorStop(0, '#7dd3fc');
      sky.addColorStop(0.58, '#dbeafe');
      sky.addColorStop(1, '#334155');
    } else if (scene === 'city') {
      sky.addColorStop(0, '#111827');
      sky.addColorStop(0.6, '#312e81');
      sky.addColorStop(1, '#09090b');
    } else if (scene === 'cozy-room') {
      sky.addColorStop(0, '#fef3c7');
      sky.addColorStop(0.55, '#d97706');
      sky.addColorStop(1, '#451a03');
    } else {
      sky.addColorStop(0, '#14532d');
      sky.addColorStop(0.55, '#166534');
      sky.addColorStop(1, '#052e16');
    }

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    if (scene === 'galaxy') {
      ctx.fillStyle = '#ffffff';
      for (let index = 0; index < 30; index += 1) {
        const x = (index * 97 + drift * 3) % width;
        const y = (index * 53) % height;
        ctx.globalAlpha = 0.3 + Math.sin(time * 0.003 + index) * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, (index % 3) + 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(width * 0.8, height * 0.25, width * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(width * 0.8, height * 0.25, width * 0.14, width * 0.03, -0.4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (scene === 'aurora') {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.3);
      ctx.quadraticCurveTo(width * 0.3, height * 0.1, width * 0.6, height * 0.35);
      ctx.quadraticCurveTo(width * 0.85, height * 0.5, width, height * 0.25);
      ctx.lineTo(width, height * 0.55);
      ctx.lineTo(0, height * 0.55);
      ctx.fill();
      ctx.fillStyle = 'rgba(192, 132, 252, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.2);
      ctx.quadraticCurveTo(width * 0.4, height * 0.4, width * 0.75, height * 0.15);
      ctx.lineTo(width, height * 0.4);
      ctx.lineTo(0, height * 0.4);
      ctx.fill();
    } else if (scene === 'synth-sun') {
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.55, width * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      for (let index = 0; index < 8; index += 1) {
        const y = height * (0.6 + index * 0.05);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  }

  // --- SUBTLE REAL-TIME ANIMATED OVERLAY EFFECTS (REALITY & MOTION) ---
  if (scene === 'office') {
    const flare = ctx.createRadialGradient(width * 0.8, height * 0.2, 5, width * 0.8, height * 0.2, width * 0.45);
    flare.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
    flare.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 12; i++) {
      const px = (i * 73 + time * 0.015) % width;
      const py = (i * 41 + Math.sin(time * 0.002 + i) * 20) % height;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === 'park') {
    ctx.fillStyle = 'rgba(250, 204, 21, 0.08)';
    ctx.beginPath();
    ctx.moveTo(width * 0.6, 0);
    ctx.lineTo(width * 0.85, 0);
    ctx.lineTo(width * 0.4, height);
    ctx.lineTo(width * 0.15, height);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    for (let i = 0; i < 14; i++) {
      const lx = (i * 89 + drift * 3) % width;
      const ly = (i * 67 + time * 0.03) % height;
      ctx.globalAlpha = 0.5 + Math.sin(time * 0.003 + i) * 0.3;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 4, 2, Math.sin(time * 0.002 + i), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (scene === 'car') {
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      const streakX = ((time * 0.6 + i * 140) % (width + 300)) - 150;
      const streakY = height * (0.2 + i * 0.12);
      ctx.strokeStyle = i % 2 ? 'rgba(245, 158, 11, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.beginPath();
      ctx.moveTo(streakX, streakY);
      ctx.lineTo(streakX + 90, streakY - 15);
      ctx.stroke();
    }
  } else if (scene === 'cafe') {
    ctx.fillStyle = 'rgba(251, 146, 60, 0.15)';
    for (let i = 0; i < 8; i++) {
      const bx = (i * 113) % width;
      const by = (i * 79 + Math.sin(time * 0.001 + i) * 15) % height;
      const size = 18 + (i % 4) * 12;
      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === 'gaming') {
    const hue = (time * 0.04) % 360;
    ctx.fillStyle = `hsla(${hue}, 90%, 50%, 0.12)`;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = `hsla(${(hue + 120) % 360}, 90%, 60%, 0.2)`;
    ctx.fillRect(width * 0.05, height * 0.1, width * 0.9, 6);
  } else if (scene === 'penthouse') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 20; i++) {
      const px = (i * 57) % width;
      const py = height * 0.45 + ((i * 31) % (height * 0.5));
      ctx.globalAlpha = 0.3 + Math.sin(time * 0.005 + i) * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (arEffect) {
    drawARSceneEffect(ctx, width, height, time, arEffect);
  }
};

let globalSegmenterPromise: Promise<any> | null = null;
let cachedSegmenter: any = null;

const getOrInitSegmenter = async (): Promise<any> => {
  if (cachedSegmenter) return cachedSegmenter;
  if (!globalSegmenterPromise) {
    globalSegmenterPromise = (async () => {
      const runtimeUrl = `${window.location.origin}/mediapipe/vision_bundle.mjs`;
      const vision = await (Function('url', 'return import(url)')(runtimeUrl) as Promise<any>);
      if (!vision?.ImageSegmenter || !vision?.FilesetResolver) return null;
      const fileset = await vision.FilesetResolver.forVisionTasks(
        `${window.location.origin}/mediapipe/wasm`
      );
      const options = (delegate: 'GPU' | 'CPU') => ({
        baseOptions: {
          modelAssetPath: `${window.location.origin}/models/selfie_segmenter.tflite`,
          delegate,
        },
        runningMode: 'VIDEO' as const,
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
      let segmenter;
      try {
        segmenter = await vision.ImageSegmenter.createFromOptions(fileset, options('GPU'));
      } catch {
        segmenter = await vision.ImageSegmenter.createFromOptions(fileset, options('CPU'));
      }
      cachedSegmenter = segmenter;
      return segmenter;
    })().catch((err) => {
      console.warn('Background segmenter init failed:', err);
      globalSegmenterPromise = null;
      return null;
    });
  }
  return globalSegmenterPromise;
};

export const WebBackgroundReplacement: React.FC<WebBackgroundReplacementProps> = ({
  videoRef,
  sourceCanvasRef,
  mirrored = false,
  outputCanvasRef,
  lens,
  width,
  height,
  enabled,
  onReady,
  onLoadingChange,
  backgroundVideoPaused = false,
  backgroundVideoAudioEnabled = false,
  backgroundVideoRestartToken = 0,
  onVideoElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const backgroundVideoPausedRef = useRef(backgroundVideoPaused);
  const backgroundVideoAudioEnabledRef = useRef(backgroundVideoAudioEnabled);
  backgroundVideoPausedRef.current = backgroundVideoPaused;
  backgroundVideoAudioEnabledRef.current = backgroundVideoAudioEnabled;

  useEffect(() => {
    const uri = lens.config.background?.videoUri;
    if (!enabled || !uri || typeof document === 'undefined') {
      backgroundVideoRef.current = null;
      return;
    }

    const video = document.createElement('video');
    video.src = uri;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    backgroundVideoRef.current = video;
    onVideoElement?.(video);
    video.muted = !backgroundVideoAudioEnabledRef.current;
    video.load();
    if (!backgroundVideoPausedRef.current) video.play().catch(() => {});

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      if (backgroundVideoRef.current === video) backgroundVideoRef.current = null;
      onVideoElement?.(null);
    };
  }, [enabled, lens.config.background?.videoUri, onVideoElement]);

  useEffect(() => {
    const video = backgroundVideoRef.current;
    if (!video) return;
    video.muted = !backgroundVideoAudioEnabled;
    if (backgroundVideoPaused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [backgroundVideoAudioEnabled, backgroundVideoPaused]);

  useEffect(() => {
    const video = backgroundVideoRef.current;
    if (!video || !backgroundVideoRestartToken) return;
    video.currentTime = 0;
    video.play().catch(() => {});
  }, [backgroundVideoRestartToken]);

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video || !width || !height) {
      onReady(false);
      onLoadingChange?.(false);
      return;
    }

    let disposed = false;
    let animationId = 0;
    let segmenter: any = null;
    let segmenting = false;
    let readySent = false;
    const output = canvasRef.current;
    const outputContext = output?.getContext('2d');
    const personCanvas = document.createElement('canvas');
    const personContext = personCanvas.getContext('2d');
    const maskCanvas = document.createElement('canvas');
    const maskContext = maskCanvas.getContext('2d');

    if (!output || !outputContext || !personContext || !maskContext) return;

    if (outputCanvasRef) outputCanvasRef.current = output;

    output.width = Math.round(width);
    output.height = Math.round(height);
    personCanvas.width = output.width;
    personCanvas.height = output.height;

    const drawResult = (result: any, time: number) => {
      const mask = result?.confidenceMasks?.[0];
      if (!mask || !personContext || !maskContext || !outputContext) return;

      const maskWidth = mask.width || 256;
      const maskHeight = mask.height || 256;
      const values = mask.getAsFloat32Array?.();
      if (!values) return;

      if (maskCanvas.width !== maskWidth || maskCanvas.height !== maskHeight) {
        maskCanvas.width = maskWidth;
        maskCanvas.height = maskHeight;
      }

      const maskImage = maskContext.createImageData(maskWidth, maskHeight);
      for (let index = 0; index < values.length; index += 1) {
        const alpha = Math.round(Math.max(0, Math.min(1, values[index])) * 255);
        const pixel = index * 4;
        maskImage.data[pixel] = 255;
        maskImage.data[pixel + 1] = 255;
        maskImage.data[pixel + 2] = 255;
        maskImage.data[pixel + 3] = alpha;
      }
      maskContext.putImageData(maskImage, 0, 0);

      outputContext.clearRect(0, 0, output.width, output.height);
      drawScene(
        outputContext,
        output.width,
        output.height,
        sceneForLens(lens),
        time,
        backgroundVideoRef.current && backgroundVideoRef.current.readyState >= 2
          ? backgroundVideoRef.current
          : undefined,
        lens.config.background?.imageUri,
        lens.config.background?.arEffect
      );
      personContext.clearRect(0, 0, personCanvas.width, personCanvas.height);
      personContext.globalCompositeOperation = 'source-over';
      const personSource = sourceCanvasRef?.current;
      const mirrorPerson = mirrored && !personSource;
      if (mirrorPerson) {
        personContext.save();
        personContext.translate(personCanvas.width, 0);
        personContext.scale(-1, 1);
      }
      if (personSource) {
        personContext.drawImage(personSource, 0, 0, personCanvas.width, personCanvas.height);
      } else {
        drawVideoCover(personContext, video, personCanvas.width, personCanvas.height);
      }
      if (mirrorPerson) personContext.restore();
      personContext.globalCompositeOperation = 'destination-in';
      const mirrorMask = mirrored;
      if (mirrorMask) {
        personContext.save();
        personContext.translate(personCanvas.width, 0);
        personContext.scale(-1, 1);
      }
      drawSourceCover(
        personContext,
        maskCanvas,
        maskWidth,
        maskHeight,
        personCanvas.width,
        personCanvas.height
      );
      if (mirrorMask) personContext.restore();
      personContext.globalCompositeOperation = 'source-over';
      outputContext.drawImage(personCanvas, 0, 0);

      if (!readySent) {
        readySent = true;
        onReady(true);
        onLoadingChange?.(false);
      }
      mask.close?.();
    };

    const render = (time: number) => {
      if (disposed) return;
      if (segmenter && !segmenting && video.readyState >= 2) {
        segmenting = true;
        try {
          segmenter.segmentForVideo(video, time, (result: any) => {
            if (!disposed) drawResult(result, time);
            segmenting = false;
          });
        } catch {
          segmenting = false;
        }
      }
      animationId = requestAnimationFrame(render);
    };

    const start = async () => {
      try {
        if (!cachedSegmenter) {
          onLoadingChange?.(true);
        }
        const activeSegmenter = await getOrInitSegmenter();
        if (disposed) return;
        if (!activeSegmenter) {
          onReady(false);
          onLoadingChange?.(false);
          return;
        }
        segmenter = activeSegmenter;
        animationId = requestAnimationFrame(render);
      } catch {
        if (!disposed) {
          onReady(false);
          onLoadingChange?.(false);
        }
      }
    };

    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      if (outputCanvasRef) outputCanvasRef.current = null;
      onReady(false);
      onLoadingChange?.(false);
    };
  }, [enabled, height, lens, mirrored, onLoadingChange, onReady, outputCanvasRef, sourceCanvasRef, videoRef, width]);

  return enabled ? <canvas ref={canvasRef} style={styles.canvas} /> : null;
};

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  } as any,
});
