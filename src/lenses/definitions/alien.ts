import { Lens } from '../../types/lens';

export const alienLens: Lens = {
  id: 'alien',
  name: 'Alien',
  category: 'creature',
  description: 'Extraterrestrial deformation with enlarged almond eyes, chin pinch, and glowing antennae.',
  supportedCamera: 'both',
  effectType: 'hybrid',
  iconName: 'planet-outline',
  accentColor: '#4ade80',
  config: {
    distortion: {
      type: 'complex_alien',
      targetRegion: 'all',
      intensity: 0.8,
      radius: 0.4,
    },
    overlays: [
      {
        element: 'alien_antennae',
        anchor: 'forehead',
        offsetY: -80,
        scale: 1.1,
        color: '#4ade80',
      },
    ],
    colorFilter: {
      tint: 'rgba(34, 197, 94, 0.15)',
      glow: 'rgba(74, 222, 128, 0.35)',
      contrast: 1.2,
    },
    animation: {
      pulseSpeed: 1.5,
    },
  },
};
