import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PlatformCamera } from '../camera/PlatformCamera';
import { CameraViewRef } from '../camera/cameraTypes';
import { CameraControls } from '../components/CameraControls';
import { LensCarousel } from '../components/LensCarousel';
import { ExploreLensesDrawer } from '../components/ExploreLensesDrawer';
import { PermissionView } from '../components/PermissionView';
import { CameraErrorView } from '../components/CameraErrorView';
import { MediaPreviewModal } from '../components/MediaPreviewModal';
import { SettingsScreen } from './SettingsScreen';
import { useCamera } from '../hooks/useCamera';
import { CategoryFilter, useLens } from '../hooks/useLens';
import { useRecording } from '../hooks/useRecording';
import { usePermissions } from '../hooks/usePermissions';
import { useFaceStatus } from '../hooks/useFaceStatus';
import { Colors } from '../constants/colors';
import { CapturedMedia } from '../types/camera';
import * as ImagePicker from 'expo-image-picker';
import { CUSTOM_BACKGROUND_LENS_ID, createCustomBackgroundLens } from '../lenses';
import { Lens } from '../types/lens';

export const CameraScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraViewRef>(null);

  // Camera state (always video mode like Snapchat)
  const {
    facing,
    toggleFacing,
    flash,
    cycleFlash,
    cameraError,
    handleCameraReady,
    handleCameraError,
  } = useCamera();

  const {
    lenses,
    allLenses,
    activeLens,
    comboLenses,
    isComboActive,
    toggleComboMode,
    removeComboLayer,
    clearCombo,
    categoryFilter,
    setCategory,
    selectLens,
    injectAndSelectLens,
    hasMore,
    isFetchingMore,
    fetchMoreLenses,
    lensNotice,
    fetchNotice,
    favoriteIds,
    toggleFavorite,
    isFavorite,
  } = useLens('normal');

  const [trackingState, setTrackingState] = useState<{
    quality?: 'perfect' | 'poor' | 'searching';
    lightingStatus?: 'good' | 'low_light' | 'backlit' | 'searching';
    hasFace?: boolean;
    faceWidth?: number;
  }>({});

  const handleFaceStatusChange = useCallback(
    (status: {
      quality: 'perfect' | 'poor' | 'searching';
      lightingStatus: 'good' | 'low_light' | 'backlit' | 'searching';
      hasFace: boolean;
      faceWidth?: number;
    }) => {
      setTrackingState(status);
    },
    []
  );

  const { status: faceStatus } = useFaceStatus(
    facing,
    activeLens.id,
    trackingState.quality,
    trackingState.lightingStatus,
    trackingState.hasFace !== undefined ? trackingState.hasFace : false,
    trackingState.faceWidth
  );

  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isExploreVisible, setIsExploreVisible] = useState(false);
  const [isBackgroundVideoPaused, setIsBackgroundVideoPaused] = useState(false);
  const [isBackgroundVideoAudioEnabled, setIsBackgroundVideoAudioEnabled] = useState(false);
  const [backgroundVideoRestartToken, setBackgroundVideoRestartToken] = useState(0);
  const backgroundVideoUri = activeLens.config.background?.videoUri;

  const isBackgroundVideo = Boolean(backgroundVideoUri);

  useEffect(() => {
    setIsBackgroundVideoPaused(false);
  }, [activeLens.id, backgroundVideoUri]);

  const handleToggleBackgroundVideo = useCallback(() => {
    setIsBackgroundVideoPaused((paused) => !paused);
  }, []);

  const handleToggleBackgroundVideoAudio = useCallback(() => {
    setIsBackgroundVideoAudioEnabled((enabled) => !enabled);
  }, []);

  const handleRestartBackgroundVideo = useCallback(() => {
    setIsBackgroundVideoPaused(false);
    setBackgroundVideoRestartToken((token) => token + 1);
  }, []);

  const handleSelectExploreLens = useCallback(
    async (lens: Lens, tab?: CategoryFilter) => {
      if (lens.id !== CUSTOM_BACKGROUND_LENS_ID) {
        injectAndSelectLens(lens, facing, tab);
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        aspect: [9, 16],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        const uri = result.assets[0].uri;
        const mediaType = result.assets[0].type === 'video' ? 'video' : 'image';
        injectAndSelectLens(createCustomBackgroundLens(uri, mediaType), facing, 'background');
      }
    },
    [facing, injectAndSelectLens]
  );

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

  const {
    isRecording,
    isPaused,
    formattedTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  } = useRecording(handleMaxDuration);

  useEffect(() => {
    if (!isRecording) setIsBackgroundVideoAudioEnabled(false);
  }, [isRecording]);

  // Toggle Pause / Resume during video recording
  const handleTogglePause = useCallback(async () => {
    if (!isRecording) return;
    if (isPaused) {
      resumeRecording();
      if (cameraRef.current?.resumeRecordingAsync) {
        await cameraRef.current.resumeRecordingAsync();
      }
    } else {
      pauseRecording();
      if (cameraRef.current?.pauseRecordingAsync) {
        await cameraRef.current.pauseRecordingAsync();
      }
    }
  }, [isRecording, isPaused, resumeRecording, pauseRecording]);

  // Permissions Hook
  const { isLoading, hasCameraPermission, canAskAgain, requestAllPermissions } =
    usePermissions();

  // Start video recording
  const handleStartVideo = useCallback(async () => {
    if (isRecording) return;
    startRecording();
    if (cameraRef.current) {
      await cameraRef.current.startRecordingAsync();
    }
  }, [isRecording, startRecording]);

  // Stop video recording
  const handleStopVideo = useCallback(async () => {
    if (!isRecording) return;
    stopRecording();
    if (cameraRef.current) {
      const media = await cameraRef.current.stopRecordingAsync();
      if (media) {
        setPreviewMedia(media);
        setIsPreviewVisible(true);
      }
    }
  }, [isRecording, stopRecording]);

  // Toggle video recording when tapping the center Big Record Button
  const handleRecordPress = useCallback(async () => {
    if (isRecording) {
      await handleStopVideo();
    } else {
      await handleStartVideo();
    }
  }, [isRecording, handleStartVideo, handleStopVideo]);

  // Full-screen horizontal swipe to switch to next / previous lens effect
  const activeLensIndexRef = useRef(0);
  activeLensIndexRef.current = lenses.findIndex((l) => l.id === activeLens.id);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          // Never intercept gestures in the bottom carousel track area (bottom 250px)
          const screenHeight = Dimensions.get('window').height;
          if (evt.nativeEvent.pageY > screenHeight - 250) {
            return false;
          }
          return (
            Math.abs(gestureState.dx) > 35 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -40) {
            // Swipe Left -> Next Lens
            const nextIdx = Math.min(
              lenses.length - 1,
              activeLensIndexRef.current + 1
            );
            if (lenses[nextIdx] && nextIdx !== activeLensIndexRef.current) {
              selectLens(lenses[nextIdx], facing);
            } else if (hasMore) {
              fetchMoreLenses();
            }
          } else if (gestureState.dx > 40) {
            // Swipe Right -> Previous Lens
            const prevIdx = Math.max(0, activeLensIndexRef.current - 1);
            if (lenses[prevIdx] && prevIdx !== activeLensIndexRef.current) {
              selectLens(lenses[prevIdx], facing);
            }
          }
        },
      }),
    [lenses, selectLens, facing, hasMore, fetchMoreLenses]
  );

  // 1. Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.textPrimary} />
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
          {/* Full-Screen Pure Camera Viewport with gesture swipe */}
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
            <PlatformCamera
              ref={cameraRef}
              facing={facing}
              flash={flash}
              mode="video"
              activeLens={activeLens}
              comboLenses={comboLenses}
              isRecording={isRecording}
              backgroundVideoPaused={isBackgroundVideoPaused}
              backgroundVideoAudioEnabled={isBackgroundVideoAudioEnabled}
              backgroundVideoRestartToken={backgroundVideoRestartToken}
              active={!isPreviewVisible}
              onCameraReady={handleCameraReady}
              onMountError={handleCameraError}
              onFaceStatusChange={handleFaceStatusChange}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {isBackgroundVideo && isRecording && (
            <View style={styles.backgroundVideoControls}>
              <TouchableOpacity
                style={styles.backgroundVideoPauseButton}
                onPress={handleToggleBackgroundVideo}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isBackgroundVideoPaused ? 'Resume background video' : 'Pause background video'}
              >
                <Ionicons
                  name={isBackgroundVideoPaused ? 'play' : 'pause'}
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.backgroundVideoPauseText}>
                  {isBackgroundVideoPaused ? 'Resume background' : 'Pause background'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backgroundVideoPauseButton}
                onPress={handleToggleBackgroundVideoAudio}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={isBackgroundVideoAudioEnabled ? 'Mute background video and use microphone' : 'Use background video audio and mute microphone'}
              >
                <Ionicons
                  name={isBackgroundVideoAudioEnabled ? 'volume-high' : 'volume-mute'}
                  size={16}
                  color={Colors.white}
                />
                <Text style={styles.backgroundVideoPauseText}>
                  {isBackgroundVideoAudioEnabled ? 'Video sound' : 'Mic sound'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backgroundVideoPauseButton}
                onPress={handleRestartBackgroundVideo}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Restart background video"
              >
                <Ionicons name="play-skip-back" size={16} color={Colors.white} />
                <Text style={styles.backgroundVideoPauseText}>Restart background</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TOP MINIMAL FLOATING CONTROLS: Completely hidden during recording for pure screen */}
          {!isRecording && (
            <View
              style={[
                styles.topControlsWrapper,
                { paddingTop: insets.top || 14, pointerEvents: 'box-none' },
              ]}
            >
              <CameraControls
                flash={flash}
                onCycleFlash={cycleFlash}
                onToggleFacing={toggleFacing}
                onOpenSettings={() => setIsSettingsVisible(true)}
                isRecording={false}
                faceStatus={faceStatus}
              />

              {/* Subtle notice tag if lens suggests front camera */}
              {lensNotice && (
                <View style={styles.noticePill}>
                  <Ionicons
                    name="information-circle-outline"
                    size={15}
                    color={Colors.accentYellow}
                  />
                  <Text style={styles.noticeText}>{lensNotice}</Text>
                </View>
              )}
            </View>
          )}

          {/* BOTTOM UNIFIED SNAPCHAT SHUTTER + SWIPE-THROUGH LENS CAROUSEL */}
          <View
            style={[
              styles.bottomControlsWrapper,
              { paddingBottom: Math.max(insets.bottom, 20), pointerEvents: 'box-none' },
            ]}
          >
            <LensCarousel
              lenses={lenses}
              activeLens={activeLens}
              comboLenses={comboLenses}
              isComboActive={isComboActive}
              isRecording={isRecording}
              isPaused={isPaused}
              formattedTime={formattedTime}
              isFavorite={isFavorite(activeLens.id)}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              fetchNotice={fetchNotice}
              hasPreviewMedia={!!previewMedia}
              categoryFilter={categoryFilter}
              onResetCategory={() => setCategory('all')}
              onSelectLens={(lens) => handleSelectExploreLens(lens, categoryFilter)}
              onToggleFavorite={() => toggleFavorite(activeLens.id)}
              onOpenExplore={() => setIsExploreVisible(true)}
              onOpenPreview={() => setIsPreviewVisible(true)}
              onFetchMore={fetchMoreLenses}
              onRecordPress={handleRecordPress}
              onToggleComboMode={toggleComboMode}
              onRemoveComboLayer={removeComboLayer}
              onClearCombo={clearCombo}
              onTogglePause={handleTogglePause}
              onHoldStart={handleStartVideo}
              onHoldEnd={handleStopVideo}
            />
          </View>
        </View>
      </View>

      {/* Recorded Video Preview Modal */}
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

      {/* Explore Lenses Bottom Drawer */}
      <ExploreLensesDrawer
        visible={isExploreVisible}
        lenses={allLenses}
        activeLens={activeLens}
        favoriteIds={favoriteIds}
        onSelectLens={handleSelectExploreLens}
        onToggleFavorite={toggleFavorite}
        onClose={() => setIsExploreVisible(false)}
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
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textPrimary,
    marginTop: 16,
    fontSize: 15,
    fontWeight: '600',
  },
  topControlsWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  recordingTimerFloating: {
    position: 'absolute',
    top: 18,
    alignSelf: 'center',
  },
  noticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 16, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
  },
  noticeText: {
    color: Colors.accentYellow,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  backgroundVideoPauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(12, 12, 16, 0.82)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  backgroundVideoControls: {
    position: 'absolute',
    top: 112,
    alignSelf: 'center',
    zIndex: 35,
    flexDirection: 'row',
    gap: 8,
  },
  backgroundVideoPauseText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomControlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
});
