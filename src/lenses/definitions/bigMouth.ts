import { Lens } from '../../types/lens';

export const bigMouthLens: Lens = {
  id: 'big-mouth',
  name: 'Big Mouth',
  category: 'funny',
  description: 'Magnifies your mouth and smile to hilarious giant TikTok proportions.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'happy-outline',
  accentColor: '#f43f5e',
  config: {
    distortion: {
      type: 'bulge',
      targetRegion: 'mouth',
      intensity: 0.9,
      radius: 0.28,
    },
    animation: {
      pulseSpeed: 1.4,
    },
  },
};
