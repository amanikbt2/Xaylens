import { useState, useRef, useCallback, useEffect } from 'react';
import { APP_CONFIG } from '../constants/config';
import { triggerRecordingHaptic } from '../utils/haptics';

export const useRecording = (onMaxDurationReached?: () => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsRecording(true);
    setSecondsElapsed(0);

    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsElapsed((prev) => {
        const next = prev + 1;
        if (next >= APP_CONFIG.maxVideoDurationSeconds) {
          onMaxDurationReached?.();
        }
        return next;
      });
    }, 1000);
  }, [onMaxDurationReached]);

  const stopRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsRecording(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRecording,
    secondsElapsed,
    formattedTime: formatTime(secondsElapsed),
    startRecording,
    stopRecording,
  };
};
