import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { APP_CONFIG } from '../constants/config';
import { useSettings } from '../hooks/useSettings';
import { FlashMode, CameraFacing } from '../types/camera';

interface SettingsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ visible, onClose }) => {
  const { preferences, updatePreference, resetPreferences } = useSettings();

  const handleReset = () => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all camera settings to default values?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await resetPreferences();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CAMERA PREFERENCES */}
          <Text style={styles.sectionHeader}>CAMERA PREFERENCES</Text>
          <View style={styles.card}>
            {/* Preferred Flash */}
            <View style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>Default Flash</Text>
                <Text style={styles.rowSubtitle}>Initial flash mode when starting camera</Text>
              </View>
              <View style={styles.segmented}>
                {(['off', 'auto', 'on'] as FlashMode[]).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.segmentBtn,
                      preferences.preferredFlash === mode && styles.segmentBtnActive,
                    ]}
                    onPress={() => updatePreference('preferredFlash', mode)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        preferences.preferredFlash === mode && styles.segmentTextActive,
                      ]}
                    >
                      {mode.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Default Facing */}
            <View style={styles.row}>
              <View>
                <Text style={styles.rowTitle}>Default Camera</Text>
                <Text style={styles.rowSubtitle}>Start with selfie or rear lens</Text>
              </View>
              <View style={styles.segmented}>
                {(['front', 'back'] as CameraFacing[]).map((facing) => (
                  <TouchableOpacity
                    key={facing}
                    style={[
                      styles.segmentBtn,
                      preferences.defaultFacing === facing && styles.segmentBtnActive,
                    ]}
                    onPress={() => updatePreference('defaultFacing', facing)}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        preferences.defaultFacing === facing && styles.segmentTextActive,
                      ]}
                    >
                      {facing.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            {/* Mirror Front Camera */}
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.rowTitle}>Mirror Front Camera</Text>
                <Text style={styles.rowSubtitle}>Simulate a mirror reflection for selfies</Text>
              </View>
              <Switch
                value={preferences.mirrorFrontCamera}
                onValueChange={(val) => updatePreference('mirrorFrontCamera', val)}
                trackColor={{ false: '#e4e4e7', true: Colors.accentCyan }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* APP EXPERIENCE */}
          <Text style={styles.sectionHeader}>EXPERIENCE</Text>
          <View style={styles.card}>
            {/* Haptics */}
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.rowTitle}>Haptic Feedback</Text>
                <Text style={styles.rowSubtitle}>Vibrate on shutter press and lens switch</Text>
              </View>
              <Switch
                value={preferences.enableHaptics}
                onValueChange={(val) => updatePreference('enableHaptics', val)}
                trackColor={{ false: '#e4e4e7', true: Colors.accentCyan }}
                thumbColor={Colors.white}
              />
            </View>

            <View style={styles.divider} />

            {/* High Quality Video */}
            <View style={styles.row}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text style={styles.rowTitle}>High Quality Video</Text>
                <Text style={styles.rowSubtitle}>Record at optimal 1080p resolution</Text>
              </View>
              <Switch
                value={preferences.highQualityVideo}
                onValueChange={(val) => updatePreference('highQualityVideo', val)}
                trackColor={{ false: '#e4e4e7', true: Colors.accentCyan }}
                thumbColor={Colors.white}
              />
            </View>
          </View>

          {/* ABOUT & PRIVACY */}
          <Text style={styles.sectionHeader}>ABOUT XAYLENS</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Application Name</Text>
              <Text style={styles.valueText}>{APP_CONFIG.name}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Version</Text>
              <Text style={styles.valueText}>{APP_CONFIG.version} ({APP_CONFIG.buildNumber})</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowTitle}>Architecture</Text>
              <Text style={styles.valueText}>Expo SDK 57 / React Native</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Offline First & Privacy</Text>
                <Text style={styles.rowSubtitle}>
                  All lenses and processing run 100% locally on your device. No photos or video are
                  sent to any cloud server or third-party AI.
                </Text>
              </View>
            </View>
          </View>

          {/* RESET BUTTON */}
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.recordingRed} />
            <Text style={styles.resetText}>Reset Preferences to Default</Text>
          </TouchableOpacity>

          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} {APP_CONFIG.name}. {APP_CONFIG.tagline}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e4e7',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  rowTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    maxWidth: 240,
  },
  valueText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#e4e4e7',
    marginVertical: 8,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#e4e4e7',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#d4d4d8',
  },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: Colors.textPrimary,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  resetText: {
    color: Colors.recordingRed,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  copyrightText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});
