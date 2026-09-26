import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface PermissionViewProps {
  onRequestPermission: () => void;
  canAskAgain?: boolean;
}

export const PermissionView: React.FC<PermissionViewProps> = ({
  onRequestPermission,
  canAskAgain = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="camera-outline" size={48} color={Colors.textPrimary} />
      </View>

      <Text style={styles.title}>Camera Access Needed</Text>
      <Text style={styles.description}>
        XayLens transforms your face with fun real-time lenses and effects. To get started,
        please grant camera and microphone access.
      </Text>

      {canAskAgain ? (
        <TouchableOpacity
          style={styles.button}
          onPress={onRequestPermission}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Enable Camera</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.settingsNotice}>
          <Text style={styles.settingsText}>
            Permissions were declined. Please enable Camera permissions in your device settings.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: '#e4e4e7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  settingsNotice: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  settingsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
