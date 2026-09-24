import { useState, useEffect, useCallback } from 'react';

export interface PermissionsState {
  isLoading: boolean;
  hasCameraPermission: boolean;
  hasAudioPermission: boolean;
  canAskAgain: boolean;
  requestAllPermissions: () => Promise<boolean>;
}

export const usePermissions = (): PermissionsState => {
  const [webPermGranted, setWebPermGranted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkWebPermission = async () => {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
            setWebPermGranted(status.state === 'granted' || status.state === 'prompt');
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
  }, []);

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
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
  }, []);

  return {
    isLoading: webPermGranted === null,
    hasCameraPermission: webPermGranted === true,
    hasAudioPermission: webPermGranted === true,
    canAskAgain: true,
    requestAllPermissions,
  };
};
