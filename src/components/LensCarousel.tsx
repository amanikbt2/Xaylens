import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Dimensions } from 'react-native';
import { Lens } from '../types/lens';
import { LensItem } from './LensItem';
import { Colors } from '../constants/colors';

interface LensCarouselProps {
  lenses: Lens[];
  activeLens: Lens;
  onSelectLens: (lens: Lens) => void;
}

const ITEM_WIDTH = 84; // width + horizontal margins

export const LensCarousel: React.FC<LensCarouselProps> = ({
  lenses,
  activeLens,
  onSelectLens,
}) => {
  const flatListRef = useRef<FlatList<Lens>>(null);
  const screenWidth = Dimensions.get('window').width;
  const sideSpacerWidth = (screenWidth - ITEM_WIDTH) / 2;

  // Center selected lens on mount / change
  useEffect(() => {
    const index = lenses.findIndex((l) => l.id === activeLens.id);
    if (index !== -1 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      } catch {
        // Can be ignored if flatlist layout is calculating
      }
    }
  }, [activeLens.id, lenses]);

  const renderItem = ({ item }: { item: Lens }) => {
    return (
      <LensItem
        lens={item}
        isSelected={item.id === activeLens.id}
        onSelect={(lens) => onSelectLens(lens)}
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Subtle active lens title tag */}
      <View style={styles.nameContainer}>
        <Text style={styles.lensName}>
          {activeLens.id === 'normal' ? 'Natural Look' : activeLens.name}
        </Text>
      </View>

      {/* Horizontal Carousel */}
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
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameContainer: {
    backgroundColor: Colors.surfaceTranslucent,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  lensName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
});
