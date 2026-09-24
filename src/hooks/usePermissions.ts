import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';

export interface PermissionsState {
  isLoading: boolean;
  hasCameraPermission: boolean;
  hasAudioPermission: boolean;
  canAskAgain: boolean;
  requestAllPermissions: () => Promise<boolean>;
}

export const usePermissions = (): PermissionsState => {
  const [cameraPerm, requestCameraPerm] = useCameraPermissions();
  const [audioPerm, requestAudioPerm] = useMicrophonePermissions();
  const [webPermGranted, setWebPermGranted] = useState<boolean | null>(null);

  // Check Web permissions
  useEffect(() => {
    if (Platform.OS === 'web') {
      const checkWebPermission = async () => {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
          if (navigator.permissions && navigator.permissions.query) {
            try {
              const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
              setWebPermGranted(status.state === 'granted');
              status.onchange = () => {
                setWebPermGranted(status.state === 'granted');
              };
            } catch {
              setWebPermGranted(true);
            }
          } else {
            setWebPermGranted(true);
          }
        } else {
          setWebPermGranted(false);
        }
      };

      checkWebPermission();
    }
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach((t) => t.stop());
          setWebPermGranted(true);
          return true;
        }
        return false;
      } catch {
        setWebPermGranted(false);
        return false;
      }
    }

    // Native implementation
    const camRes = await requestCameraPerm();
    const audRes = await requestAudioPerm();

    return camRes.granted && audRes.granted;
  }, [requestCameraPerm, requestAudioPerm]);

  if (Platform.OS === 'web') {
    return {
      isLoading: webPermGranted === null,
      hasCameraPermission: webPermGranted === true,
      hasAudioPermission: webPermGranted === true,
      canAskAgain: true,
      requestAllPermissions,
    };
  }

  const isLoading = !cameraPerm || !audioPerm;
  const hasCameraPermission = !!cameraPerm?.granted;
  const hasAudioPermission = !!audioPerm?.granted;
  const canAskAgain = !!cameraPerm?.canAskAgain;

  return {
    isLoading,
    hasCameraPermission,
    hasAudioPermission,
    canAskAgain,
    requestAllPermissions,
  };
};
