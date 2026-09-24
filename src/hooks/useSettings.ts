import { useState, useEffect, useCallback } from 'react';
import { AppPreferences, DEFAULT_PREFERENCES } from '../types/settings';
import { loadStoredPreferences, saveStoredPreferences, clearStoredPreferences } from '../utils/storage';

export const useSettings = () => {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadStoredPreferences().then((stored) => {
      setPreferences(stored);
      setIsLoaded(true);
    });
  }, []);

  const updatePreference = useCallback(<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: value };
      saveStoredPreferences(next);
      return next;
    });
  }, []);

  const resetPreferences = useCallback(async () => {
    await clearStoredPreferences();
    setPreferences(DEFAULT_PREFERENCES);
  }, []);

  return {
    preferences,
    isLoaded,
    updatePreference,
    resetPreferences,
  };
};
