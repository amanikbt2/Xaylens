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
            toValue: 1.1,
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

  // Scroll FlatList so the target lens index sits DEAD-CENTER inside the Big Circle
  const scrollToLensIndex = useCallback(
    (index: number, animated = true) => {
      if (index < 0 || index >= lenses.length || !flatListRef.current) return;
      try {
        flatListRef.current.scrollToOffset({
          offset: index * LENS_ITEM_WIDTH,
          animated,
        });
      } catch {
        // Ignore transient layout timing
      }
    },
    [lenses.length]
  );

  // Re-center active lens inside the Big Circle whenever activeLens or containerWidth changes
  useEffect(() => {
    const index = lenses.findIndex((l) => l.id === activeLens.id);
    if (index !== -1) {
      lastIndexRef.current = index;
      if (!isUserDraggingRef.current) {
        const timer = setTimeout(() => {
          scrollToLensIndex(index, true);
        }, 16);
        return () => clearTimeout(timer);
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
      if (!isUserDraggingRef.current) return;
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

  const outerRingColor = isRecording
    ? '#ef4444'
    : activeLens.id === 'normal'
    ? Colors.white
    : activeLens.accentColor;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* ROW 1: Active Lens Pill OR Live Red Recording Timer Pill */}
      <View
        style={[
          styles.labelPill,
          isRecording && styles.recordingActivePill,
        ]}
        pointerEvents="none"
      >
        {isRecording && <View style={styles.recordingRedDot} />}
        <Text style={styles.lensTitle}>
          {isRecording
            ? `REC ${formattedTime} • Tap Circle to Stop`
            : activeLens.id === 'normal'
            ? 'Natural • Tap Circle to Record'
            : activeLens.name}
        </Text>
      </View>

      {/* ROW 2: Pure Horizontal Lens Track with Current Lens Centered INSIDE the Big Circle */}
      <View style={styles.trackWrapper}>
        <FlatList
          ref={flatListRef}
          data={lenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          ListHeaderComponent={<View style={{ width: sideSpacerWidth }} />}
          ListFooterComponent={<View style={{ width: sideSpacerWidth }} />}
          contentContainerStyle={styles.flatListContent}
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
          initialNumToRender={9}
          maxToRenderPerBatch={9}
          windowSize={7}
        />

        {/* Fixed Center Big Circle Ring surrounding the active lens */}
        <View style={styles.centerRingOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.bigShutterRing,
              {
                borderColor: outerRingColor,
                backgroundColor: isRecording
                  ? 'rgba(239, 68, 68, 0.18)'
                  : 'transparent',
                transform: [{ scale: ringPulseAnim }],
                shadowColor: outerRingColor,
              },
            ]}
          />
        </View>
      </View>

      {/* ROW 3 (LOWER BAR): Bookmark & Explore Icons cleanly organized BELOW the lenses */}
      <View style={styles.lowerActionRow}>
        {/* Left: Bookmark Favorite Lens */}
        {onToggleFavorite ? (
          <TouchableOpacity
            style={[
              styles.lowerPillBtn,
              isFavorite && styles.favoriteActiveBtn,
              isRecording && styles.hiddenWhileRecording,
            ]}
            disabled={isRecording}
            onPress={onToggleFavorite}
            activeOpacity={0.8}
            accessibilityLabel="Bookmark active lens"
          >
            <Ionicons
              name={isFavorite ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isFavorite ? Colors.accentYellow : Colors.white}
            />
            <Text
              style={[
                styles.lowerPillText,
                isFavorite && { color: Colors.accentYellow },
              ]}
            >
              {isFavorite ? 'Saved' : 'Save'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lowerSpacer} />
        )}

        {/* Center subtle status hint */}
        <Text style={styles.lowerCenterHint}>
          {isRecording ? 'Recording Video...' : 'Swipe Lenses • Tap Center'}
        </Text>

        {/* Right: Explore All Lenses */}
        {onOpenExplore ? (
          <TouchableOpacity
            style={[
              styles.lowerPillBtn,
              isRecording && styles.hiddenWhileRecording,
            ]}
            disabled={isRecording}
            onPress={onOpenExplore}
            activeOpacity={0.8}
            accessibilityLabel="Explore all lenses"
          >
            <Ionicons
              name="sparkles-outline"
              size={17}
              color={Colors.accentYellow}
            />
            <Text style={styles.lowerPillText}>Explore</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.lowerSpacer} />
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
  labelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 16, 0.68)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    gap: 6,
  },
  recordingActivePill: {
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    borderColor: '#ffffff',
  },
  recordingRedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  lensTitle: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  trackWrapper: {
    width: '100%',
    height: 92,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  flatListContent: {
    alignItems: 'center',
  },
  centerRingOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigShutterRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 10,
  },
  lowerActionRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  lowerPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 22, 0.78)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    gap: 6,
  },
  favoriteActiveBtn: {
    borderColor: 'rgba(250, 204, 21, 0.65)',
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
  },
  lowerPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  lowerCenterHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  lowerSpacer: {
    width: 76,
  },
  hiddenWhileRecording: {
    opacity: 0.25,
  },
});
