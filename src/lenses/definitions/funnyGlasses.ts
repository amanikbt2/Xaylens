import { Lens } from '../../types/lens';

export const funnyGlassesLens: Lens = {
  id: 'funny-glasses',
  name: 'Funny Glasses',
  category: 'funny',
  description: 'Oversized funky retro sunglasses with disguise mustache and eyebrows.',
  supportedCamera: 'both',
  effectType: 'overlay',
  iconName: 'glasses-outline',
  accentColor: '#e11d48',
  config: {
    overlays: [
      {
        element: 'funny_glasses',
        anchor: 'nose',
        offsetY: -35,
        scale: 1.35,
      },
      {
        element: 'mustache',
        anchor: 'mouth',
        offsetY: -15,
        scale: 1.25,
      },
    ],
    animation: {
      wiggle: false,
    },
  },
};
