import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lens } from '../types/lens';
import { LensItem, LENS_ITEM_WIDTH } from './LensItem';
import { Colors } from '../constants/colors';
import { triggerLensSelectHaptic } from '../utils/haptics';
import { createShadow, createTextShadow } from '../utils/styles';

interface LensCarouselProps {
  lenses: Lens[];
  activeLens: Lens;
  isRecording: boolean;
  isPaused?: boolean;
  formattedTime?: string;
  isFavorite?: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  fetchNotice?: string | null;
  hasPreviewMedia?: boolean;
  onSelectLens: (lens: Lens) => void;
  onRecordPress: () => void;
  onTogglePause?: () => void;
  onToggleFavorite?: () => void;
  onOpenExplore?: () => void;
  onOpenPreview?: () => void;
  onFetchMore?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

// Special Snapchat-style Explore launcher circle at the end of the carousel
const EXPLORE_CAROUSEL_ITEM: Lens = {
  id: 'explore-more',
  name: 'Explore',
  category: 'style',
  description: 'Search & explore all 50+ lenses in library',
  supportedCamera: 'both',
  effectType: 'color_filter',
  iconName: 'sparkles',
  accentColor: '#facc15',
  config: {},
};

export const LensCarousel: React.FC<LensCarouselProps> = ({
  lenses,
  activeLens,
  isRecording,
  isPaused = false,
  formattedTime = '00:00',
  isFavorite = false,
  hasMore = false,
  isFetchingMore = false,
  fetchNotice = null,
  hasPreviewMedia = false,
  onSelectLens,
  onRecordPress,
  onTogglePause,
  onToggleFavorite,
  onOpenExplore,
  onOpenPreview,
  onFetchMore,
}) => {
  const flatListRef = useRef<FlatList<Lens>>(null);
  const defaultWidth =
    Platform.OS === 'web'
      ? Math.min(Dimensions.get('window').width, 440)
      : Dimensions.get('window').width;

  const [containerWidth, setContainerWidth] = useState<number>(defaultWidth);
  const sideSpacerWidth = Math.max(0, (containerWidth - LENS_ITEM_WIDTH) / 2);

  const isUserDraggingRef = useRef(false);
  const currentScrollOffsetRef = useRef(0);
  const lastHapticIndexRef = useRef(-1);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Append Explore Lenses launcher circle to carousel data
  const carouselData = useMemo(() => {
    if (onOpenExplore) {
      return [...lenses, EXPLORE_CAROUSEL_ITEM];
    }
    return lenses;
  }, [lenses, onOpenExplore]);

  // Smooth helper to scroll FlatList so the target index is centered
  const scrollToLensIndex = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= carouselData.length || !flatListRef.current) return;
      try {
        if (animated) {
          isProgrammaticScrollRef.current = true;
          if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);
          programmaticTimerRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 350);
        }
        flatListRef.current.scrollToOffset({
          offset: index * LENS_ITEM_WIDTH,
          animated,
        });
      } catch {
        // Ignore layout timing
      }
    },
    [carouselData.length]
  );

  // Re-center active lens whenever activeLens or containerWidth changes (if user is not dragging or programmatically animating)
  useEffect(() => {
    if (isUserDraggingRef.current || isProgrammaticScrollRef.current || isRecording) return;
    const index = carouselData.findIndex((l) => l.id === activeLens.id);
    if (index !== -1) {
      scrollToLensIndex(index, true);
    }
  }, [activeLens.id, carouselData, isRecording, containerWidth, scrollToLensIndex]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  const handleScrollBeginDrag = useCallback(() => {
    isUserDraggingRef.current = true;
  }, []);

  // Track scroll position and fire gentle haptics as user glides through lenses
  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      currentScrollOffsetRef.current = offsetX;
      const centerIdx = Math.max(
        0,
        Math.min(carouselData.length - 1, Math.round(offsetX / LENS_ITEM_WIDTH))
      );
      if (centerIdx !== lastHapticIndexRef.current) {
        lastHapticIndexRef.current = centerIdx;
        triggerLensSelectHaptic();
      }
    },
    [carouselData.length]
  );

  // When swipe scroll ends and settles on a lens
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      currentScrollOffsetRef.current = offsetX;
      const centerIdx = Math.max(
        0,
        Math.min(carouselData.length - 1, Math.round(offsetX / LENS_ITEM_WIDTH))
      );

      // Snap cleanly to the exact interval
      scrollToLensIndex(centerIdx, true);

      const targetItem = carouselData[centerIdx];
      if (targetItem) {
        if (targetItem.id === 'explore-more') {
          if (onOpenExplore) {
            triggerLensSelectHaptic();
            onOpenExplore();
          }
        } else if (targetItem.id !== activeLens.id) {
          triggerLensSelectHaptic();
          onSelectLens(targetItem);
        }
      }

      setTimeout(() => {
        isUserDraggingRef.current = false;
      }, 50);
    },
    [activeLens.id, carouselData, onOpenExplore, onSelectLens, scrollToLensIndex]
  );

  // Tapping any flanking lens scrolls it smoothly to the center and selects it
  const handleTapLens = useCallback(
    (item: Lens) => {
      if (item.id === 'explore-more') {
        if (onOpenExplore) {
          triggerLensSelectHaptic();
          onOpenExplore();
        }
        return;
      }
      isUserDraggingRef.current = false;
      const idx = carouselData.findIndex((l) => l.id === item.id);
      if (idx !== -1) {
        triggerLensSelectHaptic();
        scrollToLensIndex(idx, true);
        onSelectLens(item);
      }
    },
    [carouselData, onOpenExplore, onSelectLens, scrollToLensIndex]
  );

  // Swipe for more: dynamically fetch next batch of lenses from Explore
  const handleEndReached = useCallback(() => {
    if (onFetchMore && hasMore && !isFetchingMore) {
      onFetchMore();
    }
  }, [hasMore, isFetchingMore, onFetchMore]);

  // Quick navigation arrows (useful on Desktop web / preview)
  const handleNavPrev = () => {
    const currentIndex = carouselData.findIndex((l) => l.id === activeLens.id);
    if (currentIndex > 0) {
      handleTapLens(carouselData[currentIndex - 1]);
    }
  };

  const handleNavNext = () => {
    const currentIndex = carouselData.findIndex((l) => l.id === activeLens.id);
    if (currentIndex < carouselData.length - 1) {
      handleTapLens(carouselData[currentIndex + 1]);
    }
  };

  const renderItem = ({ item, index }: { item: Lens; index: number }) => {
    const isSelected = item.id === activeLens.id;
    const activeIndex = carouselData.findIndex((l) => l.id === activeLens.id);
    const distanceFromCenter = Math.abs(index - activeIndex);
    return (
      <LensItem
        lens={item}
        isSelected={isSelected}
        isRecording={isRecording}
        distanceFromCenter={distanceFromCenter}
        onSelect={handleTapLens}
        onRecordPress={onRecordPress}
      />
    );
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* PURE RECORDING MODE: When recording, hide all other lenses, explore, favorites, and show ONLY the selected lens + timer + pause */}
      {isRecording ? (
        <View style={styles.pureRecordingContainer}>
          {/* Prominent Live Counting Recording Banner */}
          <View
            style={[
              styles.recordingBanner,
              isPaused && styles.recordingBannerPaused,
            ]}
          >
            <View
              style={[
                styles.recordingRedDot,
                isPaused && styles.recordingPausedDot,
              ]}
            />
            <Text style={styles.recordingBannerText}>
              {isPaused ? `PAUSED ${formattedTime}` : `REC ${formattedTime}`}
            </Text>
          </View>

          {/* Center Row: Pause/Resume Button + Single Active Red Shutter Lens */}
          <View style={styles.pureRecordingRow}>
            {/* Pause / Resume Button */}
            {onTogglePause ? (
              <TouchableOpacity
                style={[styles.pauseBtn, isPaused && styles.resumeBtn]}
                onPress={onTogglePause}
                activeOpacity={0.8}
                accessibilityLabel={isPaused ? 'Resume video recording' : 'Pause video recording'}
                accessibilityRole="button"
              >
                <Ionicons
                  name={isPaused ? 'play' : 'pause'}
                  size={19}
                  color="#ffffff"
                />
                <Text style={styles.pauseBtnText}>
                  {isPaused ? 'Resume' : 'Pause'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 84 }} />
            )}

            {/* The Selected Lens: Big Red Circle Shutter Button with White Stop Square */}
            <LensItem
              lens={activeLens}
              isSelected={true}
              isRecording={true}
              distanceFromCenter={0}
              onSelect={() => {}}
              onRecordPress={onRecordPress}
            />

            {/* Symmetrical Balance Spacer */}
            <View style={{ width: onTogglePause ? 84 : 0 }} />
          </View>

          {/* Clear Instruction Hint */}
          <Text style={styles.tapToFinishHint}>
            Tap red circle to stop & edit video
          </Text>
        </View>
      ) : (
        /* NORMAL BROWSE MODE: Carousel with all lenses, explore launcher, favorites, and controls */
        <>
          {/* Subtle Floating "Loaded Lenses from Explore" Toast Indicator */}
          {fetchNotice && (
            <View style={styles.fetchNoticeBadge}>
              <Text style={styles.fetchNoticeText}>{fetchNotice}</Text>
            </View>
          )}

          {/* SLEEK FROSTED GLASS CAROUSEL TRACK */}
          <View style={styles.glassCarouselTrack}>
            {/* PERMANENT FIXED CENTRAL SNAPCHAT SHUTTER RING OVERLAY */}
            <View style={styles.fixedCenterRingOverlay} pointerEvents="none">
              <View
                style={[
                  styles.fixedShutterRing,
                  {
                    borderColor: isRecording ? '#ef4444' : '#facc15',
                  },
                ]}
              >
                {/* Inner Grooved Accent Ring */}
                <View
                  style={[
                    styles.fixedInnerGrooveRing,
                    {
                      borderColor: isRecording
                        ? 'rgba(255, 255, 255, 0.45)'
                        : 'rgba(250, 204, 21, 0.45)',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Subtle Web / Desktop Left Arrow */}
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={[styles.webArrowBtn, styles.webArrowLeft]}
                onPress={handleNavPrev}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-back" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}

            <FlatList
              ref={flatListRef}
              data={carouselData}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              horizontal
              showsHorizontalScrollIndicator={false}
              ListHeaderComponent={
                <View style={{ width: sideSpacerWidth, height: LENS_ITEM_WIDTH }} />
              }
              ListFooterComponent={
                <View style={{ width: sideSpacerWidth, height: LENS_ITEM_WIDTH }} />
              }
              contentContainerStyle={styles.flatListContent}
              snapToInterval={LENS_ITEM_WIDTH}
              snapToAlignment="center"
              decelerationRate="fast"
              disableIntervalMomentum={false}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScroll={handleScroll}
              onMomentumScrollEnd={handleScrollEnd}
              onScrollEndDrag={handleScrollEnd}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              getItemLayout={(_, index) => ({
                length: LENS_ITEM_WIDTH,
                offset: LENS_ITEM_WIDTH * index,
                index,
              })}
              onScrollToIndexFailed={(info) => {
                setTimeout(() => {
                  scrollToLensIndex(info.index, false);
                }, 100);
              }}
              initialNumToRender={15}
              maxToRenderPerBatch={12}
              windowSize={11}
            />

            {/* Subtle Web / Desktop Right Arrow */}
            {Platform.OS === 'web' && (
              <TouchableOpacity
                style={[styles.webArrowBtn, styles.webArrowRight]}
                onPress={handleNavNext}
                hitSlop={8}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>

          {/* CENTERED ACTIVE LENS TITLE BADGE */}
          <View style={styles.activeLensTitleBadge} pointerEvents="none">
            <Text style={styles.activeLensTitleText} numberOfLines={1}>
              {activeLens.name}
            </Text>
          </View>

          {/* LOWER BAR: Bookmark on Left, Last Clip in Center (if available), Explore on Right */}
          <View style={styles.lowerBar}>
            {onToggleFavorite ? (
              <TouchableOpacity
                style={[
                  styles.lowerBtn,
                  isFavorite && styles.favoriteActiveBtn,
                ]}
                onPress={onToggleFavorite}
                activeOpacity={0.8}
                accessibilityLabel="Bookmark active lens"
              >
                <Ionicons
                  name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                  size={17}
                  color={isFavorite ? Colors.accentYellow : Colors.white}
                />
                <Text
                  style={[
                    styles.lowerBtnText,
                    isFavorite && { color: Colors.accentYellow },
                  ]}
                >
                  {isFavorite ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 70 }} />
            )}

            {/* Center: Last Clip button (if a video clip was recorded) */}
            {hasPreviewMedia && onOpenPreview ? (
              <TouchableOpacity
                style={styles.lastClipBtn}
                onPress={onOpenPreview}
                activeOpacity={0.8}
                accessibilityLabel="Replay last recorded video"
              >
                <Ionicons name="play-circle" size={18} color={Colors.accentYellow} />
                <Text style={styles.lastClipBtnText}>Last Clip</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flex: 1 }} />
            )}

            {onOpenExplore ? (
              <TouchableOpacity
                style={styles.lowerBtn}
                onPress={onOpenExplore}
                activeOpacity={0.8}
                accessibilityLabel="Explore all lenses"
              >
                <Ionicons
                  name="sparkles-outline"
                  size={16}
                  color={Colors.accentYellow}
                />
                <Text style={styles.lowerBtnText}>Explore</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 70 }} />
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  /* Pure Recording Mode Container */
  pureRecordingContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 6,
  },
  pureRecordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginTop: 6,
    marginBottom: 6,
  },
  pauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  resumeBtn: {
    backgroundColor: 'rgba(21, 128, 61, 0.85)',
    borderColor: '#4ade80',
  },
  pauseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tapToFinishHint: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
    marginBottom: 4,
    gap: 7,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingBannerPaused: {
    backgroundColor: '#d97706',
    shadowColor: '#d97706',
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  recordingPausedDot: {
    backgroundColor: '#fef08a',
  },
  recordingBannerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  fetchNoticeBadge: {
    position: 'absolute',
    top: -30,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.55)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 99,
  },
  fetchNoticeText: {
    color: Colors.accentYellow,
    fontSize: 12,
    fontWeight: '700',
  },
  glassCarouselTrack: {
    width: '100%',
    height: 108,
    backgroundColor: 'rgba(5, 5, 10, 0.68)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  fixedCenterRingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fixedShutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#facc15',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow('#facc15', { width: 0, height: 0 }, 0.65, 10, 8),
  },
  fixedInnerGrooveRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(250, 204, 21, 0.45)',
  },
  activeLensTitleBadge: {
    marginTop: 6,
    marginBottom: 2,
    paddingHorizontal: 14,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLensTitleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    ...createTextShadow('rgba(0, 0, 0, 0.9)', { width: 0, height: 1 }, 2),
  },
  webArrowBtn: {
    position: 'absolute',
    zIndex: 10,
    top: 38,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  webArrowLeft: {
    left: 8,
  },
  webArrowRight: {
    right: 8,
  },
  flatListContent: {
    alignItems: 'center',
  },
  lowerBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  lowerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 18, 24, 0.75)',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 5,
  },
  lowerBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  favoriteActiveBtn: {
    borderColor: 'rgba(250, 204, 21, 0.65)',
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
  },
  lastClipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.5)',
    gap: 6,
  },
  lastClipBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
