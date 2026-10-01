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

const drawScene = (ctx: CanvasRenderingContext2D, width: number, height: number, scene: Scene, time: number) => {
  const drift = Math.sin(time * 0.00025) * width * 0.04;
  const sky = ctx.createLinearGradient(0, 0, 0, height);

  if (scene === 'sunset') {
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
    // Starbursts & Planet with ring
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
    // Glowing Ring Planet
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
    // Waving polar aurora light ribbons
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
    // 80s Neon Grid Sun & Wireframe
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
  } else if (scene === 'underwater') {
    // Ocean light rays & seabed coral
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    for (let index = 0; index < 5; index += 1) {
      const x = width * (0.15 + index * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + width * 0.1, height);
      ctx.lineTo(x - width * 0.05, height);
      ctx.fill();
    }
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, height * 0.8, width, height * 0.2);
  } else if (scene === 'volcano') {
    // Jagged volcano peaks & lava river lines
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.75);
    ctx.lineTo(width * 0.3, height * 0.45);
    ctx.lineTo(width * 0.5, height * 0.55);
    ctx.lineTo(width * 0.75, height * 0.38);
    ctx.lineTo(width, height * 0.75);
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(width * 0.3, height * 0.45);
    ctx.lineTo(width * 0.35, height * 0.75);
    ctx.stroke();
  } else if (scene === 'sakura') {
    // Falling cherry blossom petals
    ctx.fillStyle = '#fbcfe8';
    for (let index = 0; index < 22; index += 1) {
      const x = (index * 61 + drift * 2) % width;
      const y = (index * 47 + time * 0.05) % height;
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (scene === 'studio-pro') {
    // Soft rim spotlight halo
    const spot = ctx.createRadialGradient(width * 0.5, height * 0.4, width * 0.05, width * 0.5, height * 0.4, width * 0.45);
    spot.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
    spot.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spot;
    ctx.fillRect(0, 0, width, height);
  } else if (scene === 'beach') {
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(0, height * 0.57, width, height * 0.16);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 4;
    for (let index = 0; index < 7; index += 1) {
      const y = height * 0.6 + index * 18 + Math.sin(time * 0.002 + index) * 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.quadraticCurveTo(width * 0.5, y - 12, width, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#422006';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(width * 0.14, height * 0.76);
    ctx.quadraticCurveTo(width * 0.18, height * 0.38, width * 0.34, height * 0.3);
    ctx.stroke();
    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 8;
    for (let index = 0; index < 5; index += 1) {
      ctx.beginPath();
      ctx.moveTo(width * 0.18, height * 0.42);
      ctx.lineTo(width * (0.02 + index * 0.09), height * (0.25 + index * 0.02));
      ctx.stroke();
    }
  } else if (scene === 'mountains') {
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.68);
    ctx.lineTo(width * 0.25, height * 0.28);
    ctx.lineTo(width * 0.48, height * 0.68);
    ctx.lineTo(width * 0.7, height * 0.2);
    ctx.lineTo(width, height * 0.68);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.78);
    ctx.lineTo(width * 0.36, height * 0.4);
    ctx.lineTo(width * 0.62, height * 0.78);
    ctx.lineTo(width * 0.86, height * 0.38);
    ctx.lineTo(width, height * 0.78);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, height * 0.67 + drift, width, height * 0.08);
  } else if (scene === 'city') {
    for (let index = 0; index < 9; index += 1) {
      const buildingWidth = width * 0.12;
      const x = index * buildingWidth;
      const buildingHeight = height * (0.2 + (index % 4) * 0.08);
      ctx.fillStyle = index % 2 ? '#1e1b4b' : '#172554';
      ctx.fillRect(x, height * 0.72 - buildingHeight, buildingWidth - 4, buildingHeight);
      ctx.fillStyle = index % 2 ? '#22d3ee' : '#f472b6';
      for (let row = 0; row < 5; row += 1) {
        ctx.fillRect(x + 12, height * 0.72 - buildingHeight + 20 + row * 28, 7, 10);
        ctx.fillRect(x + 34, height * 0.72 - buildingHeight + 20 + row * 28, 7, 10);
      }
    }
    ctx.fillStyle = 'rgba(34,211,238,0.3)';
    ctx.fillRect(0, height * 0.73, width, height * 0.27);
  } else if (scene === 'cozy-room') {
    ctx.fillStyle = '#7c2d12';
    ctx.fillRect(0, height * 0.72, width, height * 0.28);
    ctx.fillStyle = '#451a03';
    ctx.fillRect(width * 0.15, height * 0.18, width * 0.7, height * 0.36);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(width * 0.22, height * 0.24, width * 0.56, height * 0.24);
    ctx.strokeStyle = '#fef3c7';
    ctx.lineWidth = 8;
    ctx.strokeRect(width * 0.22, height * 0.24, width * 0.56, height * 0.24);
    ctx.fillStyle = '#166534';
    ctx.beginPath();
    ctx.arc(width * 0.12, height * 0.68, width * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#713f12';
    ctx.fillRect(width * 0.09, height * 0.68, width * 0.06, height * 0.23);
  } else {
    ctx.fillStyle = '#052e16';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    for (let index = 0; index < 12; index += 1) {
      const x = ((index * width * 0.13 + drift) % (width + 100)) - 50;
      const treeHeight = height * (0.22 + (index % 3) * 0.08);
      ctx.fillStyle = '#422006';
      ctx.fillRect(x, height * 0.72 - treeHeight * 0.25, 12, treeHeight * 0.5);
      ctx.fillStyle = index % 2 ? '#15803d' : '#166534';
      ctx.beginPath();
      ctx.arc(x + 6, height * 0.7 - treeHeight * 0.35, treeHeight * 0.28, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fde047';
    for (let index = 0; index < 18; index += 1) {
      const x = (index * 83 + drift * 2) % width;
      const y = height * (0.18 + ((index * 37) % 56) / 100);
      ctx.globalAlpha = 0.45 + Math.sin(time * 0.004 + index) * 0.3;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (scene === 'sunset') {
    ctx.fillStyle = '#fde68a';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.4, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
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
