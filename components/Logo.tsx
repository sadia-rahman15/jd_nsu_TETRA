import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

export function Logo({ size = 'medium', showText = true }: LogoProps) {
  const sizeMap = {
    small: { container: 28, bar: 24, height: 10, fontSize: 14 },
    medium: { container: 40, bar: 36, height: 14, fontSize: 20 },
    large: { container: 56, bar: 50, height: 18, fontSize: 28 },
  };

  const { container, bar, height, fontSize } = sizeMap[size];

  return (
    <View style={styles.logoContainer}>
      <View style={[styles.logoBox, { width: container, height: container }]}>
        <View
          style={[
            styles.bar,
            {
              width: bar,
              height: height,
              backgroundColor: '#3cd09d',
              transform: [{ rotate: '45deg' }],
              borderRadius: 6,
            },
          ]}
        />
        <View
          style={[
            styles.bar,
            {
              width: bar,
              height: height,
              backgroundColor: '#0052cc',
              transform: [{ rotate: '-45deg' }],
              borderRadius: 6,
              position: 'absolute',
            },
          ]}
        />
      </View>
      {showText && (
        <Text style={[styles.logoText, { fontSize }]}>AmarCure</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBox: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    position: 'absolute',
    opacity: 0.9,
  },
  logoText: {
    fontWeight: '800',
    color: '#0f172a',
  },
});