import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { CaptureMode } from '../types/camera';
import { Colors } from '../constants/colors';
import { triggerShutterPressHaptic } from '../utils/haptics';

interface ShutterButtonProps {
  mode: CaptureMode;
  isRecording: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export const ShutterButton: React.FC<ShutterButtonProps> = ({
  mode,
  isRecording,
  onPress,
  disabled = false,
}) => {
  const pressAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const morphAnim = useRef(new Animated.Value(mode === 'video' ? 1 : 0)).current;

  // Pulse animation when actively recording
  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      pulseAnim.setValue(1);
    }

    return () => {
      if (loop) loop.stop();
    };
  }, [isRecording, pulseAnim]);

  // Morph animation when switching mode
  useEffect(() => {
    Animated.timing(morphAnim, {
      toValue: mode === 'video' ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [mode, morphAnim]);

  const handlePressIn = () => {
    Animated.spring(pressAnim, {
      toValue: 0.88,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    triggerShutterPressHaptic();
    onPress();
  };

  // Interpolate outer ring color and inner shape
  const ringBorderColor = isRecording ? Colors.recordingRed : Colors.white;

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.outerRing,
          {
            borderColor: ringBorderColor,
            transform: [{ scale: isRecording ? pulseAnim : pressAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          disabled={disabled}
          accessibilityLabel={
            mode === 'photo'
              ? 'Take Photo'
              : isRecording
              ? 'Stop Video Recording'
              : 'Start Video Recording'
          }
          accessibilityRole="button"
        >
          <View
            style={[
              styles.innerButton,
              mode === 'video' && styles.innerVideo,
              isRecording && styles.innerRecording,
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 86,
    height: 86,
  },
  outerRing: {
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  touchArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerButton: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  innerVideo: {
    backgroundColor: Colors.recordingRed,
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  innerRecording: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: Colors.recordingRed,
  },
});
