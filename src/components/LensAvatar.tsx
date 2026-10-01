import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
import { Lens } from '../types/lens';

interface LensAvatarProps {
  lensId: string;
  size: number;
  isSelected?: boolean;
  lens?: Pick<Lens, 'category' | 'accentColor' | 'iconName'>;
}

export const LensAvatar: React.FC<LensAvatarProps> = React.memo(
  ({ lensId, size, lens }) => {
    // Generate harmonious seed colors for any generic/fallback lens
    const hash = lensId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue1 = (hash * 37) % 360;
    const hue2 = (hue1 + 50) % 360;
    const gradColor1 = `hsl(${hue1}, 75%, 26%)`;
    const gradColor2 = `hsl(${hue2}, 85%, 14%)`;
    const accentColor = `hsl(${hue1}, 90%, 65%)`;
    const fallbackAccent = lens?.accentColor || accentColor;
    const fallbackBackground =
      lens?.category === 'animal'
        ? '#172554'
        : lens?.category === 'creature'
        ? '#241044'
        : lens?.category === 'style'
        ? '#111827'
        : lens?.category === 'classic'
        ? '#1f2937'
        : lens?.category === 'background'
        ? '#064e3b'
        : gradColor2;
    const fallbackIcon = (lens?.iconName || 'sparkles-outline') as keyof typeof Ionicons.glyphMap;
    const hasCustomArtwork = [
      'explore-more', 'normal', 'alien', 'angel-halo', 'bg-beach', 'bg-city', 'bg-cozy-room',
      'bg-forest', 'bg-mountains', 'bg-sunset', 'big-eyes', 'big-nose', 'bunny', 'demon-horns',
      'fox-spirit', 'froggy', 'gigachad', 'kitty-cat', 'koala', 'lion-king', 'neon-cyborg',
      'panda-bear', 'puffy-cheeks', 'puppy', 'synthwave-80s', 'teddy-bear', 'tiger-stripes',
    ].includes(lensId);

    return (
      <View
        style={[
          styles.avatarContainer,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Defs>
            {/* Gradients */}
            <LinearGradient id="skinTone" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#fed7aa" />
              <Stop offset="100%" stopColor="#fba668" />
            </LinearGradient>

            <LinearGradient id="exploreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#facc15" />
              <Stop offset="50%" stopColor="#06b6d4" />
              <Stop offset="100%" stopColor="#8b5cf6" />
            </LinearGradient>

            <LinearGradient id="alienBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#022c22" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>

            <RadialGradient id="alienHeadGrad" cx="50%" cy="40%" r="55%">
              <Stop offset="0%" stopColor="#86efac" />
              <Stop offset="60%" stopColor="#22c55e" />
              <Stop offset="100%" stopColor="#15803d" />
            </RadialGradient>

            <LinearGradient id="foxBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#431407" />
              <Stop offset="100%" stopColor="#1c1917" />
            </LinearGradient>

            <LinearGradient id="pandaBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#1e293b" />
              <Stop offset="100%" stopColor="#090d16" />
            </LinearGradient>

            <LinearGradient id="frogBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#064e3b" />
              <Stop offset="100%" stopColor="#022c22" />
            </LinearGradient>

            <LinearGradient id="lionBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#78350f" />
              <Stop offset="100%" stopColor="#291104" />
            </LinearGradient>

            <LinearGradient id="tigerBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7c2d12" />
              <Stop offset="100%" stopColor="#1c1917" />
            </LinearGradient>

            <LinearGradient id="koalaBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#334155" />
              <Stop offset="100%" stopColor="#0f172a" />
            </LinearGradient>

            <LinearGradient id="cyberBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#082f49" />
              <Stop offset="100%" stopColor="#020617" />
            </LinearGradient>

            <LinearGradient id="demonBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#7f1d1d" />
              <Stop offset="100%" stopColor="#180404" />
            </LinearGradient>

            <LinearGradient id="synthBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#701a75" />
              <Stop offset="100%" stopColor="#1e1b4b" />
            </LinearGradient>

            <LinearGradient id="bgForest" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#166534" />
              <Stop offset="100%" stopColor="#052e16" />
            </LinearGradient>
            <LinearGradient id="bgBeach" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#38bdf8" />
              <Stop offset="65%" stopColor="#bae6fd" />
              <Stop offset="66%" stopColor="#0e7490" />
              <Stop offset="100%" stopColor="#fef3c7" />
            </LinearGradient>
            <LinearGradient id="bgMountains" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#7dd3fc" />
              <Stop offset="100%" stopColor="#334155" />
            </LinearGradient>
            <LinearGradient id="bgSunset" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#fb7185" />
              <Stop offset="60%" stopColor="#f97316" />
              <Stop offset="100%" stopColor="#431407" />
            </LinearGradient>
            <LinearGradient id="bgCity" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#312e81" />
              <Stop offset="100%" stopColor="#09090b" />
            </LinearGradient>
            <LinearGradient id="bgRoom" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#fef3c7" />
              <Stop offset="100%" stopColor="#7c2d12" />
            </LinearGradient>

            <LinearGradient id={`genBg_${lensId}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={gradColor1} />
              <Stop offset="100%" stopColor={gradColor2} />
            </LinearGradient>
          </Defs>

          {/* 0. SPECIAL EXPLORE LAUNCHER ICON */}
          {lensId === 'explore-more' ? (
            <G>
              <Rect width="100" height="100" fill="url(#exploreGrad)" />
              <Circle cx="46" cy="46" r="20" stroke="#ffffff" strokeWidth="4.5" fill="rgba(255,255,255,0.18)" />
              <Path d="M 60 60 L 76 76" stroke="#ffffff" strokeWidth="5.5" strokeLinecap="round" />
              {/* Sparkles */}
              <Path d="M 32 24 L 35 29 L 40 32 L 35 35 L 32 40 L 29 35 L 24 32 L 29 29 Z" fill="#ffffff" />
              <Path d="M 68 30 L 70 33 L 73 35 L 70 37 L 68 40 L 66 37 L 63 35 L 66 33 Z" fill="#facc15" />
            </G>
          ) : /* 1. NORMAL / NATURAL */
          lensId === 'normal' ? (
            <G>
              <Rect width="100" height="100" fill="#18181b" />
              <Circle cx="50" cy="50" r="32" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none" />
              <Circle cx="50" cy="50" r="21" stroke="#ffffff" strokeWidth="2.5" fill="none" />
              <Circle cx="50" cy="50" r="9" fill="#ffffff" />
            </G>
          ) : /* 2. FOX SPIRIT (from user's screenshot) */
          lensId === 'fox-spirit' ? (
            <G>
              <Rect width="100" height="100" fill="url(#foxBg)" />
              {/* Fox Ears */}
              <Path d="M 22 42 L 32 10 L 48 36 Z" fill="#ea580c" stroke="#fb923c" strokeWidth="2" />
              <Path d="M 28 38 L 33 20 L 42 36 Z" fill="#ffffff" />
              <Path d="M 78 42 L 68 10 L 52 36 Z" fill="#ea580c" stroke="#fb923c" strokeWidth="2" />
              <Path d="M 72 38 L 67 20 L 58 36 Z" fill="#ffffff" />
              {/* Face */}
              <Ellipse cx="50" cy="56" rx="28" ry="26" fill="#ea580c" />
              <Path d="M 28 62 C 32 78, 50 82, 50 82 C 50 82, 68 78, 72 62 C 64 58, 36 58, 28 62 Z" fill="#ffffff" />
              {/* Eyes & Nose */}
              <Path d="M 36 50 Q 42 46 45 52" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              <Path d="M 64 50 Q 58 46 55 52" stroke="#1c1917" strokeWidth="2.5" fill="none" />
              <Circle cx="50" cy="65" r="3" fill="#1c1917" />
              {/* Golden spirit diamond mark on forehead */}
              <Path d="M 50 36 L 53 41 L 50 46 L 47 41 Z" fill="#facc15" />
            </G>
          ) : /* 3. PANDA BEAR (from user's screenshot) */
          lensId === 'panda-bear' ? (
            <G>
              <Rect width="100" height="100" fill="url(#pandaBg)" />
              {/* Panda Ears */}
              <Circle cx="26" cy="28" r="14" fill="#0f172a" />
              <Circle cx="74" cy="28" r="14" fill="#0f172a" />
              {/* Face */}
              <Ellipse cx="50" cy="56" rx="30" ry="28" fill="#ffffff" />
              {/* Black Eye Patches */}
              <Ellipse cx="38" cy="52" rx="9" ry="12" transform="rotate(-15 38 52)" fill="#0f172a" />
              <Ellipse cx="62" cy="52" rx="9" ry="12" transform="rotate(15 62 52)" fill="#0f172a" />
              {/* Pupils */}
              <Circle cx="39" cy="51" r="3.5" fill="#ffffff" />
              <Circle cx="61" cy="51" r="3.5" fill="#ffffff" />
              <Circle cx="40" cy="50" r="1.5" fill="#0f172a" />
              <Circle cx="62" cy="50" r="1.5" fill="#0f172a" />
              {/* Nose & Mouth */}
              <Ellipse cx="50" cy="65" rx="4.5" ry="3.5" fill="#0f172a" />
              <Path d="M 45 71 Q 50 74 55 71" stroke="#0f172a" strokeWidth="2" fill="none" />
            </G>
          ) : /* 4. FROGGY EYES (from user's screenshot) */
          lensId === 'froggy' ? (
            <G>
              <Rect width="100" height="100" fill="url(#frogBg)" />
              {/* Perched Big Frog Eyes */}
              <Circle cx="32" cy="28" r="17" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              <Circle cx="68" cy="28" r="17" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              <Circle cx="32" cy="28" r="11" fill="#ffffff" />
              <Circle cx="68" cy="28" r="11" fill="#ffffff" />
              <Circle cx="33" cy="28" r="6" fill="#022c22" />
              <Circle cx="67" cy="28" r="6" fill="#022c22" />
              <Circle cx="31" cy="25" r="2.5" fill="#ffffff" />
              <Circle cx="65" cy="25" r="2.5" fill="#ffffff" />
              {/* Face */}
              <Ellipse cx="50" cy="62" rx="34" ry="26" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
              {/* Rosy Cheeks */}
              <Circle cx="28" cy="64" r="6" fill="#f43f5e" opacity="0.6" />
              <Circle cx="72" cy="64" r="6" fill="#f43f5e" opacity="0.6" />
              {/* Wide Frog Smile */}
              <Path d="M 32 66 Q 50 82 68 66" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" fill="none" />
            </G>
          ) : /* 5. ROYAL LION (from user's screenshot) */
          lensId === 'lion-king' ? (
            <G>
              <Rect width="100" height="100" fill="url(#lionBg)" />
              {/* Fluffy Big Lion Mane */}
              <Circle cx="50" cy="52" r="38" fill="#b45309" />
              <Circle cx="30" cy="30" r="16" fill="#b45309" />
              <Circle cx="70" cy="30" r="16" fill="#b45309" />
              <Circle cx="18" cy="52" r="15" fill="#b45309" />
              <Circle cx="82" cy="52" r="15" fill="#b45309" />
              <Circle cx="28" cy="72" r="14" fill="#b45309" />
              <Circle cx="72" cy="72" r="14" fill="#b45309" />
              {/* Lion Ears */}
              <Circle cx="28" cy="26" r="8" fill="#fef08a" />
              <Circle cx="72" cy="26" r="8" fill="#fef08a" />
              {/* Lion Face */}
              <Ellipse cx="50" cy="54" rx="25" ry="24" fill="#f59e0b" />
              {/* Eyes */}
              <Circle cx="40" cy="48" r="3.5" fill="#451a03" />
              <Circle cx="60" cy="48" r="3.5" fill="#451a03" />
              {/* Lion Snout & Whiskers */}
              <Ellipse cx="50" cy="64" rx="10" ry="7" fill="#fef08a" />
              <Path d="M 47 62 L 53 62 L 50 66 Z" fill="#451a03" />
              <Path d="M 34 65 L 24 64 M 34 68 L 24 70" stroke="#451a03" strokeWidth="1.5" />
              <Path d="M 66 65 L 76 64 M 66 68 L 76 70" stroke="#451a03" strokeWidth="1.5" />
            </G>
          ) : /* 6. TIGER STRIPES (from user's screenshot) */
          lensId === 'tiger-stripes' ? (
            <G>
              <Rect width="100" height="100" fill="url(#tigerBg)" />
              {/* Ears */}
              <Circle cx="25" cy="25" r="11" fill="#ea580c" />
              <Circle cx="25" cy="25" r="6" fill="#fef08a" />
              <Circle cx="75" cy="25" r="11" fill="#ea580c" />
              <Circle cx="75" cy="25" r="6" fill="#fef08a" />
              {/* Face */}
              <Ellipse cx="50" cy="55" rx="30" ry="28" fill="#f97316" />
              {/* Tiger Stripes */}
              <Path d="M 50 30 L 46 40 L 50 42 L 54 40 Z" fill="#1c1917" />
              <Path d="M 22 45 L 34 47 L 22 52 Z" fill="#1c1917" />
              <Path d="M 78 45 L 66 47 L 78 52 Z" fill="#1c1917" />
              <Path d="M 24 60 L 36 60 L 26 65 Z" fill="#1c1917" />
              <Path d="M 76 60 L 64 60 L 74 65 Z" fill="#1c1917" />
              {/* Eyes */}
              <Circle cx="38" cy="50" r="4" fill="#facc15" />
              <Circle cx="62" cy="50" r="4" fill="#facc15" />
              <Circle cx="38" cy="50" r="2" fill="#1c1917" />
              <Circle cx="62" cy="50" r="2" fill="#1c1917" />
              {/* Snout */}
              <Ellipse cx="50" cy="66" rx="9" ry="6" fill="#ffffff" />
              <Path d="M 47 64 L 53 64 L 50 67 Z" fill="#1c1917" />
            </G>
          ) : /* 7. KOALA CUTE (from user's screenshot) */
          lensId === 'koala' ? (
            <G>
              <Rect width="100" height="100" fill="url(#koalaBg)" />
              {/* Giant Fluffy Koala Ears */}
              <Circle cx="20" cy="34" r="17" fill="#64748b" />
              <Circle cx="20" cy="34" r="10" fill="#fbcfe8" />
              <Circle cx="80" cy="34" r="17" fill="#64748b" />
              <Circle cx="80" cy="34" r="10" fill="#fbcfe8" />
              {/* Face */}
              <Ellipse cx="50" cy="58" rx="28" ry="26" fill="#94a3b8" />
              {/* Eyes */}
              <Circle cx="36" cy="52" r="3.5" fill="#0f172a" />
              <Circle cx="64" cy="52" r="3.5" fill="#0f172a" />
              <Circle cx="35" cy="50.5" r="1.2" fill="#ffffff" />
              <Circle cx="63" cy="50.5" r="1.2" fill="#ffffff" />
              {/* Big Oval Dark Koala Nose */}
              <Ellipse cx="50" cy="64" rx="8" ry="12" fill="#0f172a" />
              <Circle cx="48" cy="60" r="2" fill="#ffffff" opacity="0.4" />
            </G>
          ) : /* 8. ANIME EYES */
          lensId === 'big-eyes' ? (
            <G>
              <Rect width="100" height="100" fill="#1e1b4b" />
              <Ellipse cx="50" cy="54" rx="30" ry="34" fill="url(#skinTone)" />
              <Circle cx="35" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="65" cy="48" r="14" fill="#38bdf8" />
              <Circle cx="35" cy="48" r="8" fill="#020617" />
              <Circle cx="65" cy="48" r="8" fill="#020617" />
              <Circle cx="32" cy="44" r="4.5" fill="#ffffff" />
              <Circle cx="62" cy="44" r="4.5" fill="#ffffff" />
            </G>
          ) : /* 9. BIG NOSE */
          lensId === 'big-nose' ? (
            <G>
              <Rect width="100" height="100" fill="#78350f" />
              <Ellipse cx="50" cy="52" rx="30" ry="34" fill="url(#skinTone)" />
              <Circle cx="37" cy="42" r="4" fill="#1c1917" />
              <Circle cx="63" cy="42" r="4" fill="#1c1917" />
              <Circle cx="50" cy="58" r="19" fill="#f59e0b" />
              <Circle cx="44" cy="54" r="4" fill="#ffffff" opacity="0.6" />
            </G>
          ) : /* 10. ALIEN */
          lensId === 'alien' ? (
            <G>
              <Rect width="100" height="100" fill="url(#alienBg)" />
              <Path
                d="M 50 18 C 30 18, 22 36, 26 58 C 30 76, 42 88, 50 88 C 58 88, 70 76, 74 58 C 78 36, 70 18, 50 18 Z"
                fill="url(#alienHeadGrad)"
              />
              <Ellipse cx="38" cy="50" rx="9" ry="15" transform="rotate(-24 38 50)" fill="#020617" />
              <Ellipse cx="62" cy="50" rx="9" ry="15" transform="rotate(24 62 50)" fill="#020617" />
              <Circle cx="36" cy="46" r="3" fill="#ffffff" opacity="0.85" />
              <Circle cx="60" cy="46" r="3" fill="#ffffff" opacity="0.85" />
            </G>
          ) : /* 11. PUPPY */
          lensId === 'puppy' ? (
            <G>
              <Rect width="100" height="100" fill="#78350f" />
              <Ellipse cx="50" cy="56" rx="28" ry="30" fill="url(#skinTone)" />
              <Path d="M 22 28 C 12 38, 10 65, 24 70 Z" fill="#854d0e" />
              <Path d="M 78 28 C 88 38, 90 65, 76 70 Z" fill="#854d0e" />
              <Ellipse cx="50" cy="62" rx="11" ry="8" fill="#18181b" />
            </G>
          ) : /* 12. BUNNY */
          lensId === 'bunny' ? (
            <G>
              <Rect width="100" height="100" fill="#831843" />
              <Path d="M 36 34 C 28 12, 32 -4, 40 -4 C 48 -4, 50 12, 44 34 Z" fill="#ffffff" />
              <Path d="M 64 34 C 56 12, 58 -4, 66 -4 C 74 -4, 76 12, 68 34 Z" fill="#ffffff" />
              <Ellipse cx="50" cy="58" rx="28" ry="28" fill="url(#skinTone)" />
            </G>
          ) : /* 13. GIGACHAD JAW */
          lensId === 'gigachad' ? (
            <G>
              <Rect width="100" height="100" fill="#0f172a" />
              {/* Chiseled Face */}
              <Path d="M 30 35 L 70 35 L 68 65 L 56 86 L 44 86 L 32 65 Z" fill="#f59e0b" />
              {/* Sharp Jaw Shading */}
              <Path d="M 32 65 L 44 86 L 56 86 L 68 65 L 60 74 L 50 78 L 40 74 Z" fill="#d97706" />
              {/* Cool Aviator Glasses */}
              <Path d="M 28 44 L 46 44 L 44 54 L 30 54 Z" fill="#020617" />
              <Path d="M 54 44 L 72 44 L 70 54 L 56 54 Z" fill="#020617" />
              <Path d="M 46 47 L 54 47" stroke="#fbbf24" strokeWidth="2" />
            </G>
          ) : /* 14. PUFFY CHEEKS */
          lensId === 'puffy-cheeks' ? (
            <G>
              <Rect width="100" height="100" fill="#831843" />
              <Circle cx="50" cy="52" r="26" fill="url(#skinTone)" />
              {/* Giant Rosy Balloon Cheeks */}
              <Circle cx="26" cy="60" r="16" fill="#fb7185" />
              <Circle cx="74" cy="60" r="16" fill="#fb7185" />
              <Circle cx="40" cy="46" r="3" fill="#1c1917" />
              <Circle cx="60" cy="46" r="3" fill="#1c1917" />
              <Circle cx="50" cy="58" r="4" fill="#e11d48" />
            </G>
          ) : /* 15. NEON CYBORG */
          lensId === 'neon-cyborg' ? (
            <G>
              <Rect width="100" height="100" fill="url(#cyberBg)" />
              <Ellipse cx="50" cy="52" rx="28" ry="32" fill="#475569" />
              {/* Cyber Half Plate */}
              <Path d="M 50 20 L 78 35 L 75 75 L 50 84 Z" fill="#0284c7" />
              {/* Glowing Red Laser Eye */}
              <Circle cx="64" cy="48" r="7" fill="#ef4444" />
              <Circle cx="64" cy="48" r="3" fill="#ffffff" />
              {/* Tech Visor lines */}
              <Path d="M 50 48 L 78 48" stroke="#38bdf8" strokeWidth="2" />
              <Circle cx="36" cy="48" r="4" fill="#0f172a" />
            </G>
          ) : /* 16. DEMON HORNS */
          lensId === 'demon-horns' ? (
            <G>
              <Rect width="100" height="100" fill="url(#demonBg)" />
              {/* Curved Crimson Horns */}
              <Path d="M 28 36 Q 16 12 34 6 Q 28 20 38 32 Z" fill="#dc2626" />
              <Path d="M 72 36 Q 84 12 66 6 Q 72 20 62 32 Z" fill="#dc2626" />
              <Ellipse cx="50" cy="56" rx="26" ry="28" fill="#991b1b" />
              {/* Fiery Eyes */}
              <Circle cx="40" cy="52" r="4.5" fill="#facc15" />
              <Circle cx="60" cy="52" r="4.5" fill="#facc15" />
              <Circle cx="40" cy="52" r="2" fill="#000000" />
              <Circle cx="60" cy="52" r="2" fill="#000000" />
            </G>
          ) : /* 17. ANGEL HALO */
          lensId === 'angel-halo' ? (
            <G>
              <Rect width="100" height="100" fill="#0f172a" />
              {/* Golden Floating Halo */}
              <Ellipse cx="50" cy="18" rx="24" ry="7" stroke="#facc15" strokeWidth="4" fill="none" />
              <Ellipse cx="50" cy="18" rx="22" ry="5.5" stroke="#fef08a" strokeWidth="1.5" fill="none" />
              <Ellipse cx="50" cy="56" rx="28" ry="30" fill="url(#skinTone)" />
              <Circle cx="38" cy="52" r="3.5" fill="#0f172a" />
              <Circle cx="62" cy="52" r="3.5" fill="#0f172a" />
              <Path d="M 44 68 Q 50 72 56 68" stroke="#dc2626" strokeWidth="2.5" fill="none" />
            </G>
          ) : /* 18. SYNTHWAVE 80s */
          lensId === 'synthwave-80s' ? (
            <G>
              <Rect width="100" height="100" fill="url(#synthBg)" />
              {/* Glowing Retro Sun */}
              <Circle cx="50" cy="46" r="26" fill="#f43f5e" />
              <Rect x="24" y="44" width="52" height="3" fill="url(#synthBg)" />
              <Rect x="26" y="52" width="48" height="4" fill="url(#synthBg)" />
              <Rect x="30" y="60" width="40" height="5" fill="url(#synthBg)" />
              {/* Cyber Grid Lines */}
              <Path d="M 10 90 L 90 90 M 20 82 L 80 82 M 50 72 L 50 100 M 50 72 L 18 100 M 50 72 L 82 100" stroke="#06b6d4" strokeWidth="1.5" />
            </G>
          ) : /* 19. KITTY CAT */
          lensId === 'kitty-cat' ? (
            <G>
              <Rect width="100" height="100" fill="#831843" />
              {/* Pointy Cat Ears */}
              <Path d="M 24 40 L 26 12 L 44 34 Z" fill="#f472b6" stroke="#fbcfe8" strokeWidth="2" />
              <Path d="M 28 36 L 29 18 L 40 32 Z" fill="#ffffff" />
              <Path d="M 76 40 L 74 12 L 56 34 Z" fill="#f472b6" stroke="#fbcfe8" strokeWidth="2" />
              <Path d="M 72 36 L 71 18 L 60 32 Z" fill="#ffffff" />
              <Ellipse cx="50" cy="56" rx="28" ry="26" fill="url(#skinTone)" />
              {/* Cat Eyes */}
              <Ellipse cx="38" cy="50" rx="4" ry="6" fill="#15803d" />
              <Ellipse cx="62" cy="50" rx="4" ry="6" fill="#15803d" />
              <Circle cx="50" cy="62" r="3" fill="#f43f5e" />
              {/* Whiskers */}
              <Path d="M 34 62 L 18 60 M 34 65 L 18 66" stroke="#1c1917" strokeWidth="1.5" />
              <Path d="M 66 62 L 82 60 M 66 65 L 82 66" stroke="#1c1917" strokeWidth="1.5" />
            </G>
          ) : /* 20. TEDDY BEAR */
          lensId === 'teddy-bear' ? (
            <G>
              <Rect width="100" height="100" fill="#78350f" />
              <Circle cx="26" cy="30" r="13" fill="#92400e" />
              <Circle cx="26" cy="30" r="7" fill="#fef3c7" />
              <Circle cx="74" cy="30" r="13" fill="#92400e" />
              <Circle cx="74" cy="30" r="7" fill="#fef3c7" />
              <Ellipse cx="50" cy="56" rx="28" ry="26" fill="#b45309" />
              <Circle cx="38" cy="50" r="3.5" fill="#1c1917" />
              <Circle cx="62" cy="50" r="3.5" fill="#1c1917" />
              <Ellipse cx="50" cy="64" rx="10" ry="7" fill="#fef3c7" />
              <Ellipse cx="50" cy="61" rx="4.5" ry="3" fill="#1c1917" />
            </G>
          ) : lensId === 'bg-forest' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgForest)" />
              <Circle cx="18" cy="72" r="25" fill="#14532d" />
              <Circle cx="82" cy="68" r="30" fill="#15803d" />
              <Path d="M 50 100 L 50 45" stroke="#422006" strokeWidth="8" />
              <Path d="M 50 62 L 25 38 M 50 70 L 76 42" stroke="#713f12" strokeWidth="5" />
              <Circle cx="28" cy="24" r="3" fill="#fde047" />
              <Circle cx="76" cy="34" r="2.5" fill="#fde047" />
              <Circle cx="62" cy="18" r="2" fill="#fde047" />
            </G>
          ) : lensId === 'bg-beach' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgBeach)" />
              <Circle cx="76" cy="25" r="12" fill="#fde68a" opacity="0.9" />
              <Path d="M 0 66 Q 25 58 50 66 T 100 66" fill="none" stroke="#ffffff" strokeWidth="2" opacity="0.8" />
              <Path d="M 16 78 Q 26 54 37 40" fill="none" stroke="#422006" strokeWidth="5" />
              <Path d="M 28 49 L 10 34 M 29 48 L 36 25 M 29 48 L 49 34" fill="none" stroke="#166534" strokeWidth="4" />
            </G>
          ) : lensId === 'bg-mountains' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgMountains)" />
              <Path d="M 0 78 L 26 32 L 45 64 L 68 22 L 100 78 Z" fill="#64748b" />
              <Path d="M 0 84 L 35 48 L 54 70 L 78 42 L 100 84 Z" fill="#1e293b" />
              <Path d="M 26 32 L 20 43 L 31 42 Z M 68 22 L 59 38 L 76 35 Z" fill="#f8fafc" />
              <Path d="M 0 84 Q 50 73 100 84 L 100 100 L 0 100 Z" fill="#a7f3d0" opacity="0.55" />
            </G>
          ) : lensId === 'bg-sunset' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgSunset)" />
              <Circle cx="72" cy="48" r="17" fill="#fde68a" opacity="0.9" />
              <Path d="M 0 78 Q 22 66 44 78 T 100 78 L 100 100 L 0 100 Z" fill="#431407" />
              <Path d="M 0 72 L 100 72 M 10 80 L 90 80" stroke="#fb7185" strokeWidth="2" opacity="0.6" />
            </G>
          ) : lensId === 'bg-city' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgCity)" />
              <Path d="M 4 85 L 4 48 L 22 48 L 22 85 M 28 85 L 28 32 L 48 32 L 48 85 M 54 85 L 54 42 L 74 42 L 74 85 M 80 85 L 80 24 L 98 24 L 98 85" fill="#172554" stroke="#22d3ee" strokeWidth="1" />
              <Path d="M 10 56 L 16 56 M 34 42 L 42 42 M 60 52 L 68 52 M 86 35 L 92 35" stroke="#f472b6" strokeWidth="3" />
              <Path d="M 0 88 Q 50 76 100 88" fill="none" stroke="#22d3ee" strokeWidth="3" opacity="0.7" />
            </G>
          ) : lensId === 'bg-cozy-room' ? (
            <G>
              <Rect width="100" height="100" fill="url(#bgRoom)" />
              <Rect x="20" y="20" width="60" height="38" fill="#bae6fd" stroke="#fef3c7" strokeWidth="4" />
              <Path d="M 50 20 L 50 58 M 20 39 L 80 39" stroke="#fef3c7" strokeWidth="2" />
              <Circle cx="14" cy="70" r="13" fill="#166534" />
              <Rect x="11" y="70" width="6" height="25" fill="#713f12" />
              <Path d="M 0 88 Q 50 78 100 88 L 100 100 L 0 100 Z" fill="#451a03" opacity="0.65" />
            </G>
          ) : lensId === 'beauty-lipstick' ? (
            <G>
              <Rect width="100" height="100" fill="#881337" />
              <Ellipse cx="50" cy="54" rx="28" ry="26" fill="url(#skinTone)" />
              {/* Eyes */}
              <Circle cx="38" cy="48" r="3.5" fill="#1c1917" />
              <Circle cx="62" cy="48" r="3.5" fill="#1c1917" />
              {/* Rosy blush */}
              <Circle cx="28" cy="56" r="6" fill="#f43f5e" opacity="0.5" />
              <Circle cx="72" cy="56" r="6" fill="#f43f5e" opacity="0.5" />
              {/* Red Lipstick */}
              <Path d="M 34 64 C 40 58, 60 58, 66 64 C 60 74, 40 74, 34 64 Z" fill="#e11d48" stroke="#9f1239" strokeWidth="1.5" />
              <Path d="M 42 63 C 46 60, 54 60, 58 63" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            </G>
          ) : lensId === 'beauty-natural-hair' ? (
            <G>
              <Rect width="100" height="100" fill="#451a03" />
              {/* Big Afro Hair Crown */}
              <Circle cx="50" cy="38" r="34" fill="#1c1917" />
              <Circle cx="24" cy="38" r="16" fill="#1c1917" />
              <Circle cx="76" cy="38" r="16" fill="#1c1917" />
              <Circle cx="34" cy="18" r="18" fill="#1c1917" />
              <Circle cx="66" cy="18" r="18" fill="#1c1917" />
              {/* Face */}
              <Ellipse cx="50" cy="58" rx="24" ry="24" fill="url(#skinTone)" />
              <Circle cx="40" cy="52" r="3.5" fill="#1c1917" />
              <Circle cx="60" cy="52" r="3.5" fill="#1c1917" />
              <Path d="M 44 68 Q 50 72 56 68" stroke="#9a3412" strokeWidth="2" fill="none" />
              {/* Golden Crown Sparkles */}
              <Path d="M 50 10 L 52 14 L 56 16 L 52 18 L 50 22 L 48 18 L 44 16 L 48 14 Z" fill="#facc15" />
            </G>
          ) : lensId === 'beauty-mustache' ? (
            <G>
              <Rect width="100" height="100" fill="#1c1917" />
              <Ellipse cx="50" cy="54" rx="28" ry="28" fill="url(#skinTone)" />
              <Circle cx="38" cy="46" r="3.5" fill="#1c1917" />
              <Circle cx="62" cy="46" r="3.5" fill="#1c1917" />
              {/* Gentleman Handlebar Mustache */}
              <Path
                d="M 50 60 C 38 52, 22 55, 14 62 C 24 70, 42 66, 50 63 C 58 66, 76 70, 86 62 C 78 55, 62 52, 50 60 Z"
                fill="#292524"
              />
            </G>
          ) : lensId === 'beauty-goatee' ? (
            <G>
              <Rect width="100" height="100" fill="#0f172a" />
              <Path d="M 28 35 L 72 35 L 68 65 L 56 86 L 44 86 L 32 65 Z" fill="#f59e0b" />
              <Circle cx="40" cy="48" r="3.5" fill="#0f172a" />
              <Circle cx="60" cy="48" r="3.5" fill="#0f172a" />
              {/* Sharp Goatee Beard */}
              <Path d="M 38 64 Q 50 62 62 64 L 60 74 L 56 84 L 44 84 L 40 74 Z" fill="#1e293b" />
              <Path d="M 44 64 L 56 64 L 50 67 Z" fill="#1e293b" />
            </G>
          ) : lensId === 'beauty-face-glow' ? (
            <G>
              <Rect width="100" height="100" fill="#713f12" />
              <Circle cx="50" cy="50" r="42" fill="#fde047" opacity="0.3" />
              <Ellipse cx="50" cy="54" rx="28" ry="28" fill="#fef3c7" />
              <Circle cx="38" cy="48" r="4" fill="#020617" />
              <Circle cx="62" cy="48" r="4" fill="#020617" />
              <Circle cx="36" cy="46" r="1.5" fill="#ffffff" />
              <Circle cx="60" cy="46" r="1.5" fill="#ffffff" />
              {/* Glowing sparkles */}
              <Path d="M 26 30 L 28 34 L 32 36 L 28 38 L 26 42 L 24 38 L 20 36 L 24 34 Z" fill="#facc15" />
              <Path d="M 74 28 L 76 31 L 79 33 L 76 35 L 74 38 L 72 35 L 69 33 L 72 31 Z" fill="#ffffff" />
            </G>
          ) : lensId === 'beauty-glam' ? (
            <G>
              <Rect width="100" height="100" fill="#831843" />
              <Ellipse cx="50" cy="54" rx="28" ry="28" fill="url(#skinTone)" />
              {/* Long Lashes */}
              <Path d="M 32 44 Q 38 40 44 44 M 32 42 L 30 38 M 38 40 L 38 36 M 44 42 L 46 38" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <Path d="M 56 44 Q 62 40 68 44 M 56 42 L 54 38 M 62 40 L 62 36 M 68 42 L 70 38" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              {/* Bright eyes */}
              <Circle cx="38" cy="48" r="3.5" fill="#0f172a" />
              <Circle cx="62" cy="48" r="3.5" fill="#0f172a" />
              {/* Glam Pink Lips */}
              <Path d="M 36 64 C 42 59, 58 59, 64 64 C 58 73, 42 73, 36 64 Z" fill="#f472b6" stroke="#db2777" strokeWidth="1.5" />
              {/* Sparkle */}
              <Path d="M 78 22 L 80 26 L 84 28 L 80 30 L 78 34 L 76 30 L 72 28 L 76 26 Z" fill="#fde047" />
            </G>
          ) : (
            /* DYNAMIC HARMONIOUS AVATAR FOR ALL OTHER LENSES */
            <G>
              <Rect width="100" height="100" fill={fallbackBackground} />
              <Circle cx="50" cy="50" r="39" fill={fallbackAccent} opacity={0.18} />
              <Circle cx="50" cy="50" r="30" stroke={fallbackAccent} strokeWidth="2" opacity={0.8} fill="rgba(255,255,255,0.06)" />
              <Path d="M 15 82 Q 50 62 85 82" stroke="#ffffff" strokeWidth="2" opacity={0.18} fill="none" />
            </G>
          )}
        </Svg>
        {!hasCustomArtwork && (
          <View pointerEvents="none" style={styles.fallbackIcon}>
            <Ionicons name={fallbackIcon} size={size * 0.34} color={fallbackAccent} />
          </View>
        )}
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
  fallbackIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
