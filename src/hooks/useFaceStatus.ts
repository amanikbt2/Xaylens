import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraFacing } from '../types/camera';

export type FaceStatusType = 'identifying' | 'identified' | 'retrying' | 'lighting' | 'center';

export interface FaceStatus {
  type: FaceStatusType;
  text: string;
  dotColor: string;
  iconName: string;
}

export const useFaceStatus = (facing: CameraFacing, activeLensId: string) => {
  const [status, setStatus] = useState<FaceStatus>({
    type: 'identifying',
    text: 'Identifying face...',
    dotColor: '#F59E0B',
    iconName: 'scan-outline',
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleCountRef = useRef(0);

  const setStatusState = useCallback((type: FaceStatusType, customText?: string) => {
    switch (type) {
      case 'identifying':
        setStatus({
          type: 'identifying',
          text: customText || 'Identifying face...',
          dotColor: '#F59E0B', // Amber
          iconName: 'scan-outline',
        });
        break;
      case 'identified':
        setStatus({
          type: 'identified',
          text: customText || 'Face identified ✓',
          dotColor: '#22C55E', // Green
          iconName: 'checkmark-circle-outline',
        });
        break;
      case 'retrying':
        setStatus({
          type: 'retrying',
          text: customText || 'Failed to identify face, retrying...',
          dotColor: '#F43F5E', // Rose/Red
          iconName: 'sync-outline',
        });
        break;
      case 'lighting':
        setStatus({
          type: 'lighting',
          text: customText || 'Check lighting for best tracking...',
          dotColor: '#FBBF24', // Yellow Gold
          iconName: 'sunny-outline',
        });
        break;
      case 'center':
        setStatus({
          type: 'center',
          text: customText || 'Center face in frame...',
          dotColor: '#38BDF8', // Cyan
          iconName: 'person-outline',
        });
        break;
    }
  }, []);

  // Trigger status cycle when camera flips or lens changes
  useEffect(() => {
    // 1. Initial identifying state
    setStatusState('identifying', 'Identifying face...');

    if (timerRef.current) clearTimeout(timerRef.current);

    // 2. Lock onto face after 1.2s
    timerRef.current = setTimeout(() => {
      setStatusState('identified', 'Face identified ✓');

      // Periodically simulate intelligent lighting & position feedback every 14-20 seconds
      const nextTimer = setTimeout(() => {
        cycleCountRef.current = (cycleCountRef.current + 1) % 3;
        if (cycleCountRef.current === 1) {
          setStatusState('lighting', 'Check lighting for best track...');
          setTimeout(() => setStatusState('identified', 'Face identified ✓'), 3500);
        } else if (cycleCountRef.current === 2) {
          setStatusState('center', 'Center face in frame...');
          setTimeout(() => setStatusState('identified', 'Face identified ✓'), 3500);
        }
      }, 16000);

      return () => clearTimeout(nextTimer);
    }, 1200);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [facing, activeLensId, setStatusState]);

  const triggerRetry = useCallback(() => {
    setStatusState('retrying', 'Failed to identify face, retrying...');
    setTimeout(() => setStatusState('identifying', 'Identifying face...'), 1800);
    setTimeout(() => setStatusState('identified', 'Face identified ✓'), 3200);
  }, [setStatusState]);

  return {
    status,
    triggerRetry,
  };
};
