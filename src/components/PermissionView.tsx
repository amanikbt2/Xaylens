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
        <Ionicons name="camera-outline" size={48} color={Colors.white} />
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
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: Colors.white,
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
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 28,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: '700',
  },
  settingsNotice: {
    backgroundColor: Colors.surfaceCard,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  settingsText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
