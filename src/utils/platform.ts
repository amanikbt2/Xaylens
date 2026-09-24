import { Platform } from 'react-native';

export const isWeb = Platform.OS === 'web';
export const isAndroid = Platform.OS === 'android';
export const isIOS = Platform.OS === 'ios';
export const isMobile = isAndroid || isIOS;

export const isDesktopWeb = (): boolean => {
  if (!isWeb) return false;
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 768;
};

export const hasMediaDevicesSupport = (): boolean => {
  if (!isWeb) return true;
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
};
