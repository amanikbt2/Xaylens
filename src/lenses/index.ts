import { Lens } from '../types/lens';
import { normalLens } from './definitions/normal';
import { bigNoseLens } from './definitions/bigNose';
import { bigEyesLens } from './definitions/bigEyes';
import { tinyFaceLens } from './definitions/tinyFace';
import { wideFaceLens } from './definitions/wideFace';
import { alienLens } from './definitions/alien';
import { puppyLens } from './definitions/puppy';
import { bunnyLens } from './definitions/bunny';
import { funnyGlassesLens } from './definitions/funnyGlasses';

export const INITIAL_LENSES: Lens[] = [
  normalLens,
  bigNoseLens,
  bigEyesLens,
  tinyFaceLens,
  wideFaceLens,
  alienLens,
  puppyLens,
  bunnyLens,
  funnyGlassesLens,
];

export const getLensById = (id: string): Lens => {
  return INITIAL_LENSES.find(l => l.id === id) || normalLens;
};

export {
  normalLens,
  bigNoseLens,
  bigEyesLens,
  tinyFaceLens,
  wideFaceLens,
  alienLens,
  puppyLens,
  bunnyLens,
  funnyGlassesLens,
};
