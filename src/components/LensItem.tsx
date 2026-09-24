import React, { useEffect, useRef } from 'react';
import { StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Lens } from '../types/lens';
import { Colors } from '../constants/colors';

interface LensItemProps {
  lens: Lens;
  isSelected: boolean;
  onSelect: (lens: Lens) => void;
}

export const LensItem: React.FC<LensItemProps> = React.memo(({
  lens,
  isSelected,
  onSelect,
}) => {
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1.18 : 1)).current;
  const ringAnim = useRef(new Animated.Value(isSelected ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.18 : 1,
        tension: 180,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(ringAnim, {
        toValue: isSelected ? 1 : 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected, scaleAnim, ringAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={[
          styles.circle,
          isSelected && styles.circleSelected,
          { borderColor: isSelected ? lens.accentColor : Colors.borderGlass },
        ]}
        onPress={() => onSelect(lens)}
        activeOpacity={0.8}
        accessibilityLabel={`Lens: ${lens.name}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <Ionicons
          name={lens.iconName as keyof typeof Ionicons.glyphMap}
          size={isSelected ? 26 : 22}
          color={isSelected ? lens.accentColor : Colors.white}
        />
      </TouchableOpacity>

      {/* Subtle indicator dot below when selected */}
      {isSelected && (
        <Animated.View
          style={[
            styles.activeIndicator,
            { backgroundColor: lens.accentColor, opacity: ringAnim },
          ]}
        />
      )}
    </Animated.View>
  );
});

LensItem.displayName = 'LensItem';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    width: 68,
    height: 78,
  },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.surfaceTranslucent,
    borderWidth: 2,
    borderColor: Colors.borderGlass,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  circleSelected: {
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    borderWidth: 2.5,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
  },
  activeIndicator: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 5,
  },
});
