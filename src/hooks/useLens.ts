import { useState, useCallback, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lens, LensCategory } from '../types/lens';
import { ALL_50_LENSES, normalLens } from '../lenses';
import { triggerLensSelectHaptic } from '../utils/haptics';

const FAVORITES_STORAGE_KEY = '@xaylens_favorite_lenses';

export type CategoryFilter = 'all' | 'favorites' | LensCategory;

export const useLens = (initialLensId: string = 'normal') => {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [lensNotice, setLensNotice] = useState<string | null>(null);
  const fetchNotice: string | null = null;

  const [activeLens, setActiveLens] = useState<Lens>(() => {
    return (
      ALL_50_LENSES.find((l) => l.id === initialLensId) || ALL_50_LENSES[0] || normalLens
    );
  });

  const [comboLenses, setComboLenses] = useState<Lens[]>([
    ALL_50_LENSES.find((l) => l.id === initialLensId) || ALL_50_LENSES[0] || normalLens,
  ]);
  const [isComboActive, setIsComboActive] = useState<boolean>(false);

  // Sync activeLens with comboLenses when not in combo mode
  useEffect(() => {
    if (!isComboActive) {
      setComboLenses([activeLens]);
    }
  }, [activeLens, isComboActive]);

  const toggleComboMode = useCallback(() => {
    triggerLensSelectHaptic();
    setIsComboActive((prev) => {
      const next = !prev;
      if (next && comboLenses.length === 0 && activeLens.id !== 'normal') {
        setComboLenses([activeLens]);
      }
      return next;
    });
  }, [activeLens, comboLenses.length]);

  const removeComboLayer = useCallback((lensId: string) => {
    triggerLensSelectHaptic();
    setComboLenses((prev) => {
      const updated = prev.filter((l) => l.id !== lensId);
      if (updated.length === 0) {
        setIsComboActive(false);
        setActiveLens(normalLens);
        return [normalLens];
      }
      setActiveLens(updated[updated.length - 1]);
      return updated;
    });
  }, []);

  const clearCombo = useCallback(() => {
    triggerLensSelectHaptic();
    setIsComboActive(false);
    setActiveLens(normalLens);
    setComboLenses([normalLens]);
  }, []);

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

  // Compute carousel lenses strictly by categoryFilter
  const carouselLenses = useMemo(() => {
    const normalItem = ALL_50_LENSES.find((l) => l.id === 'normal') || normalLens;

    if (categoryFilter === 'all') {
      const list = [...ALL_50_LENSES];
      const normalIdx = list.findIndex((l) => l.id === 'normal');
      if (normalIdx > 0) {
        const [nItem] = list.splice(normalIdx, 1);
        list.unshift(nItem);
      }
      return list;
    }

    if (categoryFilter === 'favorites') {
      const favs = ALL_50_LENSES.filter((l) => favoriteIds.includes(l.id));
      if (!favs.some((l) => l.id === 'normal')) {
        return [normalItem, ...favs];
      }
      return favs;
    }

    // Filter strictly to the chosen category
    const catLenses = ALL_50_LENSES.filter((l) => l.category === categoryFilter);
    if (!catLenses.some((l) => l.id === 'normal')) {
      return [normalItem, ...catLenses];
    }
    return catLenses;
  }, [categoryFilter, favoriteIds]);

  const selectLens = useCallback(
    (lens: Lens, cameraFacing: 'front' | 'back' = 'front') => {
      triggerLensSelectHaptic();
      setActiveLens(lens);

      if (isComboActive) {
        if (lens.id === 'normal') {
          // Normal clears combo
          setComboLenses([normalLens]);
          setIsComboActive(false);
        } else {
          setComboLenses((prev) => {
            const filtered = prev.filter((l) => l.id !== 'normal');
            if (filtered.some((l) => l.id === lens.id)) {
              // Toggling off existing layer
              const remaining = filtered.filter((l) => l.id !== lens.id);
              return remaining.length > 0 ? remaining : [normalLens];
            } else {
              // Layer on top
              return [...filtered, lens];
            }
          });
        }
      }

      if (lens.supportedCamera === 'front' && cameraFacing === 'back') {
        setLensNotice(`${lens.name} works best with the front selfie camera`);
        setTimeout(() => setLensNotice(null), 3500);
      } else {
        setLensNotice(null);
      }
    },
    [isComboActive]
  );

  // When a lens is chosen from Explore drawer, switch category row filter to that category
  const injectAndSelectLens = useCallback(
    (lens: Lens, cameraFacing: 'front' | 'back' = 'front', categoryTab?: CategoryFilter) => {
      let targetCat: CategoryFilter = categoryTab || (lens.category as CategoryFilter) || 'all';
      if (lens.id === 'normal') {
        targetCat = 'all';
      }
      setCategoryFilter(targetCat);
      selectLens(lens, cameraFacing);
    },
    [selectLens]
  );

  const setCategory = useCallback((cat: CategoryFilter) => {
    triggerLensSelectHaptic();
    setCategoryFilter(cat);
  }, []);

  return {
    lenses: carouselLenses,
    allLenses: ALL_50_LENSES,
    activeLens,
    comboLenses: comboLenses.filter((l) => l.id !== 'normal'),
    isComboActive,
    toggleComboMode,
    removeComboLayer,
    clearCombo,
    categoryFilter,
    setCategory,
    selectLens,
    injectAndSelectLens,
    hasMore: false,
    isFetchingMore: false,
    fetchMoreLenses: () => {},
    lensNotice,
    fetchNotice,
    favoriteIds,
    toggleFavorite,
    isFavorite,
  };
};
