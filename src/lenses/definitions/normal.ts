import { Lens } from '../../types/lens';

export const normalLens: Lens = {
  id: 'normal',
  name: 'Natural',
  category: 'classic',
  description: 'Pure camera preview with no distortions or overlays applied.',
  supportedCamera: 'both',
  effectType: 'none',
  iconName: 'camera-outline',
  accentColor: '#ffffff',
  config: {},
};
