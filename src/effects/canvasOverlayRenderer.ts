import { FaceLandmarks, Lens } from '../types/lens';

/**
 * High-performance Canvas 2D renderer for all AR overlays, face mesh, 3D feature overlays,
 * and creative lens effects.
 * Rendered frame-by-frame onto the composite video canvas to ensure 100% of all added filters,
 * face mesh, and 2D/3D overlays are captured into recorded videos and captured photos.
 */
export const drawOverlayToCanvas2D = (
  ctx: CanvasRenderingContext2D,
  lens: Lens,
  width: number,
  height: number,
  landmarks: FaceLandmarks,
  now: number
) => {
  if (!lens || lens.id === 'normal') return;

  const faceX = landmarks.nose.x * width;
  const faceY = landmarks.nose.y * height;
  const headX = landmarks.forehead.x * width;
  const headY = landmarks.forehead.y * height;
  const eyeLX = landmarks.leftEye.x * width;
  const eyeLY = landmarks.leftEye.y * height;
  const eyeRX = landmarks.rightEye.x * width;
  const eyeRY = landmarks.rightEye.y * height;
  const mouthX = landmarks.mouth.x * width;
  const mouthY = landmarks.mouth.y * height;
  const chinX = landmarks.chin.x * width;
  const chinY = landmarks.chin.y * height;
  const faceScale = Math.max((landmarks.faceWidth * width) / 200, 0.4);

  const sec = now * 0.001;

  // --------------------------------------------------------------------------
  // 1. FACE MESH OVERLAY (For matrix, cyberpunk, cyborg, scifi, or mesh lenses)
  // --------------------------------------------------------------------------
  const isMeshLens =
    lens.id === 'matrix-code' ||
    lens.id === 'cyberpunk-grid' ||
    lens.id === 'neon-cyborg' ||
    lens.id === 'scifi-visor' ||
    lens.id.includes('mesh');

  if (isMeshLens) {
    ctx.save();
    ctx.strokeStyle = lens.accentColor || '#06b6d4';
    ctx.fillStyle = lens.accentColor || '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.65;

    // Connect face mesh contour lines
    const pts = [
      { x: headX, y: headY },
      { x: eyeLX, y: eyeLY },
      { x: faceX, y: faceY },
      { x: eyeRX, y: eyeRY },
      { x: chinX, y: chinY },
      { x: mouthX, y: mouthY },
    ];

    // Draw triangles between face points
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Cross-mesh lines
    ctx.beginPath();
    ctx.moveTo(eyeLX, eyeLY);
    ctx.lineTo(eyeRX, eyeRY);
    ctx.moveTo(headX, headY);
    ctx.lineTo(faceX, faceY);
    ctx.moveTo(faceX, faceY);
    ctx.lineTo(chinX, chinY);
    ctx.moveTo(eyeLX, eyeLY);
    ctx.lineTo(mouthX, mouthY);
    ctx.moveTo(eyeRX, eyeRY);
    ctx.lineTo(mouthX, mouthY);
    ctx.stroke();

    // Landmark glowing dots
    pts.forEach((pt) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4 * faceScale, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 2. PUPPY OVERLAY (Ears, Snout, Tongue, Blushes)
  // --------------------------------------------------------------------------
  if (lens.id === 'puppy' || lens.id === '09. Puppy Ears') {
    ctx.save();
    const earWiggleL = Math.sin(sec * 4) * 0.1;
    const earWiggleR = Math.cos(sec * 4) * 0.1;

    // Left Ear
    ctx.save();
    ctx.translate(headX - 65 * faceScale, headY - 45 * faceScale);
    ctx.rotate(-0.3 + earWiggleL);
    ctx.scale(faceScale, faceScale);
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(10, 20);
    ctx.bezierCurveTo(-20, 50, -35, 120, -5, 130);
    ctx.bezierCurveTo(25, 140, 50, 100, 35, 40);
    ctx.closePath();
    ctx.fill();
    // Inner Ear
    ctx.fillStyle = '#f472b6';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(5, 35);
    ctx.bezierCurveTo(-12, 60, -20, 105, -2, 112);
    ctx.bezierCurveTo(18, 118, 35, 90, 25, 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Right Ear
    ctx.save();
    ctx.translate(headX + 65 * faceScale, headY - 45 * faceScale);
    ctx.rotate(0.3 + earWiggleR);
    ctx.scale(faceScale, faceScale);
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.moveTo(-10, 20);
    ctx.bezierCurveTo(20, 50, 35, 120, 5, 130);
    ctx.bezierCurveTo(-25, 140, -50, 100, -35, 40);
    ctx.closePath();
    ctx.fill();
    // Inner Ear
    ctx.fillStyle = '#f472b6';
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(-5, 35);
    ctx.bezierCurveTo(12, 60, 20, 105, 2, 112);
    ctx.bezierCurveTo(-18, 118, -35, 90, -25, 50);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Snout
    ctx.save();
    ctx.translate(faceX, faceY);
    ctx.scale(faceScale * 0.95, faceScale * 0.95);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // Nostrils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(-9, 2, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.ellipse(9, 2, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shine
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.ellipse(-5, -5, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tongue
    ctx.save();
    ctx.translate(mouthX, mouthY + 12 * faceScale);
    ctx.scale(faceScale * 0.9, faceScale * 0.9);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.moveTo(-14, 0);
    ctx.bezierCurveTo(-16, 22, -8, 38, 0, 38);
    ctx.bezierCurveTo(8, 38, 16, 22, 14, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#e11d48';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.lineTo(0, 26);
    ctx.stroke();
    ctx.restore();

    // Cheek Blushes
    ctx.fillStyle = '#f43f5e';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(faceX - 52 * faceScale, faceY + 10 * faceScale, 16 * faceScale, 0, Math.PI * 2);
    ctx.arc(faceX + 52 * faceScale, faceY + 10 * faceScale, 16 * faceScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 3. BUNNY OVERLAY (Ears, Heart Nose, Whiskers)
  // --------------------------------------------------------------------------
  if (lens.id === 'bunny' || lens.id === '10. Bunny Ears') {
    ctx.save();
    const twitchL = Math.sin(sec * 6) * 0.05;
    const twitchR = Math.sin((sec + 0.3) * 6) * 0.05;

    // Left Bunny Ear
    ctx.save();
    ctx.translate(headX - 40 * faceScale, headY - 60 * faceScale);
    ctx.rotate(-0.2 + twitchL);
    ctx.scale(faceScale * 1.1, faceScale * 1.1);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-30, -60, -35, -160, 0, -170);
    ctx.bezierCurveTo(35, -160, 30, -60, 0, 0);
    ctx.fill();
    ctx.stroke();
    // Inner Pink
    ctx.fillStyle = '#f472b6';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.bezierCurveTo(-18, -60, -20, -140, 0, -150);
    ctx.bezierCurveTo(20, -140, 18, -60, 0, -15);
    ctx.fill();
    ctx.restore();

    // Right Bunny Ear
    ctx.save();
    ctx.translate(headX + 40 * faceScale, headY - 60 * faceScale);
    ctx.rotate(0.2 + twitchR);
    ctx.scale(faceScale * 1.1, faceScale * 1.1);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#d4d4d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-30, -60, -35, -160, 0, -170);
    ctx.bezierCurveTo(35, -160, 30, -60, 0, 0);
    ctx.fill();
    ctx.stroke();
    // Inner Pink
    ctx.fillStyle = '#f472b6';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.bezierCurveTo(-18, -60, -20, -140, 0, -150);
    ctx.bezierCurveTo(20, -140, 18, -60, 0, -15);
    ctx.fill();
    ctx.restore();

    // Whiskers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    // Left
    ctx.moveTo(faceX - 18 * faceScale, faceY - 2 * faceScale);
    ctx.lineTo(faceX - 85 * faceScale, faceY - 14 * faceScale);
    ctx.moveTo(faceX - 18 * faceScale, faceY + 4 * faceScale);
    ctx.lineTo(faceX - 88 * faceScale, faceY + 6 * faceScale);
    ctx.moveTo(faceX - 18 * faceScale, faceY + 10 * faceScale);
    ctx.lineTo(faceX - 82 * faceScale, faceY + 24 * faceScale);
    // Right
    ctx.moveTo(faceX + 18 * faceScale, faceY - 2 * faceScale);
    ctx.lineTo(faceX + 85 * faceScale, faceY - 14 * faceScale);
    ctx.moveTo(faceX + 18 * faceScale, faceY + 4 * faceScale);
    ctx.lineTo(faceX + 88 * faceScale, faceY + 6 * faceScale);
    ctx.moveTo(faceX + 18 * faceScale, faceY + 10 * faceScale);
    ctx.lineTo(faceX + 82 * faceScale, faceY + 24 * faceScale);
    ctx.stroke();

    // Heart Nose
    ctx.save();
    ctx.translate(faceX, faceY);
    ctx.scale(faceScale * 0.85, faceScale * 0.85);
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-12, 0, -18, -12, -7, -18);
    ctx.bezierCurveTo(0, -15, 0, -10, 0, -7);
    ctx.bezierCurveTo(0, -10, 0, -15, 7, -18);
    ctx.bezierCurveTo(18, -12, 12, 0, 0, 10);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 4. FUNNY GLASSES & MUSTACHE OVERLAY
  // --------------------------------------------------------------------------
  if (lens.id === 'funny-glasses' || lens.id === '11. Retro Glasses') {
    ctx.save();
    const eyeDist = Math.hypot(eyeRX - eyeLX, eyeRY - eyeLY);
    const midEyeX = (eyeLX + eyeRX) / 2;
    const midEyeY = (eyeLY + eyeRY) / 2;
    const glassesScale = Math.max(eyeDist / 90, 0.4);
    const angle = Math.atan2(eyeRY - eyeLY, eyeRX - eyeLX);

    ctx.save();
    ctx.translate(midEyeX, midEyeY);
    ctx.rotate(angle);
    ctx.scale(glassesScale * 1.15, glassesScale * 1.15);

    // Bridge
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-15, -5);
    ctx.quadraticCurveTo(0, -12, 15, -5);
    ctx.stroke();

    // Left Lens Frame
    ctx.fillStyle = '#8b5cf6';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-72, -18);
    ctx.lineTo(-12, -18);
    ctx.bezierCurveTo(-10, 10, -18, 28, -42, 30);
    ctx.bezierCurveTo(-66, 28, -74, 10, -72, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Lens Frame
    ctx.beginPath();
    ctx.moveTo(12, -18);
    ctx.lineTo(72, -18);
    ctx.bezierCurveTo(74, 10, 66, 28, 42, 30);
    ctx.bezierCurveTo(18, 28, 10, 10, 12, -18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyebrows
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(-75, -24);
    ctx.quadraticCurveTo(-45, -34, -15, -22);
    ctx.moveTo(15, -22);
    ctx.quadraticCurveTo(45, -34, 75, -24);
    ctx.stroke();

    ctx.restore();

    // Mustache
    ctx.save();
    ctx.translate(mouthX, (faceY + mouthY) / 2);
    ctx.rotate(angle);
    ctx.scale(glassesScale * 1.05, glassesScale * 1.05);
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-15, -14, -40, -12, -55, 2);
    ctx.bezierCurveTo(-40, 24, -10, 12, 0, 4);
    ctx.bezierCurveTo(10, 12, 40, 24, 55, 2);
    ctx.bezierCurveTo(40, -12, 15, -14, 0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 5. ALIEN OVERLAY (Antennae & Glowing Orbs & Almond Eyes)
  // --------------------------------------------------------------------------
  if (lens.id === 'alien' || lens.id === '07. Alien Entity') {
    ctx.save();
    const orbPulse = 14 + Math.sin(sec * 5) * 3;

    // Antennae
    ctx.save();
    ctx.translate(headX, headY - 30 * faceScale);
    ctx.scale(faceScale, faceScale);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-30, 0);
    ctx.quadraticCurveTo(-55, -40, -50, -75);
    ctx.moveTo(30, 0);
    ctx.quadraticCurveTo(55, -40, 50, -75);
    ctx.stroke();

    // Left Orb
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(-50, -75, orbPulse, 0, Math.PI * 2);
    ctx.arc(50, -75, orbPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Large Alien Almond Eyes
    ctx.save();
    ctx.translate(eyeLX, eyeLY);
    ctx.rotate(-0.3);
    ctx.scale(faceScale * 0.9, faceScale * 0.9);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.bezierCurveTo(-20, -28, 20, -28, 32, 0);
    ctx.bezierCurveTo(20, 28, -20, 28, -32, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.translate(eyeRX, eyeRY);
    ctx.rotate(0.3);
    ctx.scale(faceScale * 0.9, faceScale * 0.9);
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-32, 0);
    ctx.bezierCurveTo(-20, -28, 20, -28, 32, 0);
    ctx.bezierCurveTo(20, 28, -20, 28, -32, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 6. DEMON HORNS
  // --------------------------------------------------------------------------
  if (lens.id === 'demon-horns') {
    ctx.save();
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = faceScale * 2;

    // Left Horn
    ctx.beginPath();
    ctx.moveTo(headX - faceScale * 30, headY);
    ctx.quadraticCurveTo(headX - faceScale * 82, headY - faceScale * 78, headX - faceScale * 48, headY - faceScale * 104);
    ctx.quadraticCurveTo(headX - faceScale * 52, headY - faceScale * 52, headX - faceScale * 10, headY - faceScale * 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right Horn
    ctx.beginPath();
    ctx.moveTo(headX + faceScale * 30, headY);
    ctx.quadraticCurveTo(headX + faceScale * 82, headY - faceScale * 78, headX + faceScale * 48, headY - faceScale * 104);
    ctx.quadraticCurveTo(headX + faceScale * 52, headY - faceScale * 52, headX + faceScale * 10, headY - faceScale * 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 7. ANGEL HALO
  // --------------------------------------------------------------------------
  if (lens.id === 'angel-halo') {
    ctx.save();
    const pulse = 0.75 + Math.sin(sec * 4) * 0.25;
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = faceScale * 8;
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.ellipse(headX, headY - faceScale * 70, faceScale * 62, faceScale * 17, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 8. LASER EYE
  // --------------------------------------------------------------------------
  if (lens.id === 'laser-eye') {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = faceScale * 7;
    ctx.beginPath();
    ctx.moveTo(eyeLX, eyeLY);
    ctx.lineTo(eyeLX - width * 0.45, eyeLY + faceScale * 12);
    ctx.moveTo(eyeRX, eyeRY);
    ctx.lineTo(eyeRX + width * 0.45, eyeRY + faceScale * 12);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = faceScale * 2;
    ctx.beginPath();
    ctx.moveTo(eyeLX, eyeLY);
    ctx.lineTo(eyeLX - width * 0.45, eyeLY + faceScale * 12);
    ctx.moveTo(eyeRX, eyeRY);
    ctx.lineTo(eyeRX + width * 0.45, eyeRY + faceScale * 12);
    ctx.stroke();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 9. FROGGY EYES
  // --------------------------------------------------------------------------
  if (lens.id === 'froggy') {
    ctx.save();
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = faceScale * 4;

    ctx.beginPath();
    ctx.arc(eyeLX, eyeLY - faceScale * 34, faceScale * 28, 0, Math.PI * 2);
    ctx.arc(eyeRX, eyeRY - faceScale * 34, faceScale * 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeLX, eyeLY - faceScale * 34, faceScale * 10, 0, Math.PI * 2);
    ctx.arc(eyeRX, eyeRY - faceScale * 34, faceScale * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 10. ANIMAL EARS (Cat, Fox, Wolf, Tiger, Bear, Panda, Koala)
  // --------------------------------------------------------------------------
  if (
    lens.id === 'kitty-cat' ||
    lens.id === 'fox-spirit' ||
    lens.id === 'wolf-howl' ||
    lens.id === 'tiger-stripes'
  ) {
    ctx.save();
    const color =
      lens.id === 'kitty-cat'
        ? '#f472b6'
        : lens.id === 'wolf-howl'
        ? '#cbd5e1'
        : '#f97316';

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.94;

    // Left Pointy Ear
    ctx.beginPath();
    ctx.moveTo(headX - faceScale * 58, headY + faceScale * 12);
    ctx.lineTo(headX - faceScale * 42, headY - faceScale * 70);
    ctx.lineTo(headX - faceScale * 8, headY - faceScale * 4);
    ctx.closePath();
    ctx.fill();

    // Right Pointy Ear
    ctx.beginPath();
    ctx.moveTo(headX + faceScale * 58, headY + faceScale * 12);
    ctx.lineTo(headX + faceScale * 42, headY - faceScale * 70);
    ctx.lineTo(headX + faceScale * 8, headY - faceScale * 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  if (lens.id === 'koala' || lens.id === 'panda-bear' || lens.id === 'teddy-bear') {
    ctx.save();
    const outerColor = lens.id === 'teddy-bear' ? '#92400e' : '#475569';
    const innerColor = lens.id === 'teddy-bear' ? '#fde68a' : '#fbcfe8';

    ctx.fillStyle = outerColor;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(headX - faceScale * 58, headY - faceScale * 8, faceScale * 34, 0, Math.PI * 2);
    ctx.arc(headX + faceScale * 58, headY - faceScale * 8, faceScale * 34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = innerColor;
    ctx.beginPath();
    ctx.arc(headX - faceScale * 58, headY - faceScale * 8, faceScale * 20, 0, Math.PI * 2);
    ctx.arc(headX + faceScale * 58, headY - faceScale * 8, faceScale * 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --------------------------------------------------------------------------
  // 11. SYNTHWAVE / MATRIX / COSMIC BACKGROUND & CREATIVE OVERLAYS
  // --------------------------------------------------------------------------
  if (lens.id === 'synthwave-80s') {
    ctx.save();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.45;
    // Perspective Grid Lines
    for (let i = 0; i < 8; i++) {
      const y = height * (0.55 + i * 0.06);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (lens.id === 'matrix-code') {
    ctx.save();
    ctx.fillStyle = '#4ade80';
    ctx.globalAlpha = 0.5;
    const cols = [0.1, 0.25, 0.4, 0.6, 0.75, 0.9];
    cols.forEach((col, idx) => {
      const y = ((sec * 120 + idx * 40) % height);
      ctx.fillRect(col * width, y, 3, 40);
    });
    ctx.restore();
  }

  if (lens.id === 'cosmic-starlight' || lens.id === 'diamond-glitter') {
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    for (let i = 0; i < 12; i++) {
      const sx = ((i * 73 + sec * 25) % width);
      const sy = ((i * 97 + Math.sin(i) * 50) % height);
      ctx.beginPath();
      ctx.arc(sx, sy, (i % 3) + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};
