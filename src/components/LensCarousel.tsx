import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Text,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  Dimensions,
  Platform,
} from 'react-native';
import { Lens } from '../types/lens';
import { LensItem, LENS_ITEM_WIDTH } from './LensItem';
import { Colors } from '../constants/colors';

interface LensCarouselProps {
  lenses: Lens[];
  activeLens: Lens;
  isRecording: boolean;
  onSelectLens: (lens: Lens) => void;
  onRecordPress: () => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
}

export const LensCarousel: React.FC<LensCarouselProps> = ({
  lenses,
  activeLens,
  isRecording,
  onSelectLens,
  onRecordPress,
  onHoldStart,
  onHoldEnd,
}) => {
  const flatListRef = useRef<FlatList<Lens>>(null);
  const defaultWidth =
    Platform.OS === 'web'
      ? Math.min(Dimensions.get('window').width, 440)
      : Dimensions.get('window').width;

  const [containerWidth, setContainerWidth] = useState<number>(defaultWidth);
  const sideSpacerWidth = Math.max(0, (containerWidth - LENS_ITEM_WIDTH) / 2);

  const isUserDraggingRef = useRef(false);
  const activeIndex = lenses.findIndex((l) => l.id === activeLens.id);
  const lastIndexRef = useRef(activeIndex >= 0 ? activeIndex : 0);

  // Outer Big Ring pulse animation during recording
  const ringPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    if (isRecording) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(ringPulseAnim, {
            toValue: 1.12,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(ringPulseAnim, {
            toValue: 1,
            duration: 550,
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

  // Keep FlatList centered on activeLens when changed externally (e.g. via screen swipe or tap)
  useEffect(() => {
    const index = lenses.findIndex((l) => l.id === activeLens.id);
    if (index !== -1) {
      lastIndexRef.current = index;
      if (!isUserDraggingRef.current && flatListRef.current) {
        try {
          flatListRef.current.scrollToOffset({
            offset: index * LENS_ITEM_WIDTH,
            animated: true,
          });
        } catch {
          // Ignore layout timing race
        }
      }
    }
  }, [activeLens.id, lenses]);

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
      if (lenses[centerIdx] && lenses[centerIdx].id !== activeLens.id) {
        lastIndexRef.current = centerIdx;
        onSelectLens(lenses[centerIdx]);
      }
    },
    [activeLens.id, lenses, onSelectLens]
  );

  const handleTapSideLens = useCallback(
    (lens: Lens) => {
      isUserDraggingRef.current = false;
      const idx = lenses.findIndex((l) => l.id === lens.id);
      if (idx !== -1 && flatListRef.current) {
        lastIndexRef.current = idx;
        flatListRef.current.scrollToOffset({
          offset: idx * LENS_ITEM_WIDTH,
          animated: true,
        });
      }
      onSelectLens(lens);
    },
    [lenses, onSelectLens]
  );

  const renderItem = ({ item, index }: { item: Lens; index: number }) => {
    const distanceFromCenter = Math.abs(index - (activeIndex >= 0 ? activeIndex : 0));
    return (
      <LensItem
        lens={item}
        isSelected={item.id === activeLens.id}
        isRecording={isRecording}
        distanceFromCenter={distanceFromCenter}
        onSelect={handleTapSideLens}
        onRecordPress={onRecordPress}
        onHoldStart={onHoldStart}
        onHoldEnd={onHoldEnd}
      />
    );
  };

  const outerRingColor = isRecording
    ? Colors.recordingRed
    : activeLens.id === 'normal'
    ? Colors.white
    : activeLens.accentColor;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* Floating Minimal Lens Title Pill */}
      <View style={styles.labelPill} pointerEvents="none">
        <Text style={styles.lensTitle}>
          { isRecording
            ? `Recording • ${activeLens.id === 'normal' ? 'Natural' : activeLens.name}`
            : activeLens.id === 'normal'
            ? 'Tap to Record • Swipe for Lenses'
            : activeLens.name }
        </Text>
      </View>

      {/* Unified Snapchat Track: Big Record Ring + Horizontal Lens Carousel */}
      <View style={styles.trackWrapper}>
        <FlatList
          ref={flatListRef}
          data={lenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: sideSpacerWidth,
            alignItems: 'center',
          }}
          snapToInterval={LENS_ITEM_WIDTH}
          snapToAlignment="start"
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
          initialNumToRender={7}
          maxToRenderPerBatch={7}
          windowSize={5}
        />

        {/* Fixed Center Big Snapchat Capture/Record Ring (pointerEvents="none" so swipes pass straight through!) */}
        <View style={styles.centerRingOverlay} pointerEvents="none">
          <Animated.View
            style={[
              styles.bigShutterRing,
              {
                borderColor: outerRingColor,
                transform: [{ scale: ringPulseAnim }],
                shadowColor: outerRingColor,
              },
            ]}
          />
        </View>
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
    backgroundColor: 'rgba(12, 12, 16, 0.52)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  lensTitle: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  trackWrapper: {
    width: '100%',
    height: 94,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
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
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 5,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.65,
    shadowRadius: 10,
  },
});
