import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Animated,
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

interface LensCarouselProps {
  lenses: Lens[];
  activeLens: Lens;
  isRecording: boolean;
  formattedTime?: string;
  isFavorite?: boolean;
  onSelectLens: (lens: Lens) => void;
  onRecordPress: () => void;
  onToggleFavorite?: () => void;
  onOpenExplore?: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

const SHUTTER_RING_SIZE = 84;

export const LensCarousel: React.FC<LensCarouselProps> = ({
  lenses,
  activeLens,
  isRecording,
  formattedTime = '00:00',
  isFavorite = false,
  onSelectLens,
  onRecordPress,
  onToggleFavorite,
  onOpenExplore,
}) => {
  const flatListRef = useRef<FlatList<Lens>>(null);
  const defaultWidth =
    Platform.OS === 'web'
      ? Math.min(Dimensions.get('window').width, 440)
      : Dimensions.get('window').width;

  const [containerWidth, setContainerWidth] = useState<number>(defaultWidth);
  const sideSpacerWidth = Math.max(0, (containerWidth - LENS_ITEM_WIDTH) / 2);

  const isUserDraggingRef = useRef(false);
  const activeIndex = Math.max(
    0,
    lenses.findIndex((l) => l.id === activeLens.id)
  );
  const lastIndexRef = useRef(activeIndex);

  // Outer Big Ring pulse animation during recording
  const ringPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulseAnim, {
            toValue: 1.08,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(ringPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
    } else {
      ringPulseAnim.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isRecording, ringPulseAnim]);

  // Scroll FlatList so the target lens sits dead-center inside the center ring
  const scrollToLensIndex = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= lenses.length || !flatListRef.current) return;
      try {
        flatListRef.current.scrollToOffset({
          offset: index * LENS_ITEM_WIDTH,
          animated,
        });
      } catch {
        // Ignore layout timing
      }
    },
    [lenses.length]
  );

  // Re-center active lens whenever activeLens or containerWidth changes
  useEffect(() => {
    const index = lenses.findIndex((l) => l.id === activeLens.id);
    if (index !== -1 && lastIndexRef.current !== index) {
      lastIndexRef.current = index;
      if (!isUserDraggingRef.current) {
        scrollToLensIndex(index, true);
      }
    }
  }, [activeLens.id, containerWidth, lenses, scrollToLensIndex]);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0) {
      setContainerWidth(width);
    }
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const centerIdx = Math.max(
        0,
        Math.min(lenses.length - 1, Math.round(offsetX / LENS_ITEM_WIDTH))
      );
      if (centerIdx !== lastIndexRef.current && lenses[centerIdx]) {
        lastIndexRef.current = centerIdx;
        triggerLensSelectHaptic();
        onSelectLens(lenses[centerIdx]);
      }
    },
    [lenses, onSelectLens]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isUserDraggingRef.current = true;
  }, []);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const centerIdx = Math.max(
        0,
        Math.min(lenses.length - 1, Math.round(offsetX / LENS_ITEM_WIDTH))
      );
      isUserDraggingRef.current = false;
      scrollToLensIndex(centerIdx, true);
      if (lenses[centerIdx]) {
        lastIndexRef.current = centerIdx;
        if (lenses[centerIdx].id !== activeLens.id) {
          triggerLensSelectHaptic();
          onSelectLens(lenses[centerIdx]);
        }
      }
    },
    [activeLens.id, lenses, onSelectLens, scrollToLensIndex]
  );

  const handleTapSideLens = useCallback(
    (lens: Lens) => {
      isUserDraggingRef.current = false;
      const idx = lenses.findIndex((l) => l.id === lens.id);
      if (idx !== -1) {
        lastIndexRef.current = idx;
        triggerLensSelectHaptic();
        scrollToLensIndex(idx, true);
        onSelectLens(lens);
      }
    },
    [lenses, onSelectLens, scrollToLensIndex]
  );

  const renderItem = ({ item, index }: { item: Lens; index: number }) => {
    const distanceFromCenter = Math.abs(index - activeIndex);
    return (
      <LensItem
        lens={item}
        isSelected={item.id === activeLens.id}
        isRecording={isRecording}
        distanceFromCenter={distanceFromCenter}
        onSelect={handleTapSideLens}
        onRecordPress={onRecordPress}
      />
    );
  };

  const glowRingColor = isRecording
    ? '#ef4444'
    : activeLens.accentColor || '#38bdf8';

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Live Red Recording Timer Banner (shown when recording) */}
      {isRecording && (
        <View style={styles.recordingBanner}>
          <View style={styles.recordingRedDot} />
          <Text style={styles.recordingBannerText}>
            REC {formattedTime} • Tap circle to stop & edit
          </Text>
        </View>
      )}

      {/* SLEEK FROSTED GLASS CAROUSEL TRACK */}
      <View style={styles.glassCarouselTrack}>
        {/* FREE SNAP HORIZONTAL FLATLIST */}
        <FlatList
          ref={flatListRef}
          data={lenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.flatListContent,
            {
              paddingLeft: sideSpacerWidth,
              paddingRight: sideSpacerWidth,
            },
          ]}
          snapToInterval={LENS_ITEM_WIDTH}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScroll={handleScroll}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
          getItemLayout={(_, index) => ({
            length: LENS_ITEM_WIDTH,
            offset: LENS_ITEM_WIDTH * index,
            index,
          })}
          onScrollToIndexFailed={() => {}}
          initialNumToRender={11}
          maxToRenderPerBatch={11}
          windowSize={9}
        />

        {/* FIXED SINGLE CENTER BIG SHUTTER RING (Positioned in exact center) */}
        <View style={styles.centerTargetRingOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.neonShutterRing,
              {
                borderColor: glowRingColor,
                shadowColor: glowRingColor,
                transform: [{ scale: ringPulseAnim }],
                backgroundColor: isRecording
                  ? 'rgba(239, 68, 68, 0.22)'
                  : 'transparent',
              },
            ]}
          />
        </View>
      </View>

      {/* LOWER BAR: Bookmark & Explore Buttons neatly organized BELOW the carousel */}
      <View style={styles.lowerBar}>
        {onToggleFavorite ? (
          <TouchableOpacity
            style={[
              styles.lowerBtn,
              isFavorite && styles.favoriteActiveBtn,
              isRecording && styles.dimmedWhileRecording,
            ]}
            disabled={isRecording}
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

        <Text style={styles.lowerInstructionHint}>
          {isRecording ? 'Recording video...' : 'Swipe lenses or tap circle'}
        </Text>

        {onOpenExplore ? (
          <TouchableOpacity
            style={[
              styles.lowerBtn,
              isRecording && styles.dimmedWhileRecording,
            ]}
            disabled={isRecording}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 6,
    gap: 6,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  recordingBannerText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  glassCarouselTrack: {
    width: '100%',
    height: 104,
    backgroundColor: 'rgba(5, 5, 10, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  flatListContent: {
    alignItems: 'center',
  },
  centerTargetRingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    marginLeft: -SHUTTER_RING_SIZE / 2,
    width: SHUTTER_RING_SIZE,
    height: SHUTTER_RING_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  neonShutterRing: {
    width: SHUTTER_RING_SIZE,
    height: SHUTTER_RING_SIZE,
    borderRadius: SHUTTER_RING_SIZE / 2,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
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
  favoriteActiveBtn: {
    borderColor: 'rgba(250, 204, 21, 0.65)',
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
  },
  lowerBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  lowerInstructionHint: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    fontWeight: '600',
  },
  dimmedWhileRecording: {
    opacity: 0.2,
  },
});
