import { useState, useCallback } from 'react';
import { Lens } from '../types/lens';
import { INITIAL_LENSES, normalLens } from '../lenses';
import { triggerLensSelectHaptic } from '../utils/haptics';

export const useLens = (initialLensId: string = 'normal') => {
  const [lenses] = useState<Lens[]>(INITIAL_LENSES);
  const [activeLens, setActiveLens] = useState<Lens>(() => {
    return INITIAL_LENSES.find((l) => l.id === initialLensId) || normalLens;
  });
  const [lensNotice, setLensNotice] = useState<string | null>(null);

  const selectLens = useCallback((lens: Lens, cameraFacing: 'front' | 'back' = 'front') => {
    triggerLensSelectHaptic();
    setActiveLens(lens);

    // Show front camera notice if needed
    if (lens.supportedCamera === 'front' && cameraFacing === 'back') {
      setLensNotice(`${lens.name} works best with the front selfie camera`);
      setTimeout(() => setLensNotice(null), 3500);
    } else {
      setLensNotice(null);
    }
  }, []);

  return {
    lenses,
    activeLens,
    selectLens,
    lensNotice,
  };
};
