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

    // Look for existing album under XayLens, Xaylens, or Xaylence
    let album = await MediaLibrary.getAlbumAsync('XayLens');
    if (!album) {
      album = await MediaLibrary.getAlbumAsync('Xaylens');
    }
    if (!album) {
      album = await MediaLibrary.getAlbumAsync('Xaylence');
    }

    if (album == null) {
      try {
        await MediaLibrary.createAlbumAsync('XayLens', asset, false);
      } catch {
        await MediaLibrary.createAlbumAsync('XayLens', asset, true);
      }
    } else {
      try {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } catch {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, true);
      }
    }

    return {
      success: true,
      message: 'Saved to XayLens folder in your gallery!',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to save media.';
    return {
      success: false,
      message: errorMsg,
    };
  }
};
