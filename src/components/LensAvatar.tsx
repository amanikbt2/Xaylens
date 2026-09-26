import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Circle,
  Ellipse,
  Path,
  G,
  Rect,
} from 'react-native-svg';

interface LensAvatarProps {
  lensId: string;
  size: number;
  isSelected?: boolean;
}

export const LensAvatar: React.FC<LensAvatarProps> = React.memo(
  ({ lensId, size }) => {
    // Generate harmonious seed colors for any secondary lens
    const hash = lensId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue1 = (hash * 37) % 360;
    const hue2 = (hue1 + 45) % 360;
    const gradColor1 = `hsl(${hue1}, 75%, 28%)`;
    const gradColor2 = `hsl(${hue2}, 85%, 16%)`;
    const accentColor = `hsl(${hue1}, 90%, 65%)`;

    return (
      <View
        style={[
          styles.avatarContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            <LinearGradient id="alienBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#022c22" />
              <Stop offset="50%" stopColor="#064e3b" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>
            <RadialGradient id="alienHeadGrad" cx="50%" cy="40%" r="55%">
              <Stop offset="0%" stopColor="#86efac" />
              <Stop offset="50%" stopColor="#22c55e" />
              <Stop offset="100%" stopColor="#15803d" />
            </RadialGradient>

            <LinearGradient id="bigEyesBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1e1b4b" />
              <Stop offset="60%" stopColor="#0f172a" />
              <Stop offset="100%" stopColor="#082f49" />
            </LinearGradient>

            <LinearGradient id="tinyFaceBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#581c87" />
              <Stop offset="60%" stopColor="#3b0764" />
              <Stop offset="100%" stopColor="#1e1b4b" />
            </LinearGradient>

            <LinearGradient id="wideFaceBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#064e3b" />
              <Stop offset="60%" stopColor="#134e4a" />
              <Stop offset="100%" stopColor="#022c22" />
            </LinearGradient>

            <LinearGradient id="bigNoseBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#78350f" />
              <Stop offset="60%" stopColor="#451a03" />
              <Stop offset="100%" stopColor="#1c1917" />
            </LinearGradient>

            <LinearGradient id="bigMouthBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#881337" />
              <Stop offset="60%" stopColor="#4c0519" />
              <Stop offset="100%" stopColor="#1c1917" />
            </LinearGradient>

            <LinearGradient id="swirlBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#4c1d95" />
              <Stop offset="60%" stopColor="#2e1065" />
              <Stop offset="100%" stopColor="#0f172a" />
            </LinearGradient>

            <LinearGradient id="puppyBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#78350f" />
              <Stop offset="60%" stopColor="#451a03" />
              <Stop offset="100%" stopColor="#1c1917" />
            </LinearGradient>

            <LinearGradient id="bunnyBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#831843" />
              <Stop offset="60%" stopColor="#500724" />
              <Stop offset="100%" stopColor="#1e1b4b" />
            </LinearGradient>

            <LinearGradient id="shadesBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0c4a6e" />
              <Stop offset="60%" stopColor="#164e63" />
              <Stop offset="100%" stopColor="#0f172a" />
            </LinearGradient>

            <LinearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fed7aa" />
              <Stop offset="100%" stopColor="#fba668" />
            </LinearGradient>

            <LinearGradient id={`genBg_${lensId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradColor1} />
              <Stop offset="100%" stopColor={gradColor2} />
            </LinearGradient>
          </Defs>

          {/* 1. ALIEN AVATAR */}
          {lensId === 'alien' ? (
            <G>
              <Rect width="100" height="100" fill="url(#alienBg)" />
              <Path
                d="M 50 18 C 30 18, 22 36, 26 58 C 30 76, 42 88, 50 88 C 58 88, 70 76, 74 58 C 78 36, 70 18, 50 18 Z"
                fill="url(#alienHeadGrad)"
              />
              <Ellipse
                cx="38"
                cy="50"
                rx="9"
                ry="15"
                transform="rotate(-24 38 50)"
                fill="#020617"
              />
              <Ellipse
                cx="62"
                cy="50"
                rx="9"
                ry="15"
                transform="rotate(24 62 50)"
                fill="#020617"
              />
              <Circle cx="36" cy="46" r="3" fill="#ffffff" opacity="0.85" />
              <Circle cx="60" cy="46" r="3" fill="#ffffff" opacity="0.85" />
            </G>
          ) : lensId === 'big-eyes' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bigEyesBg)" />
              <Ellipse cx="50" cy="54" rx="30" ry="34" fill="url(#skinTone)" />
              <Circle cx="35" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="65" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="35" cy="48" r="8" fill="#020617" />
              <Circle cx="65" cy="48" r="8" fill="#020617" />
              <Circle cx="32" cy="44" r="4.5" fill="#ffffff" />
              <Circle cx="62" cy="44" r="4.5" fill="#ffffff" />
            </G>
          ) : lensId === 'big-nose' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bigNoseBg)" />
              <Ellipse cx="50" cy="52" rx="30" ry="34" fill="url(#skinTone)" />
              <Circle cx="37" cy="42" r="4" fill="#1c1917" />
              <Circle cx="63" cy="42" r="4" fill="#1c1917" />
              <Circle cx="50" cy="58" r="19" fill="#f59e0b" />
              <Circle cx="44" cy="54" r="4" fill="#ffffff" opacity="0.6" />
            </G>
          ) : lensId === 'tiny-face' ? (
            <G>
              <Rect width="100" height="100" fill="url(#tinyFaceBg)" />
              <Ellipse cx="50" cy="52" rx="36" ry="38" fill="url(#skinTone)" />
              <Circle cx="45" cy="50" r="2.5" fill="#1c1917" />
              <Circle cx="55" cy="50" r="2.5" fill="#1c1917" />
              <Circle cx="50" cy="55" r="2" fill="#ea580c" />
            </G>
          ) : lensId === 'wide-face' ? (
            <G>
              <Rect width="100" height="100" fill="url(#wideFaceBg)" />
              <Ellipse cx="50" cy="54" rx="42" ry="26" fill="url(#skinTone)" />
              <Circle cx="30" cy="50" r="4" fill="#1c1917" />
              <Circle cx="70" cy="50" r="4" fill="#1c1917" />
              <Path d="M 28 64 Q 50 78 72 64" stroke="#dc2626" strokeWidth="3" fill="none" />
            </G>
          ) : lensId === 'big-mouth' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bigMouthBg)" />
              <Ellipse cx="50" cy="50" rx="30" ry="34" fill="url(#skinTone)" />
              <Path d="M 24 54 C 24 78, 76 78, 76 54 Z" fill="#881337" />
              <Path d="M 30 54 L 70 54 C 68 60, 32 60, 30 54 Z" fill="#ffffff" />
            </G>
          ) : lensId === 'swirl-face' ? (
            <G>
              <Rect width="100" height="100" fill="url(#swirlBg)" />
              <Ellipse cx="50" cy="52" rx="30" ry="34" fill="url(#skinTone)" />
              <Path
                d="M 50 52 C 40 40, 65 35, 68 50 C 70 65, 40 70, 32 55 C 26 40, 60 25, 76 42"
                stroke="#c084fc"
                strokeWidth="4"
                fill="none"
              />
            </G>
          ) : lensId === 'puppy' ? (
            <G>
              <Rect width="100" height="100" fill="url(#puppyBg)" />
              <Ellipse cx="50" cy="56" rx="28" ry="30" fill="url(#skinTone)" />
              <Path d="M 22 28 C 12 38, 10 65, 24 70 Z" fill="#854d0e" />
              <Path d="M 78 28 C 88 38, 90 65, 76 70 Z" fill="#854d0e" />
              <Ellipse cx="50" cy="62" rx="11" ry="8" fill="#18181b" />
            </G>
          ) : lensId === 'bunny' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bunnyBg)" />
              <Path d="M 36 34 C 28 12, 32 -4, 40 -4 C 48 -4, 50 12, 44 34 Z" fill="#ffffff" />
              <Path d="M 64 34 C 56 12, 58 -4, 66 -4 C 74 -4, 76 12, 68 34 Z" fill="#ffffff" />
              <Ellipse cx="50" cy="58" rx="28" ry="28" fill="url(#skinTone)" />
            </G>
          ) : lensId === 'funny-glasses' ? (
            <G>
              <Rect width="100" height="100" fill="url(#shadesBg)" />
              <Ellipse cx="50" cy="54" rx="28" ry="32" fill="url(#skinTone)" />
              <Rect x="20" y="42" width="26" height="18" rx="4" fill="#ec4899" stroke="#facc15" strokeWidth="2" />
              <Rect x="54" y="42" width="26" height="18" rx="4" fill="#06b6d4" stroke="#facc15" strokeWidth="2" />
            </G>
          ) : lensId === 'normal' ? (
            <G>
              <Rect width="100" height="100" fill="#18181b" />
              <Circle cx="50" cy="50" r="32" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
              <Circle cx="50" cy="50" r="20" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              <Circle cx="50" cy="50" r="9" fill="#ffffff" />
            </G>
          ) : (
            // Stylish Colorful Portrait Avatar Fallback for all other lenses
            <G>
              <Rect width="100" height="100" fill={`url(#genBg_${lensId})`} />
              <Ellipse cx="50" cy="54" rx="28" ry="32" fill="url(#skinTone)" />
              <Circle cx="39" cy="48" r="4.5" fill="#0f172a" />
              <Circle cx="61" cy="48" r="4.5" fill="#0f172a" />
              <Circle cx="37" cy="46" r="1.5" fill="#ffffff" />
              <Circle cx="59" cy="46" r="1.5" fill="#ffffff" />
              {/* Themed Forehead Halo / Emblem */}
              <Circle cx="50" cy="28" r="7" fill={accentColor} opacity="0.85" />
              <Path d="M 43 68 Q 50 74 57 68" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </G>
          )}
        </Svg>
      </View>
    );
  }
);

LensAvatar.displayName = 'LensAvatar';

const styles = StyleSheet.create({
  avatarContainer: {
    overflow: 'hidden',
    backgroundColor: '#09090b',
  },
});
