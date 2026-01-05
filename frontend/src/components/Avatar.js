import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export function Avatar({ label }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: theme.typography.bodyMedium,
    color: theme.colors.brandDark,
    fontSize: 12,
  },
});
