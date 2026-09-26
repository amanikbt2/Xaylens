import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
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
import { RecordingIndicator } from '../components/RecordingIndicator';
import { PermissionView } from '../components/PermissionView';
import { CameraErrorView } from '../components/CameraErrorView';
import { MediaPreviewModal } from '../components/MediaPreviewModal';
import { SettingsScreen } from './SettingsScreen';
import { useCamera } from '../hooks/useCamera';
import { useLens } from '../hooks/useLens';
import { useRecording } from '../hooks/useRecording';
import { usePermissions } from '../hooks/usePermissions';
import { useFaceStatus } from '../hooks/useFaceStatus';
import { Colors } from '../constants/colors';
import { CapturedMedia } from '../types/camera';

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

  const { status: faceStatus } = useFaceStatus(facing, activeLens.id);

  const [previewMedia, setPreviewMedia] = useState<CapturedMedia | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isExploreVisible, setIsExploreVisible] = useState(false);

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
              isRecording={isRecording}
              onCameraReady={handleCameraReady}
              onMountError={handleCameraError}
              style={StyleSheet.absoluteFill}
            />
          </View>

          {/* TOP MINIMAL FLOATING CONTROLS (Snapchat Style) */}
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
              isRecording={isRecording}
              faceStatus={faceStatus}
            />

            {/* Video Recording Timer Pill */}
            {isRecording && (
              <View style={styles.recordingTimerFloating}>
                <RecordingIndicator formattedTime={formattedTime} />
              </View>
            )}

            {/* Subtle notice tag if lens suggests front camera */}
            {lensNotice && !isRecording && (
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
              isRecording={isRecording}
              formattedTime={formattedTime}
              isFavorite={isFavorite(activeLens.id)}
              hasMore={hasMore}
              isFetchingMore={isFetchingMore}
              fetchNotice={fetchNotice}
              onSelectLens={(lens) => selectLens(lens, facing)}
              onToggleFavorite={() => toggleFavorite(activeLens.id)}
              onOpenExplore={() => setIsExploreVisible(true)}
              onFetchMore={fetchMoreLenses}
              onRecordPress={handleRecordPress}
              onHoldStart={handleStartVideo}
              onHoldEnd={handleStopVideo}
            />

            {/* Floating Last Recorded Clip Pill (only shown when a video was captured) */}
            {previewMedia && !isRecording && (
              <TouchableOpacity
                style={[
                  styles.lastVideoFloatingBtn,
                  { bottom: Math.max(insets.bottom, 20) + 22 },
                ]}
                onPress={() => setIsPreviewVisible(true)}
                activeOpacity={0.8}
                accessibilityLabel="Replay last recorded video"
              >
                <Ionicons name="play-circle" size={22} color={Colors.accentYellow} />
                <Text style={styles.lastVideoText}>Last Clip</Text>
              </TouchableOpacity>
            )}
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
        onSelectLens={(lens) => injectAndSelectLens(lens, facing)}
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
  bottomControlsWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
  lastVideoFloatingBtn: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 16, 0.68)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
    gap: 5,
  },
  lastVideoText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
