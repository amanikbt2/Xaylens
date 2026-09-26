import { Lens } from '../types/lens';
import { ALL_50_LENSES } from './all50Lenses';
import { normalLens } from './definitions/normal';
import { bigNoseLens } from './definitions/bigNose';
import { bigEyesLens } from './definitions/bigEyes';
import { bigMouthLens } from './definitions/bigMouth';
import { wideFaceLens } from './definitions/wideFace';
import { tinyFaceLens } from './definitions/tinyFace';
import { alienLens } from './definitions/alien';
import { swirlFaceLens } from './definitions/swirlFace';
import { puppyLens } from './definitions/puppy';
import { bunnyLens } from './definitions/bunny';
import { funnyGlassesLens } from './definitions/funnyGlasses';

export const INITIAL_LENSES: Lens[] = ALL_50_LENSES;

export const getLensById = (id: string): Lens => {
  return INITIAL_LENSES.find((l) => l.id === id) || ALL_50_LENSES[0];
};

export {
  ALL_50_LENSES,
  normalLens,
  bigNoseLens,
  bigEyesLens,
  bigMouthLens,
  wideFaceLens,
  tinyFaceLens,
  alienLens,
  swirlFaceLens,
  puppyLens,
  bunnyLens,
  funnyGlassesLens,
};
