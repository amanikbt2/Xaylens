import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { FaceLandmarks, Lens } from '../types/lens';

interface CreativeLensOverlayProps {
  lens: Lens;
  width: number;
  height: number;
  landmarks: FaceLandmarks;
  animationTick: number;
}

type Palette = {
  first: string;
  second: string;
  glow: string;
  mode: 'aurora' | 'grid' | 'matrix' | 'thermal' | 'noir' | 'stars';
};

const PALETTES: Record<string, Palette> = {
  'cosmic-starlight': { first: '#312e81', second: '#701a75', glow: '#c084fc', mode: 'stars' },
  'synthwave-80s': { first: '#86198f', second: '#1e1b4b', glow: '#f472b6', mode: 'grid' },
  'cyberpunk-grid': { first: '#164e63', second: '#172554', glow: '#22d3ee', mode: 'grid' },
  'golden-sunset': { first: '#c2410c', second: '#7c2d12', glow: '#facc15', mode: 'aurora' },
  'vintage-70s': { first: '#92400e', second: '#451a03', glow: '#f59e0b', mode: 'aurora' },
  vaporwave: { first: '#86198f', second: '#115e59', glow: '#f0abfc', mode: 'aurora' },
  'sunset-aura': { first: '#7e22ce', second: '#9f1239', glow: '#fb7185', mode: 'aurora' },
  'matrix-code': { first: '#064e3b', second: '#022c22', glow: '#4ade80', mode: 'matrix' },
  'thermal-heat': { first: '#991b1b', second: '#312e81', glow: '#facc15', mode: 'thermal' },
  'cinema-noir': { first: '#27272a', second: '#09090b', glow: '#e4e4e7', mode: 'noir' },
  'neon-cyborg': { first: '#164e63', second: '#172554', glow: '#22d3ee', mode: 'grid' },
  'fox-spirit': { first: '#9a3412', second: '#431407', glow: '#fb923c', mode: 'aurora' },
  'dragon-fire': { first: '#9a3412', second: '#450a0a', glow: '#f97316', mode: 'thermal' },
  'angel-halo': { first: '#713f12', second: '#1e1b4b', glow: '#fde68a', mode: 'stars' },
};

const STAR_POINTS = [
  [0.08, 0.18],
  [0.22, 0.42],
  [0.36, 0.12],
  [0.61, 0.24],
  [0.79, 0.15],
  [0.9, 0.38],
  [0.14, 0.74],
  [0.82, 0.76],
];

const MATRIX_COLUMNS = [0.08, 0.19, 0.31, 0.46, 0.57, 0.7, 0.83, 0.94];

export const CreativeLensOverlay: React.FC<CreativeLensOverlayProps> = ({
  lens,
  width,
  height,
  landmarks,
  animationTick,
}) => {
  const palette =
    PALETTES[lens.id] ||
    (lens.category === 'style'
      ? { first: lens.accentColor, second: '#0f172a', glow: lens.accentColor, mode: 'aurora' as const }
      : lens.category === 'creature'
      ? { first: '#312e81', second: '#111827', glow: lens.accentColor, mode: 'stars' as const }
      : lens.category === 'animal'
      ? { first: lens.accentColor, second: '#172554', glow: '#fef08a', mode: 'aurora' as const }
      : lens.category === 'background'
      ? { first: lens.accentColor, second: '#0f172a', glow: lens.accentColor, mode: 'aurora' as const }
      : null);
  if (!palette) return null;

  const faceX = landmarks.nose.x * width;
  const faceY = landmarks.nose.y * height;
  const headX = landmarks.forehead.x * width;
  const headY = landmarks.forehead.y * height;
  const leftEyeX = landmarks.leftEye.x * width;
  const leftEyeY = landmarks.leftEye.y * height;
  const rightEyeX = landmarks.rightEye.x * width;
  const rightEyeY = landmarks.rightEye.y * height;
  const mouthX = landmarks.mouth.x * width;
  const mouthY = landmarks.mouth.y * height;
  const faceScale = Math.max(landmarks.faceWidth * width, 80) / 200;
  const drift = Math.sin(animationTick * 0.025) * width * 0.08;
  const pulse = 0.72 + Math.sin(animationTick * 0.08) * 0.2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={`creativeBg_${lens.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={palette.first} stopOpacity="0.32" />
            <Stop offset="55%" stopColor={palette.second} stopOpacity="0.22" />
            <Stop offset="100%" stopColor="#020617" stopOpacity="0.48" />
          </LinearGradient>
          <RadialGradient id={`creativeGlow_${lens.id}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={palette.glow} stopOpacity="0.52" />
            <Stop offset="100%" stopColor={palette.glow} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect width={width} height={height} fill={`url(#creativeBg_${lens.id})`} />

        {palette.mode === 'aurora' && (
          <G opacity={0.55}>
            <Ellipse
              cx={width * 0.22 + drift}
              cy={height * 0.2}
              rx={width * 0.45}
              ry={height * 0.18}
              fill={`url(#creativeGlow_${lens.id})`}
              transform={`rotate(-18 ${width * 0.22 + drift} ${height * 0.2})`}
            />
            <Ellipse
              cx={width * 0.78 - drift}
              cy={height * 0.72}
              rx={width * 0.52}
              ry={height * 0.2}
              fill={`url(#creativeGlow_${lens.id})`}
              transform={`rotate(20 ${width * 0.78 - drift} ${height * 0.72})`}
            />
          </G>
        )}

        {palette.mode === 'grid' && (
          <G opacity={0.42} stroke={palette.glow} fill="none">
            {Array.from({ length: 9 }, (_, index) => {
              const y = height * (0.52 + index * 0.07);
              return <Path key={`h-${index}`} d={`M 0 ${y} L ${width} ${y}`} strokeWidth={1.5} />;
            })}
            {Array.from({ length: 9 }, (_, index) => {
              const x = width / 2 + (index - 4) * width * 0.18;
              return <Path key={`v-${index}`} d={`M ${x} ${height} L ${width / 2 + (index - 4) * width * 0.04} ${height * 0.52}`} strokeWidth={1.5} />;
            })}
            <Path d={`M 0 ${height * 0.52} Q ${width / 2} ${height * 0.43} ${width} ${height * 0.52}`} strokeWidth={3} />
          </G>
        )}

        {palette.mode === 'matrix' && (
          <G fill={palette.glow} opacity={0.48}>
            {MATRIX_COLUMNS.map((column, columnIndex) => {
              const start = ((animationTick * (1 + columnIndex * 0.08)) % 120) / 100;
              return Array.from({ length: 6 }, (_, rowIndex) => {
                const y = ((start + rowIndex * 0.11) % 1.2) * height;
                return <Rect key={`${columnIndex}-${rowIndex}`} x={column * width} y={y} width={2 + (rowIndex % 2)} height={height * 0.055} rx={2} />;
              });
            })}
          </G>
        )}

        {palette.mode === 'thermal' && (
          <G opacity={0.5}>
            <Ellipse cx={width * 0.25 + drift} cy={height * 0.3} rx={width * 0.34} ry={height * 0.24} fill="#ef4444" />
            <Ellipse cx={width * 0.72 - drift} cy={height * 0.62} rx={width * 0.38} ry={height * 0.27} fill="#7c3aed" />
            <Circle cx={faceX} cy={faceY} r={Math.max(width * 0.22, 90)} fill={`url(#creativeGlow_${lens.id})`} opacity={pulse} />
          </G>
        )}

        {palette.mode === 'stars' && (
          <G fill={palette.glow} opacity={pulse}>
            {STAR_POINTS.map(([x, y], index) => {
              const size = 3 + (index % 3) * 2;
              const offset = Math.sin(animationTick * 0.06 + index) * 5;
              return (
                <Path
                  key={`star-${index}`}
                  d={`M ${x * width} ${y * height - size - offset} L ${x * width + size * 0.7} ${y * height - offset} L ${x * width} ${y * height + size + offset} L ${x * width - size * 0.7} ${y * height - offset} Z`}
                />
              );
            })}
          </G>
        )}

        {palette.mode === 'noir' && (
          <G opacity={0.18} stroke="#ffffff" strokeWidth={2}>
            <Path d={`M 0 ${height * 0.18} L ${width} ${height * 0.08}`} />
            <Path d={`M 0 ${height * 0.82} L ${width} ${height * 0.68}`} />
          </G>
        )}

        {(lens.id === 'koala' || lens.id === 'panda-bear' || lens.id === 'teddy-bear') && (
          <G>
            <Circle cx={headX - faceScale * 58} cy={headY - faceScale * 8} r={faceScale * 34} fill={lens.id === 'teddy-bear' ? '#92400e' : '#475569'} opacity={0.9} />
            <Circle cx={headX + faceScale * 58} cy={headY - faceScale * 8} r={faceScale * 34} fill={lens.id === 'teddy-bear' ? '#92400e' : '#475569'} opacity={0.9} />
            <Circle cx={headX - faceScale * 58} cy={headY - faceScale * 8} r={faceScale * 20} fill={lens.id === 'teddy-bear' ? '#fde68a' : '#fbcfe8'} opacity={0.9} />
            <Circle cx={headX + faceScale * 58} cy={headY - faceScale * 8} r={faceScale * 20} fill={lens.id === 'teddy-bear' ? '#fde68a' : '#fbcfe8'} opacity={0.9} />
            <Ellipse cx={faceX} cy={faceY + faceScale * 8} rx={faceScale * 18} ry={faceScale * 25} fill={lens.id === 'koala' ? '#0f172a' : '#78350f'} opacity={0.88} />
          </G>
        )}

        {(lens.id === 'kitty-cat' || lens.id === 'fox-spirit' || lens.id === 'wolf-howl' || lens.id === 'tiger-stripes') && (
          <G>
            <Path d={`M ${headX - faceScale * 58} ${headY + faceScale * 12} L ${headX - faceScale * 42} ${headY - faceScale * 70} L ${headX - faceScale * 8} ${headY - faceScale * 4} Z`} fill={lens.id === 'kitty-cat' ? '#f472b6' : lens.id === 'wolf-howl' ? '#cbd5e1' : '#f97316'} opacity={0.94} />
            <Path d={`M ${headX + faceScale * 58} ${headY + faceScale * 12} L ${headX + faceScale * 42} ${headY - faceScale * 70} L ${headX + faceScale * 8} ${headY - faceScale * 4} Z`} fill={lens.id === 'kitty-cat' ? '#f472b6' : lens.id === 'wolf-howl' ? '#cbd5e1' : '#f97316'} opacity={0.94} />
            <Circle cx={faceX} cy={faceY + faceScale * 14} r={faceScale * 12} fill={lens.id === 'tiger-stripes' ? '#fef3c7' : '#18181b'} opacity={0.9} />
          </G>
        )}

        {lens.id === 'froggy' && (
          <G>
            <Circle cx={leftEyeX} cy={leftEyeY - faceScale * 34} r={faceScale * 28} fill="#22c55e" stroke="#14532d" strokeWidth={faceScale * 4} />
            <Circle cx={rightEyeX} cy={rightEyeY - faceScale * 34} r={faceScale * 28} fill="#22c55e" stroke="#14532d" strokeWidth={faceScale * 4} />
            <Circle cx={leftEyeX} cy={leftEyeY - faceScale * 34} r={faceScale * 10} fill="#0f172a" />
            <Circle cx={rightEyeX} cy={rightEyeY - faceScale * 34} r={faceScale * 10} fill="#0f172a" />
          </G>
        )}

        {lens.id === 'lion-king' && (
          <G fill="#f59e0b" opacity={0.66}>
            {Array.from({ length: 10 }, (_, index) => {
              const angle = (index / 10) * Math.PI * 2;
              const x = faceX + Math.cos(angle) * faceScale * 78;
              const y = faceY + Math.sin(angle) * faceScale * 78;
              return <Circle key={`mane-${index}`} cx={x} cy={y} r={faceScale * 28} />;
            })}
          </G>
        )}

        {lens.id === 'demon-horns' && (
          <G fill="#dc2626" stroke="#fca5a5" strokeWidth={faceScale * 2}>
            <Path d={`M ${headX - faceScale * 30} ${headY} Q ${headX - faceScale * 82} ${headY - faceScale * 78} ${headX - faceScale * 48} ${headY - faceScale * 104} Q ${headX - faceScale * 52} ${headY - faceScale * 52} ${headX - faceScale * 10} ${headY - faceScale * 18} Z`} />
            <Path d={`M ${headX + faceScale * 30} ${headY} Q ${headX + faceScale * 82} ${headY - faceScale * 78} ${headX + faceScale * 48} ${headY - faceScale * 104} Q ${headX + faceScale * 52} ${headY - faceScale * 52} ${headX + faceScale * 10} ${headY - faceScale * 18} Z`} />
          </G>
        )}

        {lens.id === 'angel-halo' && (
          <Ellipse cx={headX} cy={headY - faceScale * 70} rx={faceScale * 62} ry={faceScale * 17} fill="none" stroke="#fde68a" strokeWidth={faceScale * 8} opacity={pulse} />
        )}

        {lens.id === 'vampire' && (
          <G fill="#ffffff" stroke="#991b1b" strokeWidth={faceScale * 2}>
            <Path d={`M ${mouthX - faceScale * 22} ${mouthY} L ${mouthX - faceScale * 12} ${mouthY + faceScale * 34} L ${mouthX - faceScale * 2} ${mouthY} Z`} />
            <Path d={`M ${mouthX + faceScale * 2} ${mouthY} L ${mouthX + faceScale * 12} ${mouthY + faceScale * 34} L ${mouthX + faceScale * 22} ${mouthY} Z`} />
          </G>
        )}

        {lens.id === 'laser-eye' && (
          <G stroke="#ef4444" strokeLinecap="round" opacity={pulse}>
            <Path d={`M ${leftEyeX} ${leftEyeY} L ${leftEyeX - width * 0.42} ${leftEyeY + faceScale * 12}`} strokeWidth={faceScale * 7} />
            <Path d={`M ${rightEyeX} ${rightEyeY} L ${rightEyeX + width * 0.42} ${rightEyeY + faceScale * 12}`} strokeWidth={faceScale * 7} />
            <Path d={`M ${leftEyeX} ${leftEyeY} L ${leftEyeX - width * 0.42} ${leftEyeY + faceScale * 12}`} stroke="#fca5a5" strokeWidth={faceScale * 2} />
            <Path d={`M ${rightEyeX} ${rightEyeY} L ${rightEyeX + width * 0.42} ${rightEyeY + faceScale * 12}`} stroke="#fca5a5" strokeWidth={faceScale * 2} />
          </G>
        )}

        <Circle cx={faceX} cy={faceY} r={Math.max(faceScale * 125, 58)} fill={`url(#creativeGlow_${lens.id})`} opacity={0.24} />

        {(lens.id === 'diamond-glitter' || lens.id === 'butterfly-wings' || lens.id === 'angel-halo') && (
          <G fill="#ffffff" opacity={pulse}>
            {[[-1, -0.9], [1, -0.9], [-1.15, 0.35], [1.15, 0.35]].map(([x, y], index) => (
              <Path
                key={`face-star-${index}`}
                d={`M ${faceX + x * faceScale * 48} ${faceY + y * faceScale * 48 - 8} L ${faceX + x * faceScale * 48 + 4} ${faceY + y * faceScale * 48} L ${faceX + x * faceScale * 48} ${faceY + y * faceScale * 48 + 8} L ${faceX + x * faceScale * 48 - 4} ${faceY + y * faceScale * 48} Z`}
              />
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
};
