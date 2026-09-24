import { Platform } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { CapturedMedia } from '../types/camera';

export interface SaveMediaResult {
  success: boolean;
  message: string;
}

export const saveMediaToDevice = async (media: CapturedMedia): Promise<SaveMediaResult> => {
  try {
    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') {
        return { success: false, message: 'Web environment unavailable.' };
      }
      const a = document.createElement('a');
      a.href = media.uri;
      const ext = media.type === 'video' ? 'webm' : 'jpg';
      a.download = `XayLens_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, message: 'Media downloaded successfully.' };
    }

    // Native implementation (Android & iOS)
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        message: 'Permission to access photo library was denied.',
      };
    }

    const asset = await MediaLibrary.createAssetAsync(media.uri);
    // Optionally create or add to 'XayLens' album
    const album = await MediaLibrary.getAlbumAsync('XayLens');
    if (album == null) {
      await MediaLibrary.createAlbumAsync('XayLens', asset, false);
    } else {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    }

    return {
      success: true,
      message: 'Saved to XayLens album in your gallery!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save media.';
    return {
      success: false,
      message: errorMsg,
    };
  }
};
