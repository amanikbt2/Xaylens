import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CapturedMedia } from '../types/camera';
import { Colors } from '../constants/colors';
import { saveMediaToDevice } from '../utils/mediaSaver';

interface MediaPreviewModalProps {
  media: CapturedMedia | null;
  visible: boolean;
  onClose: () => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  media,
  visible,
  onClose,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!media) return null;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    const res = await saveMediaToDevice(media);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2500);
    } else {
      Alert.alert('Notice', res.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header / Dismiss */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={26} color={Colors.white} />
          </TouchableOpacity>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {media.lensName ? `${media.lensName} Lens` : 'XayLens Capture'}
            </Text>
          </View>

          <View style={{ width: 44 }} />
        </View>

        {/* Media Preview Viewport */}
        <View style={styles.previewContainer}>
          {media.type === 'photo' ? (
            <Image
              source={{ uri: media.uri }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam" size={64} color={Colors.accentCyan} />
              <Text style={styles.videoText}>Video recorded successfully!</Text>
              <Text style={styles.videoSubtext}>Tap Save below to keep this video.</Text>
            </View>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.footer}>
          {/* Discard / Retake */}
          <TouchableOpacity
            style={styles.actionBtnSecondary}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={22} color={Colors.white} />
            <Text style={styles.btnTextSecondary}>Retake</Text>
          </TouchableOpacity>

          {/* Save to Device */}
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Ionicons
                  name={saveStatus ? 'checkmark-circle' : 'download-outline'}
                  size={22}
                  color={Colors.black}
                />
                <Text style={styles.btnTextPrimary}>
                  {saveStatus || 'Save Media'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceTranslucent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    marginVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  videoText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  videoSubtext: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceTranslucent,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  btnTextSecondary: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 28,
  },
  btnTextPrimary: {
    color: Colors.black,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
});
