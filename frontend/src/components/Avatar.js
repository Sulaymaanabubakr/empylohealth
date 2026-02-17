import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ImageStyle } from 'react-native';
import { getWellbeingRingColor } from '../utils/wellbeing';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getColor = (name) => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 55%)`;
};


const Avatar = ({ uri, name, size = 56, style, wellbeingScore = null, wellbeingLabel = '', wellbeingStatus = '', showWellbeingRing = false }) => {
  const initials = getInitials(name);
  const backgroundColor = getColor(name || initials);
  const hasNumericSize = typeof size === 'number' && Number.isFinite(size) && size > 0;
  const ringColor = showWellbeingRing
    ? getWellbeingRingColor({ wellbeingScore, wellbeingLabel, wellbeingStatus })
    : null;
  const hasRing = Boolean(ringColor);
  const ringThickness = hasRing && hasNumericSize ? 3 : 0;
  const innerSize = hasNumericSize ? Math.max(1, size - ringThickness * 2) : null;

  // Some screens (e.g. circle cards) intentionally pass size={null} and control dimensions via style.
  // Keep that rendering path working without wrapper math.
  if (!hasNumericSize) {
    if (uri && typeof uri === 'string' && uri.trim().length > 0) {
      return <Image source={{ uri }} style={[styles.image, style]} />;
    }
    return (
      <View style={[styles.fallback, { backgroundColor }, style]}>
        <Text style={styles.initials}>{initials}</Text>
      </View>
    );
  }

  if (uri && typeof uri === 'string' && uri.trim().length > 0) {
    return (
      <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2, borderWidth: ringThickness, borderColor: ringColor || 'transparent' }, style]}>
        <Image source={{ uri }} style={[styles.image, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]} />
      </View>
    );
  }

  return (
    <View style={[styles.wrapper, { width: size, height: size, borderRadius: size / 2, borderWidth: ringThickness, borderColor: ringColor || 'transparent' }, style]}>
      <View style={[styles.fallback, { width: innerSize, height: innerSize, borderRadius: innerSize / 2, backgroundColor }]}>
        <Text style={[styles.initials, { fontSize: Math.max(12, innerSize * 0.35) }]}>{initials}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default Avatar;
