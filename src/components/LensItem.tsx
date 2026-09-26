import React from 'react';
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
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
    distanceFromCenter,
    onSelect,
    onRecordPress,
  }) => {
    const handlePress = () => {
      if (isSelected) {
        triggerShutterPressHaptic();
        onRecordPress();
      } else {
        onSelect(lens);
      }
    };

    // Uniform avatar size so items slide seamlessly through the center ring without jumpy resizing
    const avatarSize = 58;

    return (
      <View
        style={[
          styles.container,
          {
            opacity: isRecording && !isSelected ? 0.15 : 1,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.avatarBadge,
            isSelected && isRecording && styles.badgeRecordingRed,
          ]}
          onPress={handlePress}
          activeOpacity={0.82}
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
      </View>
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
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    backgroundColor: '#09090b',
  },
  badgeRecordingRed: {
    backgroundColor: '#ef4444',
    borderColor: '#ffffff',
    borderWidth: 2.5,
  },
  recordingCenterView: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopWhiteSquare: {
    width: 20,
    height: 20,
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
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
