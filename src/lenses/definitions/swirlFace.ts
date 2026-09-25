import { Lens } from '../../types/lens';

export const swirlFaceLens: Lens = {
  id: 'swirl-face',
  name: 'Swirl Twist',
  category: 'funny',
  description: 'Twists the center of your face into a hilarious dynamic vortex.',
  supportedCamera: 'both',
  effectType: 'distortion',
  iconName: 'sync-circle-outline',
  accentColor: '#a855f7',
  config: {
    distortion: {
      type: 'pinch',
      targetRegion: 'face',
      intensity: 0.85,
      radius: 0.32,
    },
    animation: {
      pulseSpeed: 1.2,
    },
  },
};
