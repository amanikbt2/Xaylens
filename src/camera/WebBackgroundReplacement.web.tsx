import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { Lens } from '../types/lens';

interface WebBackgroundReplacementProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  lens: Lens;
  width: number;
  height: number;
  enabled: boolean;
  onReady: (ready: boolean) => void;
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

  if (scene === 'beach') {
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

export const WebBackgroundReplacement: React.FC<WebBackgroundReplacementProps> = ({
  videoRef,
  lens,
  width,
  height,
  enabled,
  onReady,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video || !width || !height) {
      onReady(false);
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
        const vision = await (Function('url', 'return import(url)')(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
        ) as Promise<any>);
        if (disposed || !vision?.ImageSegmenter || !vision?.FilesetResolver) return;
        const fileset = await vision.FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        segmenter = await vision.ImageSegmenter.createFromOptions(fileset, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          outputCategoryMask: false,
          outputConfidenceMasks: true,
        });
        animationId = requestAnimationFrame(render);
      } catch {
        onReady(false);
      }
    };

    start();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationId);
      segmenter?.close?.();
      onReady(false);
    };
  }, [enabled, height, lens, onReady, videoRef, width]);

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
