import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lens } from '../types/lens';
import { Colors } from '../constants/colors';
import { createShadow } from '../utils/styles';

interface LensSquareCardProps {
  lens: Lens;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (lens: Lens) => void;
  onToggleFavorite: (lensId: string) => void;
}

export const LensSquareCard: React.FC<LensSquareCardProps> = ({
  lens,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
}) => {
  const iconName = (lens.iconName || 'sparkles-outline') as keyof typeof Ionicons.glyphMap;

  const numMatch = lens.name.match(/^(\d{2})\./);
  const numberTag = numMatch ? numMatch[1] : null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: isSelected ? lens.accentColor : 'rgba(255, 255, 255, 0.12)',
          borderWidth: isSelected ? 2.5 : 1,
        },
      ]}
      onPress={() => onSelect(lens)}
      activeOpacity={0.82}
    >
      {/* Background Accent Glow */}
      <View
        style={[
          styles.glowBg,
          { backgroundColor: lens.accentColor, opacity: isSelected ? 0.22 : 0.1 },
        ]}
      />

      {/* Top Bar inside Card: Number Badge & Category Pill & Bookmark Icon */}
      <View style={styles.topBar}>
        <View style={styles.topLeftBadges}>
          {numberTag && (
            <View style={styles.numberBadge}>
              <Text style={styles.numberText}>#{numberTag}</Text>
            </View>
          )}
          <View style={[styles.categoryPill, { borderColor: lens.accentColor }]}>
            <Text style={styles.categoryText}>{lens.category}</Text>
          </View>
        </View>

        <Pressable
          style={styles.bookmarkBtn}
          onPress={(e) => {
            e.stopPropagation();
            onToggleFavorite(lens.id);
          }}
          hitSlop={8}
        >
          <Ionicons
            name={isFavorite ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={isFavorite ? Colors.accentYellow : 'rgba(255, 255, 255, 0.7)'}
          />
        </Pressable>
      </View>

      {/* Center Icon Symbol */}
      <View style={styles.centerSection}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: isSelected
                ? lens.accentColor
                : 'rgba(255, 255, 255, 0.08)',
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={28}
            color={isSelected ? Colors.black : lens.accentColor}
          />
        </View>
      </View>

      {/* Bottom Label & Active Badge */}
      <View style={styles.bottomSection}>
        <Text style={styles.lensName} numberOfLines={1}>
          {lens.name}
        </Text>
        {isSelected && (
          <View style={[styles.activeBadge, { backgroundColor: lens.accentColor }]}>
            <Ionicons name="checkmark" size={12} color={Colors.black} />
            <Text style={styles.activeText}>ACTIVE</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 18,
    backgroundColor: '#16161e',
    padding: 10,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    ...createShadow('#000000', { width: 0, height: 4 }, 0.3, 6, 4),
  },
  glowBg: {
    ...StyleSheet.absoluteFill,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  topLeftBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  numberBadge: {
    backgroundColor: 'rgba(250, 204, 21, 0.22)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.55)',
  },
  numberText: {
    color: Colors.accentYellow,
    fontSize: 10,
    fontWeight: '900',
  },
  categoryPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
  },
  categoryText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    zIndex: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...createShadow('#000000', { width: 0, height: 2 }, 0.3, 4, 3),
  },
  bottomSection: {
    alignItems: 'center',
    zIndex: 2,
  },
  lensName: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    marginTop: 3,
    gap: 2,
  },
  activeText: {
    color: Colors.black,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
