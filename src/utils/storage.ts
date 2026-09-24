import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppPreferences, DEFAULT_PREFERENCES } from '../types/settings';

const PREFERENCES_KEY = '@xaylens_preferences_v1';

export const loadStoredPreferences = async (): Promise<AppPreferences> => {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const saveStoredPreferences = async (prefs: AppPreferences): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
};

export const clearStoredPreferences = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(PREFERENCES_KEY);
    return true;
  } catch {
    return false;
  }
};
