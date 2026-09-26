import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lens, LensCategory } from '../types/lens';
import { LensSquareCard } from './LensSquareCard';
import { Colors } from '../constants/colors';

interface ExploreLensesDrawerProps {
  visible: boolean;
  lenses: Lens[];
  activeLens: Lens;
  favoriteIds: string[];
  onSelectLens: (lens: Lens) => void;
  onToggleFavorite: (lensId: string) => void;
  onClose: () => void;
}

type FilterTab = 'all' | 'favorites' | LensCategory;

const CATEGORY_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All Lenses' },
  { id: 'favorites', label: '⭐ Favorites' },
  { id: 'funny', label: 'Funny' },
  { id: 'animal', label: 'Animals' },
  { id: 'creature', label: 'Creatures' },
  { id: 'style', label: 'Styles' },
];

export const ExploreLensesDrawer: React.FC<ExploreLensesDrawerProps> = ({
  visible,
  lenses,
  activeLens,
  favoriteIds,
  onSelectLens,
  onToggleFavorite,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const filteredLenses = useMemo(() => {
    return lenses.filter((lens) => {
      // Tab filter
      if (activeTab === 'favorites') {
        if (!favoriteIds.includes(lens.id)) return false;
      } else if (activeTab !== 'all') {
        if (lens.category !== activeTab) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = lens.name.toLowerCase().includes(query);
        const matchesCategory = lens.category.toLowerCase().includes(query);
        const matchesDesc = lens.description.toLowerCase().includes(query);
        return matchesName || matchesCategory || matchesDesc;
      }

      return true;
    });
  }, [lenses, activeTab, favoriteIds, searchQuery]);

  const handleSelectCard = (lens: Lens) => {
    onSelectLens(lens);
    onClose();
  };

  const windowWidth =
    Platform.OS === 'web'
      ? Math.min(Dimensions.get('window').width, 440)
      : Dimensions.get('window').width;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            { width: windowWidth, paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Top Drag Handle Bar */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="sparkles" size={20} color={Colors.accentYellow} />
              <Text style={styles.headerTitle}>Explore Lenses</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredLenses.length}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={10}
              accessibilityLabel="Close Explore Lenses drawer"
            >
              <Ionicons name="close" size={20} color="#09090b" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchBarWrapper}>
            <Ionicons name="search" size={18} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lenses (e.g. alien, puppy, eyes...)"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && Platform.OS !== 'ios' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Category Tabs Bar */}
          <View style={styles.tabsWrapper}>
            <FlatList
              data={CATEGORY_TABS}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
              renderItem={({ item }) => {
                const isSelected = activeTab === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.tabPill,
                      isSelected && styles.tabPillSelected,
                    ]}
                    onPress={() => setActiveTab(item.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isSelected && styles.tabTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Square Cards Grid */}
          <FlatList
            data={filteredLenses}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <LensSquareCard
                lens={item}
                isSelected={item.id === activeLens.id}
                isFavorite={favoriteIds.includes(item.id)}
                onSelect={handleSelectCard}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                {activeTab === 'favorites' ? (
                  <>
                    <Ionicons
                      name="bookmark-outline"
                      size={44}
                      color={Colors.accentYellow}
                    />
                    <Text style={styles.emptyTitle}>No Favorite Lenses Yet</Text>
                    <Text style={styles.emptyText}>
                      Tap the bookmark icon on any lens to save it to your favorites for quick access!
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="search-outline"
                      size={44}
                      color="rgba(255, 255, 255, 0.35)"
                    />
                    <Text style={styles.emptyTitle}>No Lenses Found</Text>
                    <Text style={styles.emptyText}>
                      Try searching with another keyword or selecting a different category tab.
                    </Text>
                  </>
                )}
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: '82%',
    minHeight: '60%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dragHandleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: '#09090b',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  countBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.4)',
  },
  countText: {
    color: Colors.accentYellow,
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#09090b',
    fontSize: 14,
    padding: 0,
  },
  tabsWrapper: {
    marginBottom: 8,
  },
  tabsContainer: {
    paddingHorizontal: 14,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tabPillSelected: {
    backgroundColor: Colors.accentYellow,
    borderColor: Colors.accentYellow,
  },
  tabText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
  },
  tabTextSelected: {
    color: '#09090b',
  },
  gridContent: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#09090b',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
