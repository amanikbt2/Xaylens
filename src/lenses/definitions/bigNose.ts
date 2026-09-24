import { Lens } from '../../types/lens';

export const bigNoseLens: Lens = {
  id: 'big-nose',
  name: 'Big Nose',
  category: 'funny',
  description: 'Expands the nose region into a hilarious cartoon schnoz.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'flower-outline',
  accentColor: '#f59e0b',
  config: {
    distortion: {
      type: 'bulge',
      targetRegion: 'nose',
      intensity: 0.85,
      radius: 0.22,
    },
    animation: {
      pulseSpeed: 1.2,
    },
  },
};
