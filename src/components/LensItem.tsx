import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated, View, Text } from 'react-native';
import { Lens } from '../types/lens';
import { triggerShutterPressHaptic } from '../utils/haptics';
import { LensAvatar } from './LensAvatar';

export const LENS_ITEM_WIDTH = 78;

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
      ? 0.88
      : 0.78;

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

    const avatarSize = isSelected ? 66 : 52;

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
            styles.avatarBadge,
            isSelected ? styles.badgeSelected : styles.badgeSide,
            isSelected && isRecording && styles.badgeRecordingRed,
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
            <View style={styles.recordingCenterView}>
              <View style={styles.stopWhiteSquare} />
            </View>
          ) : (
            <LensAvatar
              lensId={lens.id}
              size={avatarSize}
              isSelected={isSelected}
            />
          )}
        </TouchableOpacity>

        {/* Clean, legible text name directly under each lens circle */}
        <Text
          style={[
            styles.lensNameLabel,
            isSelected && styles.lensNameLabelSelected,
          ]}
          numberOfLines={1}
        >
          {lens.id === 'normal' ? 'Natural' : lens.name}
        </Text>
      </Animated.View>
    );
  }
);

LensItem.displayName = 'LensItem';

const styles = StyleSheet.create({
  container: {
    width: LENS_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 2,
  },
  avatarBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    overflow: 'hidden',
  },
  badgeSelected: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: '#09090b',
  },
  badgeSide: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    backgroundColor: '#09090b',
  },
  badgeRecordingRed: {
    backgroundColor: '#ef4444',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  recordingCenterView: {
    width: 66,
    height: 66,
    borderRadius: 33,
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
  lensNameLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 72,
  },
  lensNameLabelSelected: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
