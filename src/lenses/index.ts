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
import { customBackgroundLens, createCustomBackgroundLens, CUSTOM_BACKGROUND_LENS_ID } from './customBackground';
import { AR_LENSES } from './arLenses';

export const INITIAL_LENSES: Lens[] = ALL_50_LENSES;
export const ALL_LENSES: Lens[] = [...ALL_50_LENSES, ...AR_LENSES];

export const getLensById = (id: string): Lens => {
  return ALL_LENSES.find((lens) => lens.id === id) || ALL_LENSES[0];
};

export {
  ALL_50_LENSES,
  AR_LENSES,
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
  customBackgroundLens,
  createCustomBackgroundLens,
  CUSTOM_BACKGROUND_LENS_ID,
};
