import { Lens } from '../types/lens';

export const CUSTOM_BACKGROUND_LENS_ID = 'custom-background';

export const customBackgroundLens: Lens = {
  id: CUSTOM_BACKGROUND_LENS_ID,
  name: 'Choose your own',
  category: 'background',
  description: 'Choose a photo or video from your library as your background.',
  supportedCamera: 'both',
  effectType: 'overlay',
  iconName: 'image-outline',
  accentColor: '#8b5cf6',
  config: {
    background: {
      scene: 'forest',
      removeBackground: true,
    },
  },
};

export const createCustomBackgroundLens = (uri: string, mediaType: 'image' | 'video'): Lens => ({
  ...customBackgroundLens,
  config: {
    ...customBackgroundLens.config,
    background: {
      ...customBackgroundLens.config.background,
      scene: 'forest',
      ...(mediaType === 'video' ? { videoUri: uri } : { imageUri: uri }),
      removeBackground: true,
    },
  },
});
