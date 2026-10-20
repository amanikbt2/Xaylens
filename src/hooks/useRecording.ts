import { useState, useRef, useCallback, useEffect } from 'react';
import { APP_CONFIG } from '../constants/config';
import { triggerRecordingHaptic } from '../utils/haptics';

export const useRecording = (
  onMaxDurationReached?: () => void,
  maxDurationSeconds: number | null = APP_CONFIG.maxVideoDurationSeconds
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedSecondsRef = useRef(0);
  const maxDurationReachedRef = useRef(false);

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const next = elapsedSecondsRef.current + 1;
      elapsedSecondsRef.current = next;
      setSecondsElapsed(next);

      if (
        maxDurationSeconds !== null &&
        next >= maxDurationSeconds &&
        !maxDurationReachedRef.current
      ) {
        maxDurationReachedRef.current = true;
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRecording(false);
        setIsPaused(false);
        onMaxDurationReached?.();
      }
    }, 1000);
  }, [maxDurationSeconds, onMaxDurationReached]);

  const startRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsRecording(true);
    setIsPaused(false);
    elapsedSecondsRef.current = 0;
    maxDurationReachedRef.current = false;
    setSecondsElapsed(0);
    startTimer();
  }, [startTimer]);

  const pauseRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resumeRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsPaused(false);
    startTimer();
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    triggerRecordingHaptic();
    setIsRecording(false);
    setIsPaused(false);
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
    isPaused,
    secondsElapsed,
    formattedTime: formatTime(secondsElapsed),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
};
