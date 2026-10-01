import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Lens } from '../types/lens';

interface WebBackgroundReplacementProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  outputCanvasRef?: React.MutableRefObject<HTMLCanvasElement | null>;
  lens: Lens;
  width: number;
  height: number;
  enabled: boolean;
  onReady: (ready: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

type Scene = NonNullable<Lens['config']['background']>['scene'];

const sceneForLens = (lens: Lens): Scene => lens.config.background?.scene || 'forest';

const SCENE_IMAGE_URLS: Partial<Record<Scene, string>> = {
  office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
  park: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=1200&q=80',
  car: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
  cafe: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
  gaming: 'https://images.unsplash.com/photo-1616588589676-62b3bd4ff6d2?auto=format&fit=crop&w=1200&q=80',
  penthouse: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'cozy-room': 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
  city: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80',
  beach: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
  mountains: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
  forest: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1200&q=80',
  'studio-pro': 'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?auto=format&fit=crop&w=1200&q=80',
};

const imageCache: Map<string, HTMLImageElement> = new Map();

const getPreloadedImage = (url: string): HTMLImageElement | null => {
  if (typeof window === 'undefined') return null;
  let img = imageCache.get(url);
  if (!img) {
    img = new Image();
    img.crossOrigin = 'anonymous';
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

const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number, scene: Scene, time: number) => {
  const drift = Math.sin(time * 0.00025) * width * 0.04;
  const imageUrl = SCENE_IMAGE_URLS[scene];
  const realImg = imageUrl ? getPreloadedImage(imageUrl) : null;

  if (realImg) {
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
};

let globalSegmenterPromise: Promise<any> | null = null;
let cachedSegmenter: any = null;

const getOrInitSegmenter = async (): Promise<any> => {
  if (cachedSegmenter) return cachedSegmenter;
  if (!globalSegmenterPromise) {
    globalSegmenterPromise = (async () => {
      const vision = await (Function('url', 'return import(url)')(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
      ) as Promise<any>);
      if (!vision?.ImageSegmenter || !vision?.FilesetResolver) return null;
      const fileset = await vision.FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        outputCategoryMask: false,
        outputConfidenceMasks: true,
      });
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
  outputCanvasRef,
  lens,
  width,
  height,
  enabled,
  onReady,
  onLoadingChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
      drawScene(outputContext, output.width, output.height, sceneForLens(lens), time);
      personContext.clearRect(0, 0, personCanvas.width, personCanvas.height);
      personContext.globalCompositeOperation = 'source-over';
      personContext.drawImage(video, 0, 0, personCanvas.width, personCanvas.height);
      personContext.globalCompositeOperation = 'destination-in';
      personContext.drawImage(maskCanvas, 0, 0, personCanvas.width, personCanvas.height);
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
  }, [enabled, height, lens, onLoadingChange, onReady, outputCanvasRef, videoRef, width]);

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
