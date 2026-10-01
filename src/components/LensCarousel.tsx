import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
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
  comboLenses?: Lens[];
  isComboActive?: boolean;
  isRecording: boolean;
  isPaused?: boolean;
  formattedTime?: string;
  isFavorite?: boolean;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  fetchNotice?: string | null;
  hasPreviewMedia?: boolean;
  categoryFilter?: string;
  onResetCategory?: () => void;
  onSelectLens: (lens: Lens) => void;
  onRecordPress: () => void;
  onTogglePause?: () => void;
  onToggleFavorite?: () => void;
  onOpenExplore?: () => void;
  onOpenPreview?: () => void;
  onFetchMore?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  onToggleComboMode?: () => void;
  onRemoveComboLayer?: (lensId: string) => void;
  onClearCombo?: () => void;
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
  comboLenses = [],
  isComboActive = false,
  isRecording,
  isPaused = false,
  formattedTime = '00:00',
  isFavorite = false,
  hasMore = false,
  isFetchingMore = false,
  fetchNotice = null,
  hasPreviewMedia = false,
  categoryFilter = 'all',
  onResetCategory,
  onSelectLens,
  onRecordPress,
  onTogglePause,
  onToggleFavorite,
  onOpenExplore,
  onOpenPreview,
  onFetchMore,
  onToggleComboMode,
  onRemoveComboLayer,
  onClearCombo,
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

  const snapOffsets = useMemo(
    () => carouselData.map((_, index) => index * LENS_ITEM_WIDTH),
    [carouselData]
  );

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

  // Re-center active lens whenever the active item changes or after modal selection
  useEffect(() => {
    if (isRecording) return;
    const index = carouselData.findIndex((l) => l.id === activeLens.id);
    if (index === -1) return;

    const frame = requestAnimationFrame(() => {
      scrollToLensIndex(index, true);
    });

    return () => cancelAnimationFrame(frame);
  }, [activeLens.id, carouselData, containerWidth, isRecording, scrollToLensIndex]);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      if (width > 0 && Math.abs(width - containerWidth) > 1) {
        setContainerWidth(width);
      }
    },
    [containerWidth]
  );

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

          {/* Active Category Filter Pill */}
          {categoryFilter !== 'all' && onResetCategory && (
            <View style={styles.activeCategoryPill}>
              <Ionicons name="filter-outline" size={13} color={Colors.accentYellow} />
              <Text style={styles.activeCategoryText}>
                {categoryFilter.toUpperCase()} ({lenses.length})
              </Text>
              <TouchableOpacity
                style={styles.resetCategoryBtn}
                onPress={onResetCategory}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={15} color="#ffffff" />
                <Text style={styles.resetCategoryText}>Show All</Text>
              </TouchableOpacity>
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
              style={{ width: '100%', height: 108 }}
              snapToOffsets={snapOffsets}
              decelerationRate="fast"
              disableIntervalMomentum={true}
              scrollEventThrottle={16}
              onScrollBeginDrag={handleScrollBeginDrag}
              onScroll={handleScroll}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollEnd={handleScrollEnd}
              onContentSizeChange={() => {
                if (isRecording) return;
                const index = carouselData.findIndex((l) => l.id === activeLens.id);
                if (index !== -1) {
                  requestAnimationFrame(() => scrollToLensIndex(index, false));
                }
              }}
              onEndReached={handleEndReached}
              onEndReachedThreshold={0.5}
              getItemLayout={(_, index) => ({
                length: LENS_ITEM_WIDTH,
                offset: sideSpacerWidth + LENS_ITEM_WIDTH * index,
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

          </View>

          {/* MULTI-LENS ACTIVE COMBO LAYERS BAR */}
          {isComboActive && (
            <View style={styles.comboStackBar}>
              <View style={styles.comboStackHeader}>
                <Ionicons name="layers" size={13} color="#facc15" />
                <Text style={styles.comboStackTitle}>
                  Layered Combo ({comboLenses.length})
                </Text>
                {onClearCombo && comboLenses.length > 0 && (
                  <TouchableOpacity onPress={onClearCombo} style={styles.comboClearBtn}>
                    <Text style={styles.comboClearText}>Clear All</Text>
                  </TouchableOpacity>
                )}
              </View>
              {comboLenses.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.comboPillRow}
                >
                  {comboLenses.map((item) => (
                    <View
                      key={`combo_${item.id}`}
                      style={[
                        styles.comboPill,
                        { borderColor: item.accentColor || '#38bdf8' },
                      ]}
                    >
                      <Text style={styles.comboPillName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      {onRemoveComboLayer && (
                        <TouchableOpacity
                          onPress={() => onRemoveComboLayer(item.id)}
                          style={styles.comboPillRemove}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={15} color="#ef4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.comboHintText}>
                  Tap any lens below to layer on top
                </Text>
              )}
            </View>
          )}

          {/* CENTERED ACTIVE LENS TITLE BADGE */}
          <View style={styles.activeLensTitleBadge} pointerEvents="none">
            <Text style={styles.activeLensTitleText} numberOfLines={1}>
              {isComboActive
                ? comboLenses.length > 0
                  ? comboLenses.map((l) => l.name).join(' + ')
                  : 'Select Combo Layer'
                : activeLens.name}
            </Text>
          </View>

          {/* LOWER BAR: Bookmark on Left, Last Clip in Center (if available), + Combo & Explore on Right */}
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

            {/* Right: + Add Combo Button */}
            {onToggleComboMode && (
              <TouchableOpacity
                style={[
                  styles.lowerBtn,
                  styles.comboActionBtn,
                  isComboActive && styles.comboActionBtnActive,
                ]}
                onPress={onToggleComboMode}
                activeOpacity={0.8}
                accessibilityLabel="Toggle multi-lens combo layering"
              >
                <Ionicons
                  name={isComboActive ? 'layers' : 'layers-outline'}
                  size={16}
                  color={isComboActive ? '#facc15' : Colors.white}
                />
                <Text
                  style={[
                    styles.lowerBtnText,
                    isComboActive && { color: '#facc15', fontWeight: '800' },
                  ]}
                >
                  {isComboActive
                    ? comboLenses.length > 0
                      ? `Combo (${comboLenses.length})`
                      : 'Combo On'
                    : '+ Combo'}
                </Text>
              </TouchableOpacity>
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
  activeCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.55)',
    marginBottom: 6,
    gap: 6,
  },
  activeCategoryText: {
    color: Colors.accentYellow,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  resetCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 4,
    gap: 4,
  },
  resetCategoryText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
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
  /* Multi-Lens Combo Styles */
  comboActionBtn: {
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  comboActionBtnActive: {
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    borderColor: 'rgba(250, 204, 21, 0.85)',
  },
  comboStackBar: {
    width: '92%',
    backgroundColor: 'rgba(12, 12, 18, 0.88)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  comboStackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  comboStackTitle: {
    color: '#facc15',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginLeft: 6,
    flex: 1,
  },
  comboClearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  comboClearText: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '700',
  },
  comboPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  comboPillName: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    maxWidth: 110,
  },
  comboPillRemove: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  comboHintText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 4,
  },
});
