import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlatformCamera } from '../camera/PlatformCamera';
import { CameraViewRef } from '../camera/cameraTypes';
import { CameraControls } from '../components/CameraControls';
import { LensCarousel } from '../components/LensCarousel';
import { ShutterButton } from '../components/ShutterButton';
import { ModeSelector } from '../components/ModeSelector';
import { RecordingIndicator } from '../components/RecordingIndicator';
import { PermissionView } from '../components/PermissionView';
import { CameraErrorView } from '../components/CameraErrorView';
import { MediaPreviewModal } from '../components/MediaPreviewModal';
import { SettingsScreen } from './SettingsScreen';
import { useCamera } from '../hooks/useCamera';
import { useLens } from '../hooks/useLens';
import { useRecording } from '../hooks/useRecording';
import { usePermissions } from '../hooks/usePermissions';
import { Colors } from '../constants/colors';
import { CapturedMedia } from '../types/camera';

export const CameraScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraViewRef>(null);

  // Hooks
  const {
    facing,
    toggleFacing,
    flash,
    cycleFlash,
    mode,
    switchMode,
    cameraError,
    handleCameraReady,
    handleCameraError,
  } = useCamera();

  const { lenses, activeLens, selectLens, lensNotice } = useLens('normal');

  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [lastCapturedThumb, setLastCapturedThumb] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  // Shutter flash effect
  const shutterFlashAnim = useRef(new Animated.Value(0)).current;

  // Video Recording Hook
  const handleMaxDuration = useCallback(async () => {
    if (cameraRef.current) {
      const media = await cameraRef.current.stopRecordingAsync();
      if (media) {
        setPreviewMedia(media);
        setIsPreviewVisible(true);
      }
    }
  }, []);

  const { isRecording, formattedTime, startRecording, stopRecording } =
    useRecording(handleMaxDuration);

  // Permissions Hook
  const { isLoading, hasCameraPermission, canAskAgain, requestAllPermissions } =
    usePermissions();

  // Shutter Click Handler
  const handleShutterPress = async () => {
    if (isCapturing) return;

    if (mode === 'photo') {
      setIsCapturing(true);
      // Trigger white flash animation
      Animated.sequence([
        Animated.timing(shutterFlashAnim, {
          toValue: 0.85,
          duration: 75,
          useNativeDriver: true,
        }),
        Animated.timing(shutterFlashAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      if (cameraRef.current) {
        const media = await cameraRef.current.takePictureAsync();
        setIsCapturing(false);
        if (media) {
          setPreviewMedia(media);
          setLastCapturedThumb(media.uri);
          setIsPreviewVisible(true);
        }
      } else {
        setIsCapturing(false);
      }
    } else {
      // Video mode
      if (isRecording) {
        stopRecording();
        if (cameraRef.current) {
          const media = await cameraRef.current.stopRecordingAsync();
          if (media) {
            setPreviewMedia(media);
            setIsPreviewVisible(true);
          }
        }
      } else {
        startRecording();
        if (cameraRef.current) {
          await cameraRef.current.startRecordingAsync();
        }
      }
    }
  };

  // 1. Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={styles.loadingText}>Initializing XayLens...</Text>
      </View>
    );
  }

  // 2. Permission denied state
  if (!hasCameraPermission) {
    return (
      <PermissionView
        onRequestPermission={requestAllPermissions}
        canAskAgain={canAskAgain}
      />
    );
  }

  // 3. Camera hardware error state
  if (cameraError) {
    return (
      <CameraErrorView
        error={cameraError}
        onRetry={() => {
          handleCameraReady();
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      {/* Centered container for desktop web responsiveness */}
      <View style={styles.desktopWrapper}>
        <View style={styles.cameraContainer}>
          {/* Hardware / Web Camera Viewport */}
          <PlatformCamera
            ref={cameraRef}
            facing={facing}
            flash={flash}
            mode={mode}
            activeLens={activeLens}
            isRecording={isRecording}
            onCameraReady={handleCameraReady}
            onMountError={handleCameraError}
            style={StyleSheet.absoluteFill}
          />

          {/* Shutter Flash Animation Overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              styles.shutterFlash,
              { opacity: shutterFlashAnim },
            ]}
            pointerEvents="none"
          />

          {/* TOP CONTROLS */}
          <View style={[styles.topControlsWrapper, { paddingTop: insets.top || 16 }]}>
            <CameraControls
              flash={flash}
              onCycleFlash={cycleFlash}
              onOpenSettings={() => setIsSettingsVisible(true)}
            />

            {/* Notice tag if lens suggests front camera */}
            {lensNotice && (
              <View style={styles.noticePill}>
                <Ionicons name="information-circle-outline" size={16} color={Colors.accentYellow} />
                <Text style={styles.noticeText}>{lensNotice}</Text>
              </View>
            )}

            {/* Video Recording Indicator */}
            {isRecording && <RecordingIndicator formattedTime={formattedTime} />}
          </View>

          {/* BOTTOM CONTROLS */}
          <View style={[styles.bottomControlsWrapper, { paddingBottom: insets.bottom || 24 }]}>
            {/* Horizontal Lens Carousel */}
            {!isRecording && (
              <LensCarousel
                lenses={lenses}
                activeLens={activeLens}
                onSelectLens={(lens) => selectLens(lens, facing)}
              />
            )}

            {/* Mode Selector (Photo / Video) */}
            <ModeSelector
              mode={mode}
              onSelectMode={switchMode}
              disabled={isRecording}
            />

            {/* Shutter Bar with Gallery & Camera Switch */}
            <View style={styles.shutterBar}>
              {/* Media Thumbnail / Gallery button */}
              <TouchableOpacity
                style={styles.auxButton}
                onPress={() => {
                  if (lastCapturedThumb && previewMedia) {
                    setIsPreviewVisible(true);
                  }
                }}
                activeOpacity={0.7}
                accessibilityLabel="View captured media"
              >
                {lastCapturedThumb ? (
                  <Image source={{ uri: lastCapturedThumb }} style={styles.thumbImage} />
                ) : (
                  <Ionicons name="images-outline" size={24} color={Colors.white} />
                )}
              </TouchableOpacity>

              {/* Central Shutter Button */}
              <ShutterButton
                mode={mode}
                isRecording={isRecording}
                onPress={handleShutterPress}
                disabled={isCapturing}
              />

              {/* Camera Switch (Flip) Button */}
              <TouchableOpacity
                style={styles.auxButton}
                onPress={toggleFacing}
                activeOpacity={0.7}
                disabled={isRecording}
                accessibilityLabel="Flip camera facing"
              >
                <Ionicons name="camera-reverse-outline" size={26} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Captured Media Preview Modal */}
      <MediaPreviewModal
        visible={isPreviewVisible}
        media={previewMedia}
        onClose={() => setIsPreviewVisible(false)}
      />

      {/* Settings Modal */}
      <SettingsScreen
        visible={isSettingsVisible}
        onClose={() => setIsSettingsVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  desktopWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 440 : undefined,
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#09090b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.white,
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  shutterFlash: {
    backgroundColor: '#ffffff',
    zIndex: 50,
  },
  topControlsWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  noticeText: {
    color: Colors.accentYellow,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomControlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  shutterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 32,
  },
  auxButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceTranslucent,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
