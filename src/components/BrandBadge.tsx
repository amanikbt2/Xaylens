import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

export const BrandBadge: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        XAY<Text style={styles.textAccent}>LENS</Text>
      </Text>
      <View style={styles.dot} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceTranslucent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderGlass,
  },
  text: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2.5,
  },
  textAccent: {
    color: Colors.accentCyan,
    fontWeight: '400',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.accentCyan,
    marginLeft: 5,
  },
});
