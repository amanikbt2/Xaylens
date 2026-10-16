import { Lens } from '../types/lens';
import { ALL_50_LENSES } from './all50Lenses';

const createParkARLens = (
  id: string,
  name: string,
  description: string,
  iconName: string,
  accentColor: string,
  arEffect: NonNullable<NonNullable<Lens['config']['background']>['arEffect']>
): Lens => ({
  id,
  name,
  category: 'ar',
  description,
  supportedCamera: 'both',
  effectType: 'overlay',
  iconName,
  accentColor,
  config: {
    background: {
      scene: 'park',
      removeBackground: true,
      arEffect,
    },
  },
});

const AR_LENS_DEFINITIONS: Lens[] = [
  createParkARLens(
    'ar-park-birds',
    'Park Birds',
    'Step into the Sunny City Park scene as a small flock of birds glides overhead.',
    'bird-outline',
    '#38bdf8',
    'birds'
  ),
  createParkARLens(
    'ar-park-butterflies',
    'Butterfly Garden',
    'Colorful butterflies flutter gently through the park around you.',
    'flower-outline',
    '#f472b6',
    'butterflies'
  ),
  createParkARLens(
    'ar-park-fireflies',
    'Firefly Meadow',
    'Warm fireflies drift and glow across the park at golden hour.',
    'sparkles-outline',
    '#facc15',
    'fireflies'
  ),
  createParkARLens(
    'ar-park-petals',
    'Petal Breeze',
    'Soft pink petals float and tumble through the park breeze.',
    'leaf-outline',
    '#fb7185',
    'petals'
  ),
];

export const AR_LENSES: Lens[] = AR_LENS_DEFINITIONS.map((lens, index) => {
  const number = ALL_50_LENSES.length + index + 1;
  const code = `L${String(number).padStart(3, '0')}`;
  const cleanName = lens.name.replace(/^L\d+\.\s*/, '');

  return {
    ...lens,
    code,
    name: `${code}. ${cleanName}`,
  };
});
