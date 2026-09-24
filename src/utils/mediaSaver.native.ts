import * as MediaLibrary from 'expo-media-library';
import { CapturedMedia } from '../types/camera';

export interface SaveMediaResult {
  success: boolean;
  message: string;
}

export const saveMediaToDevice = async (media: CapturedMedia): Promise<SaveMediaResult> => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        message: 'Permission to access photo library was denied.',
      };
    }

    const asset = await MediaLibrary.createAssetAsync(media.uri);
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
