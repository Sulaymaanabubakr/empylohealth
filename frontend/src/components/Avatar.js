import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ImageStyle } from 'react-native';

const getInitials = (name): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getColor = (name): string => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 45%, 55%)`;
};

  uri?: string | null;
  name?: string;
  size?: number;
}

const Avatar = ({ uri, name, size = 56, style }) => {
  const initials = getInitials(name);
  const backgroundColor = getColor(name || initials);

  if (uri && typeof uri === 'string' && uri.trim().length > 0) {
    return <Image source={{ uri }} style={[styles.image, { width: size, height: size, borderRadius: size / 2 }, style]} />;
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}>
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.35) }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
