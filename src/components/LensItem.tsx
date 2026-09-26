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
          style={styles.touchArea}
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
          {/* THE BIG CIRCLE: Present on the active lens, exactly matching media_1790400374579.png */}
          {isSelected ? (
            <View
              style={[
                styles.bigShutterRing,
                isRecording && styles.bigShutterRingRecording,
              ]}
            >
              {isRecording ? (
                <View style={styles.recordingCenterCore}>
                  <View style={styles.stopWhiteSquare} />
                </View>
              ) : (
                <View style={styles.innerAvatarWrapper}>
                  <LensAvatar lensId={lens.id} size={54} isSelected={true} />
                </View>
              )}
            </View>
          ) : (
            /* Flanking Non-Selected Items: Clean circular avatars */
            <View style={styles.sideAvatarWrapper}>
              <View style={styles.sideAvatarRing}>
                <LensAvatar lensId={lens.id} size={50} isSelected={false} />
              </View>
            </View>
          )}

          {/* Clean, legible text name directly under each circle */}
          <Text
            style={[
              styles.lensNameLabel,
              isSelected && styles.lensNameLabelSelected,
            ]}
            numberOfLines={1}
          >
            {lens.name.replace(/^\d+\.\s*/, '')}
          </Text>
        </TouchableOpacity>
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
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  /* The Big Glowing Neon Circle around the active lens (matching user screenshot media_1790400374579.png) */
  bigShutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#22d3ee',
    backgroundColor: 'rgba(6, 182, 212, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#06b6d4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  bigShutterRingRecording: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
    shadowOpacity: 0.95,
    shadowRadius: 18,
  },
  innerAvatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  recordingCenterCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  /* Side items container: 76px tall to keep avatar centers at the exact same vertical height */
  sideAvatarWrapper: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideAvatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.42)',
    overflow: 'hidden',
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensNameLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
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
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
