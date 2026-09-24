import { Dimensions, Platform } from 'react-native';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export const DimensionsConfig = {
  windowWidth,
  windowHeight,
  // Shutter button sizing
  shutterOuterSize: 84,
  shutterInnerSize: 68,
  shutterRecordingOuterSize: 92,
  shutterRecordingInnerSize: 32,

  // Lens carousel
  lensItemSize: 64,
  lensActiveItemSize: 76,
  lensSpacing: 14,

  // Top and bottom bar spacing
  topBarHeight: 56,
  bottomBarHeight: 140,

  // Responsive desktop max width for web
  maxWebWidth: 440,
  maxWebHeight: 900,
  isWebDesktop: Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth > 600,
};
