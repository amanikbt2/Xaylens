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
  ({ lensId, size, isSelected = false }) => {
    return (
      <View style={[styles.avatarContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            {/* Gradients for avatars */}
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
          </Defs>

          {/* 1. ALIEN AVATAR */}
          {lensId === 'alien' && (
            <G>
              <Rect width="100" height="100" fill="url(#alienBg)" />
              {/* Glowing alien head */}
              <Path
                d="M 50 18 C 30 18, 22 36, 26 58 C 30 76, 42 88, 50 88 C 58 88, 70 76, 74 58 C 78 36, 70 18, 50 18 Z"
                fill="url(#alienHeadGrad)"
              />
              {/* Slanted large black eyes */}
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
              {/* Eye catchlights */}
              <Circle cx="36" cy="46" r="3" fill="#ffffff" opacity="0.8" />
              <Circle cx="60" cy="46" r="3" fill="#ffffff" opacity="0.8" />
              {/* Tiny nostrils */}
              <Circle cx="47" cy="68" r="1.5" fill="#14532d" />
              <Circle cx="53" cy="68" r="1.5" fill="#14532d" />
            </G>
          )}

          {/* 2. BIG EYES / ANIME DISTORTION */}
          {lensId === 'big-eyes' && (
            <G>
              <Rect width="100" height="100" fill="url(#bigEyesBg)" />
              {/* Face silhouette */}
              <Ellipse cx="50" cy="54" rx="30" ry="34" fill="url(#skinTone)" />
              {/* Giant glowing anime/bug eyes */}
              <Circle cx="35" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="65" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="35" cy="48" r="9" fill="#0369a1" />
              <Circle cx="65" cy="48" r="9" fill="#0369a1" />
              <Circle cx="35" cy="48" r="5" fill="#020617" />
              <Circle cx="65" cy="48" r="5" fill="#020617" />
              {/* Big sparkling highlights */}
              <Circle cx="32" cy="44" r="4.5" fill="#ffffff" />
              <Circle cx="62" cy="44" r="4.5" fill="#ffffff" />
              <Circle cx="38" cy="51" r="2" fill="#ffffff" />
              <Circle cx="68" cy="51" r="2" fill="#ffffff" />
              {/* Cute smile */}
              <Path d="M 44 72 Q 50 78 56 72" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* 3. BIG NOSE */}
          {lensId === 'big-nose' && (
            <G>
              <Rect width="100" height="100" fill="url(#bigNoseBg)" />
              <Ellipse cx="50" cy="52" rx="30" ry="34" fill="url(#skinTone)" />
              {/* Eyes */}
              <Circle cx="37" cy="42" r="4" fill="#1c1917" />
              <Circle cx="63" cy="42" r="4" fill="#1c1917" />
              {/* Massive giant bulbous cartoon nose */}
              <Circle cx="50" cy="58" r="19" fill="#f59e0b" />
              <Ellipse cx="38" cy="62" rx="7" ry="5.5" fill="#d97706" />
              <Ellipse cx="62" cy="62" rx="7" ry="5.5" fill="#d97706" />
              <Circle cx="44" cy="54" r="4" fill="#ffffff" opacity="0.6" />
              {/* Smile below nose */}
              <Path d="M 42 78 Q 50 83 58 78" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* 4. TINY FACE */}
          {lensId === 'tiny-face' && (
            <G>
              <Rect width="100" height="100" fill="url(#tinyFaceBg)" />
              {/* Large head */}
              <Ellipse cx="50" cy="52" rx="36" ry="38" fill="url(#skinTone)" />
              {/* Miniature cluster of facial features right in center */}
              <Circle cx="45" cy="50" r="2.5" fill="#1c1917" />
              <Circle cx="55" cy="50" r="2.5" fill="#1c1917" />
              <Circle cx="50" cy="55" r="2" fill="#ea580c" />
              <Path d="M 47 60 Q 50 63 53 60" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* 5. WIDE FACE */}
          {lensId === 'wide-face' && (
            <G>
              <Rect width="100" height="100" fill="url(#wideFaceBg)" />
              {/* Comically wide horizontally stretched head */}
              <Ellipse cx="50" cy="54" rx="42" ry="26" fill="url(#skinTone)" />
              <Circle cx="30" cy="50" r="4" fill="#1c1917" />
              <Circle cx="70" cy="50" r="4" fill="#1c1917" />
              <Path d="M 46 56 Q 50 58 54 56" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" fill="none" />
              {/* Ultra wide grin */}
              <Path d="M 28 64 Q 50 78 72 64" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* 6. BIG MOUTH */}
          {lensId === 'big-mouth' && (
            <G>
              <Rect width="100" height="100" fill="url(#bigMouthBg)" />
              <Ellipse cx="50" cy="50" rx="30" ry="34" fill="url(#skinTone)" />
              <Circle cx="37" cy="38" r="4" fill="#1c1917" />
              <Circle cx="63" cy="38" r="4" fill="#1c1917" />
              {/* Huge cartoon open mouth with teeth */}
              <Path
                d="M 24 54 C 24 78, 76 78, 76 54 C 62 50, 38 50, 24 54 Z"
                fill="#881337"
              />
              {/* Top teeth */}
              <Path
                d="M 30 54 L 70 54 C 68 60, 32 60, 30 54 Z"
                fill="#ffffff"
              />
              {/* Pink tongue */}
              <Ellipse cx="50" cy="70" rx="14" ry="7" fill="#fb7185" />
            </G>
          )}

          {/* 7. SWIRL TWIST / DISTORTION */}
          {lensId === 'swirl-face' && (
            <G>
              <Rect width="100" height="100" fill="url(#swirlBg)" />
              <Ellipse cx="50" cy="52" rx="30" ry="34" fill="url(#skinTone)" />
              {/* Hypnotic vortex swirl spiral across face */}
              <Path
                d="M 50 52 C 40 40, 65 35, 68 50 C 70 65, 40 70, 32 55 C 26 40, 60 25, 76 42"
                stroke="#c084fc"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <Circle cx="50" cy="52" r="5" fill="#a855f7" />
            </G>
          )}

          {/* 8. PUPPY */}
          {lensId === 'puppy' && (
            <G>
              <Rect width="100" height="100" fill="url(#puppyBg)" />
              <Ellipse cx="50" cy="56" rx="28" ry="30" fill="url(#skinTone)" />
              {/* Floppy puppy ears */}
              <Path d="M 22 28 C 12 38, 10 65, 24 70 C 32 62, 30 38, 22 28 Z" fill="#854d0e" />
              <Path d="M 78 28 C 88 38, 90 65, 76 70 C 68 62, 70 38, 78 28 Z" fill="#854d0e" />
              {/* Eyes */}
              <Circle cx="39" cy="50" r="4.5" fill="#1c1917" />
              <Circle cx="61" cy="50" r="4.5" fill="#1c1917" />
              {/* Puppy black snout */}
              <Ellipse cx="50" cy="62" rx="11" ry="8" fill="#18181b" />
              <Circle cx="48" cy="60" r="2.5" fill="#ffffff" opacity="0.6" />
              {/* Cute panting tongue */}
              <Path d="M 45 70 C 44 80, 56 80, 55 70 Z" fill="#fb7185" />
            </G>
          )}

          {/* 9. BUNNY */}
          {lensId === 'bunny' && (
            <G>
              <Rect width="100" height="100" fill="url(#bunnyBg)" />
              {/* Tall bunny ears */}
              <Path d="M 36 34 C 28 12, 32 -4, 40 -4 C 48 -4, 50 12, 44 34 Z" fill="#ffffff" />
              <Path d="M 38 30 C 33 14, 36 2, 40 2 C 44 2, 46 14, 42 30 Z" fill="#f472b6" />
              <Path d="M 64 34 C 56 12, 58 -4, 66 -4 C 74 -4, 76 12, 68 34 Z" fill="#ffffff" />
              <Path d="M 62 30 C 58 14, 60 2, 66 2 C 72 2, 72 14, 64 30 Z" fill="#f472b6" />
              {/* Face */}
              <Ellipse cx="50" cy="58" rx="28" ry="28" fill="url(#skinTone)" />
              <Circle cx="38" cy="54" r="4" fill="#1c1917" />
              <Circle cx="62" cy="54" r="4" fill="#1c1917" />
              {/* Heart nose */}
              <Path d="M 50 63 L 47 60 A 2 2 0 0 1 50 58 A 2 2 0 0 1 53 60 Z" fill="#f472b6" />
              {/* Whiskers */}
              <Path d="M 36 64 L 20 62 M 36 66 L 19 67" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <Path d="M 64 64 L 80 62 M 64 66 L 81 67" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </G>
          )}

          {/* 10. NEON SHADES */}
          {lensId === 'funny-glasses' && (
            <G>
              <Rect width="100" height="100" fill="url(#shadesBg)" />
              <Ellipse cx="50" cy="54" rx="28" ry="32" fill="url(#skinTone)" />
              {/* Cool neon pixel/wayfarer sunglasses */}
              <Rect x="20" y="42" width="26" height="18" rx="4" fill="#ec4899" stroke="#facc15" strokeWidth="2.5" />
              <Rect x="54" y="42" width="26" height="18" rx="4" fill="#06b6d4" stroke="#facc15" strokeWidth="2.5" />
              <Rect x="46" y="47" width="8" height="4" fill="#facc15" />
              {/* Glare line */}
              <Path d="M 24 45 L 32 56" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              <Path d="M 58 45 L 66 56" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
              {/* Smile */}
              <Path d="M 42 72 Q 50 78 58 72" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </G>
          )}

          {/* 11. NATURAL / DEFAULT */}
          {lensId === 'normal' && (
            <G>
              <Rect width="100" height="100" fill="#18181b" />
              <Circle cx="50" cy="50" r="34" stroke="rgba(255,255,255,0.3)" strokeWidth="2" fill="rgba(255,255,255,0.06)" />
              <Circle cx="50" cy="50" r="22" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              <Circle cx="50" cy="50" r="10" fill="#ffffff" />
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
