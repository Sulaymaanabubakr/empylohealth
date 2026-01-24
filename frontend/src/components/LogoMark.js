import React from 'react';
import { StyleSheet, View } from 'react-native';

}

export const LogoMark = ({ color = '#E8F1EF', size = 40 }) => {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={[styles.bar, styles.barTop, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.barMid, { backgroundColor: color }]} />
      <View style={[styles.bar, styles.barBottom, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    position: 'absolute',
    width: 26,
    height: 6,
    borderRadius: 6,
    transform: [{ rotate: '-35deg' }],
  },
  barTop: {
    top: 2,
  },
  barMid: {
    top: 14,
  },
  barBottom: {
    top: 26,
  },
});
