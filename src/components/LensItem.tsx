import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lens } from '../types/lens';
import { Colors } from '../constants/colors';
import { triggerShutterPressHaptic } from '../utils/haptics';

export const LENS_ITEM_WIDTH = 86;

interface LensItemProps {
  lens: Lens;
  isSelected: boolean;
  isRecording: boolean;
  distanceFromCenter: number;
  onSelect: (lens: Lens) => void;
  onRecordPress: () => void;
}

export const LensItem: React.FC<LensItemProps> = React.memo(
  ({
    lens,
    isSelected,
    isRecording,
    distanceFromCenter,
    onSelect,
    onRecordPress,
  }) => {
    const targetScale = isSelected
      ? 1
      : distanceFromCenter === 1
      ? 0.84
      : 0.72;

    const scaleAnim = useRef(new Animated.Value(targetScale)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: targetScale,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }).start();
    }, [targetScale, scaleAnim]);

    const handlePress = () => {
      if (isSelected) {
        triggerShutterPressHaptic();
        onRecordPress();
      } else {
        onSelect(lens);
      }
    };

    return (
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{ scale: scaleAnim }],
            opacity: isRecording && !isSelected ? 0.15 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.circle,
            isSelected ? styles.circleInBigRing : styles.circleSide,
            isSelected &&
              !isRecording && {
                backgroundColor:
                  lens.id === 'normal'
                    ? 'rgba(255, 255, 255, 0.22)'
                    : 'rgba(20, 20, 26, 0.86)',
                borderColor:
                  lens.id === 'normal' ? '#ffffff' : lens.accentColor,
                borderWidth: 2,
              },
            isSelected && isRecording && styles.circleRecordingRed,
          ]}
          onPress={handlePress}
          activeOpacity={0.85}
          accessibilityLabel={
            isSelected
              ? isRecording
                ? 'Stop recording and edit video'
                : `Start recording with ${lens.name}`
              : `Select ${lens.name} lens`
          }
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {isSelected && isRecording ? (
            <View style={styles.stopWhiteSquare} />
          ) : (
            <Ionicons
              name={lens.iconName as keyof typeof Ionicons.glyphMap}
              size={isSelected ? 30 : 22}
              color={
                isSelected
                  ? lens.id === 'normal'
                    ? '#ffffff'
                    : lens.accentColor
                  : Colors.white
              }
            />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

LensItem.displayName = 'LensItem';

const styles = StyleSheet.create({
  container: {
    width: LENS_ITEM_WIDTH,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleInBigRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  circleRecordingRed: {
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
  },
  circleSide: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 15, 20, 0.68)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.26)',
  },
  stopWhiteSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});
