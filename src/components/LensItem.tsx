import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lens } from '../types/lens';
import { Colors } from '../constants/colors';
import { triggerShutterPressHaptic } from '../utils/haptics';

export const LENS_ITEM_WIDTH = 84;

interface LensItemProps {
  lens: Lens;
  isSelected: boolean;
  isRecording: boolean;
  distanceFromCenter: number;
  onSelect: (lens: Lens) => void;
  onRecordPress: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

export const LensItem: React.FC<LensItemProps> = React.memo(({
  lens,
  isSelected,
  isRecording,
  distanceFromCenter,
  onSelect,
  onRecordPress,
  onHoldStart,
  onHoldEnd,
}) => {
  const targetScale = isSelected
    ? 1
    : distanceFromCenter === 1
    ? 0.88
    : 0.76;

  const scaleAnim = useRef(new Animated.Value(targetScale)).current;
  const isHoldingRef = useRef(false);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: targetScale,
      tension: 190,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [targetScale, scaleAnim]);

  const handlePress = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      return;
    }
    if (isSelected) {
      triggerShutterPressHaptic();
      onRecordPress();
    } else {
      onSelect(lens);
    }
  };

  const handleLongPress = () => {
    if (isSelected && !isRecording && onHoldStart) {
      isHoldingRef.current = true;
      triggerShutterPressHaptic();
      onHoldStart();
    }
  };

  const handlePressOut = () => {
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      if (onHoldEnd) {
        onHoldEnd();
      }
    }
  };

  const isNatural = lens.id === 'normal';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: isRecording && !isSelected ? 0.22 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.circle,
          isSelected ? styles.circleCenter : styles.circleSide,
          isSelected && !isNatural && !isRecording && {
            backgroundColor: 'rgba(24, 24, 27, 0.78)',
            borderColor: lens.accentColor,
            borderWidth: 2,
          },
          isSelected && isNatural && !isRecording && styles.circleNaturalCenter,
          isSelected && isRecording && styles.circleRecordingCenter,
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={240}
        activeOpacity={0.85}
        accessibilityLabel={
          isSelected
            ? isRecording
              ? 'Stop video recording'
              : `Record video with ${lens.name}`
            : `Switch to ${lens.name} lens`
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {isSelected && isRecording ? (
          <View style={styles.stopSquare} />
        ) : isSelected && isNatural ? (
          <View style={styles.naturalRecordCore}>
            <View style={styles.naturalRecordDot} />
          </View>
        ) : (
          <Ionicons
            name={lens.iconName as keyof typeof Ionicons.glyphMap}
            size={isSelected ? 28 : 22}
            color={isSelected ? lens.accentColor : Colors.white}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
});

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  circleCenter: {
    width: 66,
    height: 66,
    borderRadius: 33,
  },
  circleNaturalCenter: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  circleRecordingCenter: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
  },
  circleSide: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(15, 15, 20, 0.62)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  naturalRecordCore: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(239, 68, 68, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  naturalRecordDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
  },
  stopSquare: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: Colors.recordingRed,
  },
});
