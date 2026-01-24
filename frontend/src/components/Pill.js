import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';


export const Pill = ({ label }) => {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );

const styles = StyleSheet.create({
  pill: {
    backgroundColor: theme.colors.brandSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 12,
    color: theme.colors.brandDark,
  },
});
