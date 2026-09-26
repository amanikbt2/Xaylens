import { Platform, ViewStyle, TextStyle } from 'react-native';

/**
 * Creates cross-platform box shadow styles.
 * Prevents React Native Web "shadow* style props are deprecated. Use boxShadow" console warnings.
 */
export const createShadow = (
  color: string,
  offset = { width: 0, height: 2 },
  opacity = 0.3,
  radius = 4,
  elevation = 3
): ViewStyle => {
  if (Platform.OS === 'web') {
    // Convert opacity to hex string if color is standard hex
    let hexOpacity = '';
    if (color.startsWith('#') && color.length === 7) {
      hexOpacity = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0');
    }
    const colorWithAlpha = color.startsWith('#') && color.length === 7 ? `${color}${hexOpacity}` : color;
    return {
      boxShadow: `${offset.width}px ${offset.height}px ${radius}px ${colorWithAlpha}`,
    } as any;
  }
  return {
    shadowColor: color,
    shadowOffset: offset,
    shadowOpacity: opacity,
    shadowRadius: radius,
    elevation,
  };
};

/**
 * Creates cross-platform text shadow styles.
 * Prevents React Native Web "textShadow* style props are deprecated. Use textShadow" console warnings.
 */
export const createTextShadow = (
  color: string,
  offset = { width: 0, height: 1 },
  radius = 2
): TextStyle => {
  if (Platform.OS === 'web') {
    return {
      textShadow: `${offset.width}px ${offset.height}px ${radius}px ${color}`,
    } as any;
  }
  return {
    textShadowColor: color,
    textShadowOffset: offset,
    textShadowRadius: radius,
  };
};
