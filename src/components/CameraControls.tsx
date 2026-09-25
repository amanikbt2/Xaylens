import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FlashMode } from '../types/camera';
import { BrandBadge } from './BrandBadge';

interface CameraControlsProps {
  flash: FlashMode;
  onCycleFlash: () => void;
  onToggleFacing: () => void;
  onOpenSettings: () => void;
  isRecording?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  flash,
  onCycleFlash,
  onToggleFacing,
  onOpenSettings,
  isRecording = false,
}) => {
  const getFlashIcon = () => {
    switch (flash) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash-outline';
      case 'off':
      default:
        return 'flash-off';
    }
  };

  const getFlashColor = () => {
    return flash === 'on' || flash === 'auto' ? Colors.accentYellow : Colors.white;
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top-Left: Subtle XayLens Floating Badge */}
      <BrandBadge />

      {/* Top-Right: Snapchat-style vertical floating glass pill */}
      <View style={styles.rightVerticalPill}>
        {/* Flip Camera (Front / Back) */}
        <TouchableOpacity
          style={styles.pillActionBtn}
          onPress={onToggleFacing}
          disabled={isRecording}
          activeOpacity={0.7}
          accessibilityLabel="Flip camera facing"
          accessibilityRole="button"
        >
          <Ionicons
            name="camera-reverse-outline"
            size={23}
            color={isRecording ? 'rgba(255,255,255,0.4)' : Colors.white}
          />
        </TouchableOpacity>

        <View style={styles.pillDivider} />

        {/* Flash Toggle */}
        <TouchableOpacity
          style={styles.pillActionBtn}
          onPress={onCycleFlash}
          activeOpacity={0.7}
          accessibilityLabel={`Flash mode: currently ${flash}`}
          accessibilityRole="button"
        >
          <Ionicons name={getFlashIcon()} size={21} color={getFlashColor()} />
          {flash === 'auto' && <Text style={styles.autoBadge}>A</Text>}
        </TouchableOpacity>

        <View style={styles.pillDivider} />

        {/* Settings */}
        <TouchableOpacity
          style={styles.pillActionBtn}
          onPress={onOpenSettings}
          activeOpacity={0.7}
          accessibilityLabel="Camera settings"
          accessibilityRole="button"
        >
          <Ionicons name="options-outline" size={21} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    width: '100%',
    zIndex: 20,
  },
  rightVerticalPill: {
    backgroundColor: 'rgba(12, 12, 16, 0.52)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    paddingVertical: 4,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  pillActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillDivider: {
    width: 22,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  autoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    color: Colors.accentYellow,
    fontSize: 9,
    fontWeight: '800',
  },
});
