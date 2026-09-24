import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CaptureMode } from '../types/camera';
import { Colors } from '../constants/colors';

interface ModeSelectorProps {
  mode: CaptureMode;
  onSelectMode: (mode: CaptureMode) => void;
  disabled?: boolean;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onSelectMode,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.pill, mode === 'photo' && styles.pillActive]}
        onPress={() => !disabled && onSelectMode('photo')}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={[styles.text, mode === 'photo' && styles.textActive]}>PHOTO</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.pill, mode === 'video' && styles.pillActive]}
        onPress={() => !disabled && onSelectMode('video')}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={[styles.text, mode === 'video' && styles.textActive]}>VIDEO</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceTranslucent,
    padding: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    marginBottom: 16,
    alignSelf: 'center',
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 16,
  },
  pillActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  textActive: {
    color: Colors.white,
  },
});
