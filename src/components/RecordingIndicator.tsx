import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { Colors } from '../constants/colors';

interface RecordingIndicatorProps {
  formattedTime: string;
}

export const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({ formattedTime }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.2,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    loop.start();

    return () => loop.stop();
  }, [blinkAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, { opacity: blinkAnim }]} />
      <Text style={styles.timeText}>{formattedTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    alignSelf: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.recordingRed,
    marginRight: 6,
  },
  timeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
});
