import { Lens } from '../../types/lens';

export const puppyLens: Lens = {
  id: 'puppy',
  name: 'Puppy',
  category: 'animal',
  description: 'Soft floppy puppy ears, button wet nose, and playful animated tongue.',
  supportedCamera: 'both',
  effectType: 'overlay',
  iconName: 'paw-outline',
  accentColor: '#fb923c',
  config: {
    overlays: [
      {
        element: 'puppy_ears',
        anchor: 'forehead',
        offsetY: -70,
        scale: 1.25,
      },
      {
        element: 'snout',
        anchor: 'nose',
        offsetY: 0,
        scale: 1.0,
      },
      {
        element: 'blush',
        anchor: 'nose',
        offsetY: 25,
        scale: 1.2,
      },
    ],
    animation: {
      wiggle: true,
      pulseSpeed: 1.1,
    },
  },
};
