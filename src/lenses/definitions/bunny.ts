import { Lens } from '../../types/lens';

export const bunnyLens: Lens = {
  id: 'bunny',
  name: 'Bunny',
  category: 'animal',
  description: 'Tall animated bunny ears, cute heart nose, and delicate whisker twitches.',
  supportedCamera: 'both',
  effectType: 'overlay',
  iconName: 'heart-outline',
  accentColor: '#f472b6',
  config: {
    overlays: [
      {
        element: 'bunny_ears',
        anchor: 'forehead',
        offsetY: -110,
        scale: 1.3,
      },
      {
        element: 'snout',
        anchor: 'nose',
        offsetY: 0,
        scale: 0.9,
      },
      {
        element: 'blush',
        anchor: 'nose',
        offsetY: 15,
        scale: 1.1,
      },
    ],
    animation: {
      wiggle: true,
      pulseSpeed: 1.3,
    },
  },
};
