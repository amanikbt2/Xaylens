import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lens } from '../types/lens';
import { INITIAL_LENSES, normalLens } from '../lenses';
import { triggerLensSelectHaptic } from '../utils/haptics';

const FAVORITES_STORAGE_KEY = '@xaylens_favorite_lenses';

export const useLens = (initialLensId: string = 'normal') => {
  const [lenses] = useState<Lens[]>(INITIAL_LENSES);
  const [activeLens, setActiveLens] = useState<Lens>(() => {
    return INITIAL_LENSES.find((l) => l.id === initialLensId) || normalLens;
  });
  const [lensNotice, setLensNotice] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // Load favorites from storage on mount
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
              setFavoriteIds(parsed);
            }
          } catch {
            // Ignore parse error
          }
        }
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = useCallback(
    (lensId: string) => {
      triggerLensSelectHaptic();
      setFavoriteIds((prev) => {
        const isFav = prev.includes(lensId);
        const updated = isFav ? prev.filter((id) => id !== lensId) : [...prev, lensId];
        AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
        return updated;
      });
    },
    []
  );

  const isFavorite = useCallback(
    (lensId: string) => {
      return favoriteIds.includes(lensId);
    },
    [favoriteIds]
  );

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
    favoriteIds,
    toggleFavorite,
    isFavorite,
  };
};

