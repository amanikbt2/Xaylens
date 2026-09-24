import { Lens } from '../../types/lens';

export const tinyFaceLens: Lens = {
  id: 'tiny-face',
  name: 'Tiny Face',
  category: 'funny',
  description: 'Shrinks the central facial features into a miniature comic center.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'contract-outline',
  accentColor: '#ec4899',
  config: {
    distortion: {
      type: 'pinch',
      targetRegion: 'face',
      intensity: 0.65,
      radius: 0.35,
    },
    colorFilter: {
      saturation: 1.15,
    },
  },
};
