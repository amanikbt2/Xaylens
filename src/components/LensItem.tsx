import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Animated } from 'react-native';
import { Lens } from '../types/lens';
import { triggerShutterPressHaptic } from '../utils/haptics';
import { LensAvatar } from './LensAvatar';

export const LENS_ITEM_WIDTH = 76;

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
    onSelect,
    onRecordPress,
  }) => {
    const scaleAnim = useRef(new Animated.Value(isSelected ? 1.04 : 0.84)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.04 : 0.84,
        useNativeDriver: true,
        tension: 240,
        friction: 14,
      }).start();
    }, [isSelected, scaleAnim]);

    const handlePress = () => {
      if (lens.id === 'explore-more') {
        onSelect(lens);
        return;
      }
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
            opacity: isRecording && !isSelected ? 0.2 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchArea}
          onPress={handlePress}
          activeOpacity={0.85}
          accessibilityLabel={
            lens.id === 'explore-more'
              ? 'Explore all lenses'
              : isSelected
              ? isRecording
                ? 'Stop recording video'
                : `Start recording with ${lens.name}`
              : `Select ${lens.name} lens`
          }
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
        >
          {isSelected && isRecording ? (
            /* RECORDING STATE: Red Stop Square in the center of the ring */
            <View style={styles.recordingCenterCore}>
              <View style={styles.stopWhiteSquare} />
            </View>
          ) : (
            /* UNIFORM LENS BUBBLE: Sits perfectly centered under the fixed Snapchat shutter ring */
            <View style={styles.avatarWrapper}>
              <LensAvatar
                lensId={lens.id}
                size={isSelected ? 54 : 46}
                isSelected={isSelected}
              />
            </View>
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
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  avatarWrapper: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  recordingCenterCore: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopWhiteSquare: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});
