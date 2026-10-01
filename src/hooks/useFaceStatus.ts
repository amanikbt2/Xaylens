import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraFacing } from '../types/camera';

export type FaceStatusType =
  | 'identifying'
  | 'identified'
  | 'perfect'
  | 'retrying'
  | 'lighting'
  | 'center';

export interface FaceStatus {
  type: FaceStatusType;
  text: string;
  dotColor: string;
  iconName: string;
}

export const useFaceStatus = (
  facing: CameraFacing,
  activeLensId: string,
  trackingQuality?: 'perfect' | 'poor' | 'searching',
  lightingStatus?: 'good' | 'low_light' | 'backlit' | 'searching',
  hasFace: boolean = false,
  faceWidth?: number
) => {
  const [status, setStatus] = useState<FaceStatus>({
    type: 'identifying',
    text: 'Searching face...',
    dotColor: '#F59E0B',
    iconName: 'scan-outline',
  });

  const prevHasFaceRef = useRef<boolean>(hasFace);
  const splashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setStatusState = useCallback((type: FaceStatusType, customText?: string) => {
    switch (type) {
      case 'perfect':
        setStatus({
          type: 'perfect',
          text: customText || 'Perfect ✓',
          dotColor: '#22C55E', // Green
          iconName: 'checkmark-circle-outline',
        });
        break;
      case 'identifying':
        setStatus({
          type: 'identifying',
          text: customText || 'Searching face...',
          dotColor: '#F59E0B', // Amber
          iconName: 'scan-outline',
        });
        break;
      case 'identified':
        setStatus({
          type: 'identified',
          text: customText || 'Face identified ✓',
          dotColor: '#10B981', // Emerald
          iconName: 'checkmark-circle-outline',
        });
        break;
      case 'retrying':
        setStatus({
          type: 'retrying',
          text: customText || 'Tracking lost, retrying...',
          dotColor: '#F43F5E', // Rose/Red
          iconName: 'sync-outline',
        });
        break;
      case 'lighting':
        setStatus({
          type: 'lighting',
          text: customText || 'Low light • Check lighting',
          dotColor: '#EF4444', // Red
          iconName: 'sunny-outline',
        });
        break;
      case 'center':
        setStatus({
          type: 'center',
          text: customText || 'Move closer to camera...',
          dotColor: '#38BDF8', // Cyan
          iconName: 'person-outline',
        });
        break;
    }
  }, []);

  // Update status dynamically whenever real-time tracking signals change
  useEffect(() => {
    const wasSearching = !prevHasFaceRef.current;
    prevHasFaceRef.current = hasFace;

    // Transition: Just acquired face lock after searching
    if (wasSearching && hasFace && trackingQuality === 'perfect') {
      setStatusState('identified', 'Face identified ✓');
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
      splashTimerRef.current = setTimeout(() => {
        setStatusState('perfect', 'Perfect ✓');
      }, 1400);
      return;
    }

    if (!hasFace || trackingQuality === 'searching' || lightingStatus === 'searching') {
      setStatusState('identifying', 'Searching face...');
    } else if (lightingStatus === 'low_light' || lightingStatus === 'backlit') {
      setStatusState('lighting', 'Low light • Check lighting');
    } else if (faceWidth !== undefined && faceWidth > 0 && faceWidth < 0.16) {
      setStatusState('center', 'Move closer to camera...');
    } else if (trackingQuality === 'poor') {
      setStatusState('retrying', 'Tracking lost, retrying...');
    } else if (hasFace && trackingQuality === 'perfect') {
      setStatusState('perfect', 'Perfect ✓');
    } else if (hasFace) {
      setStatusState('identified', 'Face identified ✓');
    } else {
      setStatusState('identifying', 'Searching face...');
    }

    return () => {
      if (splashTimerRef.current) clearTimeout(splashTimerRef.current);
    };
  }, [trackingQuality, lightingStatus, hasFace, faceWidth, facing, activeLensId, setStatusState]);

  const triggerRetry = useCallback(() => {
    setStatusState('retrying', 'Tracking lost, retrying...');
    setTimeout(() => setStatusState('identifying', 'Searching face...'), 1800);
  }, [setStatusState]);

  return {
    status,
    triggerRetry,
  };
};
