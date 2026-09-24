import { Lens } from '../../types/lens';

export const wideFaceLens: Lens = {
  id: 'wide-face',
  name: 'Wide Face',
  category: 'funny',
  description: 'Stretches the face horizontally into a hilarious wide panoramic grin.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'resize-outline',
  accentColor: '#10b981',
  config: {
    distortion: {
      type: 'stretch_h',
      targetRegion: 'all',
      intensity: 0.7,
      radius: 0.45,
    },
  },
};
