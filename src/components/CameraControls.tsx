import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { FlashMode } from '../types/camera';
import { BrandBadge } from './BrandBadge';

interface CameraControlsProps {
  flash: FlashMode;
  onCycleFlash: () => void;
  onOpenSettings: () => void;
  gridEnabled?: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  flash,
  onCycleFlash,
  onOpenSettings,
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
    <View style={styles.container}>
      {/* Flash toggle */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onCycleFlash}
        activeOpacity={0.7}
        accessibilityLabel={`Flash mode: currently ${flash}`}
        accessibilityRole="button"
      >
        <Ionicons name={getFlashIcon()} size={22} color={getFlashColor()} />
        {flash === 'auto' && (
          <Text style={styles.autoBadge}>A</Text>
        )}
      </TouchableOpacity>

      {/* Subtle branding wordmark */}
      <BrandBadge />

      {/* Settings button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onOpenSettings}
        activeOpacity={0.7}
        accessibilityLabel="Camera settings"
        accessibilityRole="button"
      >
        <Ionicons name="settings-outline" size={22} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    width: '100%',
    zIndex: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    color: Colors.accentYellow,
    fontSize: 9,
    fontWeight: '800',
  },
});
