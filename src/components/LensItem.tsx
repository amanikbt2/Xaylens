import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, Animated } from 'react-native';
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
    const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0.84)).current;

    useEffect(() => {
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1 : 0.84,
        useNativeDriver: true,
        tension: 220,
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
            opacity: isRecording && !isSelected ? 0.15 : 1,
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
          {isSelected ? (
            /* ACTIVE LENS: Large glowing cyan double ring focus circle (matching user's screenshot) */
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
            /* SIDE LENSES: Distinctly smaller clean circular icons */
            <View style={styles.sideAvatarWrapper}>
              <View style={styles.sideAvatarRing}>
                <LensAvatar lensId={lens.id} size={42} isSelected={false} />
              </View>
            </View>
          )}

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
  },
  touchArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  /* Large Glowing Double-Ring Circle for active lens (matching user image) */
  bigShutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3.5,
    borderColor: '#00d2ff',
    backgroundColor: 'rgba(0, 210, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00d2ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
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
    borderColor: '#ffffff',
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
  /* Side items container: 76px tall to keep all avatar centers vertically aligned */
  sideAvatarWrapper: {
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideAvatarRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    overflow: 'hidden',
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lensNameLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 68,
  },
  lensNameLabelSelected: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});
