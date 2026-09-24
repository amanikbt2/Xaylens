import { Lens } from '../../types/lens';

export const bigEyesLens: Lens = {
  id: 'big-eyes',
  name: 'Big Eyes',
  category: 'funny',
  description: 'Magnifies both eyes for an expressive, anime-like glance.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'eye-outline',
  accentColor: '#38bdf8',
  config: {
    distortion: {
      type: 'bulge',
      targetRegion: 'eyes',
      intensity: 0.75,
      radius: 0.18,
    },
    colorFilter: {
      brightness: 1.05,
      contrast: 1.1,
    },
    animation: {
      sparkle: true,
    },
  },
};
