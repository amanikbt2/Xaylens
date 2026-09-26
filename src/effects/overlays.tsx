import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Path,
  Circle,
  Ellipse,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { FaceLandmarks } from '../types/lens';

interface OverlayProps {
  landmarks: FaceLandmarks;
  canvasWidth: number;
  canvasHeight: number;
  animationTick?: number;
}

/**
 * Puppy Ears & Snout Overlay
 */
export const PuppyOverlay: React.FC<OverlayProps> = ({
  landmarks,
  canvasWidth,
  canvasHeight,
  animationTick = 0,
}) => {
  const headX = landmarks.forehead.x * canvasWidth;
  const headY = landmarks.forehead.y * canvasHeight;
  const noseX = landmarks.nose.x * canvasWidth;
  const noseY = landmarks.nose.y * canvasHeight;
  const mouthX = landmarks.mouth.x * canvasWidth;
  const mouthY = landmarks.mouth.y * canvasHeight;
  const faceScale = (landmarks.faceWidth * canvasWidth) / 200;

  // Gentle ear wiggle animation
  const earWiggleLeft = Math.sin(animationTick * 0.08) * 4;
  const earWiggleRight = Math.cos(animationTick * 0.08) * 4;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="puppyEarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#854d0e" />
            <Stop offset="100%" stopColor="#713f12" />
          </LinearGradient>
          <LinearGradient id="puppyInnerEar" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#f472b6" />
            <Stop offset="100%" stopColor="#fbcfe8" />
          </LinearGradient>
          <RadialGradient id="snoutShine" cx="40%" cy="35%" r="60%">
            <Stop offset="0%" stopColor="#3f3f46" />
            <Stop offset="70%" stopColor="#18181b" />
            <Stop offset="100%" stopColor="#09090b" />
          </RadialGradient>
        </Defs>

        {/* Left Puppy Ear */}
        <G
          transform={`translate(${headX - 65 * faceScale}, ${headY - 45 * faceScale}) rotate(${
            -18 + earWiggleLeft
          }) scale(${faceScale})`}
        >
          <Path
            d="M 10 20 C -20 50, -35 120, -5 130 C 25 140, 50 100, 35 40 Z"
            fill="url(#puppyEarGrad)"
          />
          <Path
            d="M 5 35 C -12 60, -20 105, -2 112 C 18 118, 35 90, 25 50 Z"
            fill="url(#puppyInnerEar)"
            opacity="0.85"
          />
        </G>

        {/* Right Puppy Ear */}
        <G
          transform={`translate(${headX + 65 * faceScale}, ${headY - 45 * faceScale}) rotate(${
            18 + earWiggleRight
          }) scale(${faceScale})`}
        >
          <Path
            d="M -10 20 C 20 50, 35 120, 5 130 C -25 140, -50 100, -35 40 Z"
            fill="url(#puppyEarGrad)"
          />
          <Path
            d="M -5 35 C 12 60, 20 105, 2 112 C -18 118, -35 90, -25 50 Z"
            fill="url(#puppyInnerEar)"
            opacity="0.85"
          />
        </G>

        {/* Puppy Nose / Snout */}
        <G transform={`translate(${noseX}, ${noseY}) scale(${faceScale * 0.95})`}>
          <Ellipse cx="0" cy="0" rx="22" ry="15" fill="url(#snoutShine)" />
          {/* Nostrils */}
          <Ellipse cx="-9" cy="2" rx="4" ry="2.5" fill="#000000" />
          <Ellipse cx="9" cy="2" rx="4" ry="2.5" fill="#000000" />
          {/* Nose shine */}
          <Ellipse cx="-5" cy="-5" rx="5" ry="2.5" fill="#ffffff" opacity="0.6" />
        </G>

        {/* Cute Tongue */}
        <G transform={`translate(${mouthX}, ${mouthY + 12 * faceScale}) scale(${faceScale * 0.9})`}>
          <Path
            d="M -14 0 C -16 22, -8 38, 0 38 C 8 38, 16 22, 14 0 Z"
            fill="#fb7185"
          />
          <Path d="M 0 4 L 0 26" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" />
        </G>

        {/* Pink Cheek Blushes */}
        <Circle cx={noseX - 52 * faceScale} cy={noseY + 10 * faceScale} r={16 * faceScale} fill="#f43f5e" opacity="0.35" />
        <Circle cx={noseX + 52 * faceScale} cy={noseY + 10 * faceScale} r={16 * faceScale} fill="#f43f5e" opacity="0.35" />
      </Svg>
    </View>
  );
};

/**
 * Bunny Ears, Heart Nose & Whiskers Overlay
 */
export const BunnyOverlay: React.FC<OverlayProps> = ({
  landmarks,
  canvasWidth,
  canvasHeight,
  animationTick = 0,
}) => {
  const headX = landmarks.forehead.x * canvasWidth;
  const headY = landmarks.forehead.y * canvasHeight;
  const noseX = landmarks.nose.x * canvasWidth;
  const noseY = landmarks.nose.y * canvasHeight;
  const faceScale = (landmarks.faceWidth * canvasWidth) / 200;

  // Bunny twitch
  const twitchL = Math.sin(animationTick * 0.12) * 3;
  const twitchR = Math.sin((animationTick + 2) * 0.12) * 3;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="bunnyWhite" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#ffffff" />
            <Stop offset="100%" stopColor="#e4e4e7" />
          </LinearGradient>
          <LinearGradient id="bunnyPink" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#f472b6" />
            <Stop offset="100%" stopColor="#fbcfe8" />
          </LinearGradient>
        </Defs>

        {/* Left Bunny Ear */}
        <G
          transform={`translate(${headX - 40 * faceScale}, ${headY - 60 * faceScale}) rotate(${
            -12 + twitchL
          }) scale(${faceScale * 1.1})`}
        >
          {/* Outer Ear */}
          <Path
            d="M 0 0 C -30 -60, -35 -160, 0 -170 C 35 -160, 30 -60, 0 0 Z"
            fill="url(#bunnyWhite)"
            stroke="#d4d4d8"
            strokeWidth="1.5"
          />
          {/* Inner Pink Ear */}
          <Path
            d="M 0 -15 C -18 -60, -20 -140, 0 -150 C 20 -140, 18 -60, 0 -15 Z"
            fill="url(#bunnyPink)"
            opacity="0.8"
          />
        </G>

        {/* Right Bunny Ear */}
        <G
          transform={`translate(${headX + 40 * faceScale}, ${headY - 60 * faceScale}) rotate(${
            12 + twitchR
          }) scale(${faceScale * 1.1})`}
        >
          <Path
            d="M 0 0 C -30 -60, -35 -160, 0 -170 C 35 -160, 30 -60, 0 0 Z"
            fill="url(#bunnyWhite)"
            stroke="#d4d4d8"
            strokeWidth="1.5"
          />
          <Path
            d="M 0 -15 C -18 -60, -20 -140, 0 -150 C 20 -140, 18 -60, 0 -15 Z"
            fill="url(#bunnyPink)"
            opacity="0.8"
          />
        </G>

        {/* Whiskers (Left & Right) */}
        <G stroke="#ffffff" strokeWidth="2.5" opacity="0.9" strokeLinecap="round">
          {/* Left whiskers */}
          <Path d={`M ${noseX - 18 * faceScale} ${noseY - 2 * faceScale} L ${noseX - 85 * faceScale} ${noseY - 14 * faceScale}`} />
          <Path d={`M ${noseX - 18 * faceScale} ${noseY + 4 * faceScale} L ${noseX - 88 * faceScale} ${noseY + 6 * faceScale}`} />
          <Path d={`M ${noseX - 18 * faceScale} ${noseY + 10 * faceScale} L ${noseX - 82 * faceScale} ${noseY + 24 * faceScale}`} />
          {/* Right whiskers */}
          <Path d={`M ${noseX + 18 * faceScale} ${noseY - 2 * faceScale} L ${noseX + 85 * faceScale} ${noseY - 14 * faceScale}`} />
          <Path d={`M ${noseX + 18 * faceScale} ${noseY + 4 * faceScale} L ${noseX + 88 * faceScale} ${noseY + 6 * faceScale}`} />
          <Path d={`M ${noseX + 18 * faceScale} ${noseY + 10 * faceScale} L ${noseX + 82 * faceScale} ${noseY + 24 * faceScale}`} />
        </G>

        {/* Bunny Heart Nose */}
        <G transform={`translate(${noseX}, ${noseY}) scale(${faceScale * 0.85})`}>
          <Path
            d="M 0 10 C -12 0, -18 -12, -7 -18 C 0 -15, 0 -10, 0 -7 C 0 -10, 0 -15, 7 -18 C 18 -12, 12 0, 0 10 Z"
            fill="#f472b6"
          />
        </G>

        {/* Cheek blushes */}
        <Circle cx={noseX - 50 * faceScale} cy={noseY + 15 * faceScale} r={18 * faceScale} fill="#f472b6" opacity="0.38" />
        <Circle cx={noseX + 50 * faceScale} cy={noseY + 15 * faceScale} r={18 * faceScale} fill="#f472b6" opacity="0.38" />
      </Svg>
    </View>
  );
};

/**
 * Funny Glasses & Groucho Mustache Overlay
 */
export const FunnyGlassesOverlay: React.FC<OverlayProps> = ({
  landmarks,
  canvasWidth,
  canvasHeight,
}) => {
  const eyeLeftX = landmarks.leftEye.x * canvasWidth;
  const eyeLeftY = landmarks.leftEye.y * canvasHeight;
  const eyeRightX = landmarks.rightEye.x * canvasWidth;
  const eyeRightY = landmarks.rightEye.y * canvasHeight;
  const noseY = landmarks.nose.y * canvasHeight;
  const mouthX = landmarks.mouth.x * canvasWidth;
  const mouthY = landmarks.mouth.y * canvasHeight;

  const eyeDist = Math.hypot(eyeRightX - eyeLeftX, eyeRightY - eyeLeftY);
  const glassesCenter = {
    x: (eyeLeftX + eyeRightX) / 2,
    y: (eyeLeftY + eyeRightY) / 2,
  };
  const glassesScale = eyeDist / 90;
  const angle = Math.atan2(eyeRightY - eyeLeftY, eyeRightX - eyeLeftX) * (180 / Math.PI);

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="neonLensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#ec4899" />
            <Stop offset="50%" stopColor="#8b5cf6" />
            <Stop offset="100%" stopColor="#06b6d4" />
          </LinearGradient>
          <LinearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#facc15" />
            <Stop offset="100%" stopColor="#eab308" />
          </LinearGradient>
        </Defs>

        {/* Funky Sunglasses */}
        <G
          transform={`translate(${glassesCenter.x}, ${glassesCenter.y}) rotate(${angle}) scale(${glassesScale * 1.15})`}
        >
          {/* Bridge */}
          <Path d="M -15 -5 Q 0 -12 15 -5" stroke="url(#frameGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />

          {/* Left Frame & Lens */}
          <G transform="translate(-42, 0)">
            <Path
              d="M -30 -18 L 30 -18 C 32 10, 24 28, 0 30 C -24 28, -32 10, -30 -18 Z"
              fill="url(#neonLensGrad)"
              stroke="url(#frameGrad)"
              strokeWidth="5"
            />
            {/* Lens Reflection lines */}
            <Path d="M -15 -10 L -5 18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <Path d="M -8 -10 L -1 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            {/* Fun star sparkle */}
            <Path d="M 12 -5 L 14 -1 L 18 -1 L 15 2 L 16 6 L 12 3 L 8 6 L 9 2 L 6 -1 L 10 -1 Z" fill="#ffffff" opacity="0.75" />
          </G>

          {/* Right Frame & Lens */}
          <G transform="translate(42, 0)">
            <Path
              d="M -30 -18 L 30 -18 C 32 10, 24 28, 0 30 C -24 28, -32 10, -30 -18 Z"
              fill="url(#neonLensGrad)"
              stroke="url(#frameGrad)"
              strokeWidth="5"
            />
            <Path d="M -15 -10 L -5 18" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            <Path d="M -8 -10 L -1 12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            <Path d="M 12 -5 L 14 -1 L 18 -1 L 15 2 L 16 6 L 12 3 L 8 6 L 9 2 L 6 -1 L 10 -1 Z" fill="#ffffff" opacity="0.75" />
          </G>

          {/* Eyebrows attached to frame */}
          <Path
            d="M -75 -24 Q -45 -34 -15 -22"
            stroke="#18181b"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 15 -22 Q 45 -34 75 -24"
            stroke="#18181b"
            strokeWidth="9"
            strokeLinecap="round"
            fill="none"
          />
        </G>

        {/* Groucho Mustache */}
        <G
          transform={`translate(${mouthX}, ${(noseY + mouthY) / 2}) rotate(${angle}) scale(${glassesScale * 1.05})`}
        >
          <Path
            d="M 0 0 C -15 -14, -40 -12, -55 2 C -40 24, -10 12, 0 4 C 10 12, 40 24, 55 2 C 40 -12, 15 -14, 0 0 Z"
            fill="#18181b"
          />
        </G>
      </Svg>
    </View>
  );
};

/**
 * Alien Extraterrestrial Antennae, Cosmic Glow & Eyes Overlay
 */
export const AlienOverlay: React.FC<OverlayProps> = ({
  landmarks,
  canvasWidth,
  canvasHeight,
  animationTick = 0,
}) => {
  const headX = landmarks.forehead.x * canvasWidth;
  const headY = landmarks.forehead.y * canvasHeight;
  const eyeLeftX = landmarks.leftEye.x * canvasWidth;
  const eyeLeftY = landmarks.leftEye.y * canvasHeight;
  const eyeRightX = landmarks.rightEye.x * canvasWidth;
  const eyeRightY = landmarks.rightEye.y * canvasHeight;
  const faceScale = (landmarks.faceWidth * canvasWidth) / 200;

  // Pulse glow
  const glowPulse = 0.5 + Math.sin(animationTick * 0.1) * 0.3;
  const orbRadius = 14 + Math.sin(animationTick * 0.15) * 3;

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      <Svg width={canvasWidth} height={canvasHeight} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="alienGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#4ade80" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#22c55e" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="#15803d" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="alienEyeGrad" cx="40%" cy="35%" r="65%">
            <Stop offset="0%" stopColor="#1e293b" />
            <Stop offset="60%" stopColor="#0f172a" />
            <Stop offset="100%" stopColor="#020617" />
          </RadialGradient>
        </Defs>

        {/* Alien Antennae */}
        <G transform={`translate(${headX}, ${headY - 30 * faceScale}) scale(${faceScale})`}>
          {/* Left Antenna Stem */}
          <Path
            d="M -30 0 Q -55 -40, -50 -75"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Left Glowing Orb */}
          <Circle cx="-50" cy="-75" r={orbRadius * 1.8} fill="url(#alienGlow)" opacity={glowPulse} />
          <Circle cx="-50" cy="-75" r={orbRadius} fill="#4ade80" />
          <Circle cx="-53" cy="-78" r={orbRadius * 0.35} fill="#ffffff" />

          {/* Right Antenna Stem */}
          <Path
            d="M 30 0 Q 55 -40, 50 -75"
            stroke="#22c55e"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Right Glowing Orb */}
          <Circle cx="50" cy="-75" r={orbRadius * 1.8} fill="url(#alienGlow)" opacity={glowPulse} />
          <Circle cx="50" cy="-75" r={orbRadius} fill="#4ade80" />
          <Circle cx="47" cy="-78" r={orbRadius * 0.35} fill="#ffffff" />
        </G>

        {/* Large Extraterrestrial Almond Eyes */}
        <G transform={`translate(${eyeLeftX}, ${eyeLeftY}) rotate(-18) scale(${faceScale * 0.9})`}>
          <Path
            d="M -32 0 C -20 -28, 20 -28, 32 0 C 20 28, -20 28, -32 0 Z"
            fill="url(#alienEyeGrad)"
            stroke="#4ade80"
            strokeWidth="2"
          />
          <Ellipse cx="-10" cy="-6" rx="9" ry="5" fill="#ffffff" opacity="0.75" />
          <Ellipse cx="10" cy="6" rx="4" ry="2" fill="#4ade80" opacity="0.6" />
        </G>

        <G transform={`translate(${eyeRightX}, ${eyeRightY}) rotate(18) scale(${faceScale * 0.9})`}>
          <Path
            d="M -32 0 C -20 -28, 20 -28, 32 0 C 20 28, -20 28, -32 0 Z"
            fill="url(#alienEyeGrad)"
            stroke="#4ade80"
            strokeWidth="2"
          />
          <Ellipse cx="-10" cy="-6" rx="9" ry="5" fill="#ffffff" opacity="0.75" />
          <Ellipse cx="10" cy="6" rx="4" ry="2" fill="#4ade80" opacity="0.6" />
        </G>
      </Svg>
    </View>
  );
};
