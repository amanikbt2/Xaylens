import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lens } from '../types/lens';
import { ALL_50_LENSES, normalLens } from '../lenses';
import { triggerLensSelectHaptic } from '../utils/haptics';

const FAVORITES_STORAGE_KEY = '@xaylens_favorite_lenses';
const INITIAL_BATCH_SIZE = 15;
const FETCH_BATCH_SIZE = 12;

export const useLens = (initialLensId: string = 'normal') => {
  // Start with curated initial batch in carousel (Snapchat style)
  const [carouselLenses, setCarouselLenses] = useState<Lens[]>(() =>
    ALL_50_LENSES.slice(0, INITIAL_BATCH_SIZE)
  );

  const [activeLens, setActiveLens] = useState<Lens>(() => {
    return (
      ALL_50_LENSES.find((l) => l.id === initialLensId) || normalLens
    );
  });

  const [lensNotice, setLensNotice] = useState<string | null>(null);
  const [fetchNotice, setFetchNotice] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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

  const toggleFavorite = useCallback((lensId: string) => {
    triggerLensSelectHaptic();
    setFavoriteIds((prev) => {
      const isFav = prev.includes(lensId);
      const updated = isFav
        ? prev.filter((id) => id !== lensId)
        : [...prev, lensId];
      AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated)).catch(
        () => {}
      );
      return updated;
    });
  }, []);

  const isFavorite = useCallback(
    (lensId: string) => {
      return favoriteIds.includes(lensId);
    },
    [favoriteIds]
  );

  const selectLens = useCallback(
    (lens: Lens, cameraFacing: 'front' | 'back' = 'front') => {
      triggerLensSelectHaptic();
      setActiveLens(lens);

      // Show front camera notice if needed
      if (lens.supportedCamera === 'front' && cameraFacing === 'back') {
        setLensNotice(`${lens.name} works best with the front selfie camera`);
        setTimeout(() => setLensNotice(null), 3500);
      } else {
        setLensNotice(null);
      }
    },
    []
  );

  // Dynamic "Fetch More From Explore" when swiping horizontally to end (Snapchat style)
  const hasMore = carouselLenses.length < ALL_50_LENSES.length;

  const fetchMoreLenses = useCallback(() => {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);

    setTimeout(() => {
      setCarouselLenses((prev) => {
        const nextBatch = ALL_50_LENSES.slice(
          prev.length,
          prev.length + FETCH_BATCH_SIZE
        );
        if (nextBatch.length === 0) return prev;
        return [...prev, ...nextBatch];
      });

      setIsFetchingMore(false);
      triggerLensSelectHaptic();
      setFetchNotice(`✨ Loaded +${FETCH_BATCH_SIZE} lenses from Explore`);
      setTimeout(() => setFetchNotice(null), 2500);
    }, 200);
  }, [hasMore, isFetchingMore]);

  // When a lens is chosen from Explore drawer, ensure it's in the carousel and select it
  const injectAndSelectLens = useCallback(
    (lens: Lens, cameraFacing: 'front' | 'back' = 'front') => {
      setCarouselLenses((prev) => {
        const exists = prev.some((l) => l.id === lens.id);
        if (exists) return prev;
        // Insert right after current active lens or append
        return [...prev, lens];
      });
      selectLens(lens, cameraFacing);
    },
    [selectLens]
  );

  return {
    lenses: carouselLenses,
    allLenses: ALL_50_LENSES,
    activeLens,
    selectLens,
    injectAndSelectLens,
    hasMore,
    isFetchingMore,
    fetchMoreLenses,
    lensNotice,
    fetchNotice,
    favoriteIds,
    toggleFavorite,
    isFavorite,
  };
};
