import React from 'react';
import { StyleSheet, View } from 'react-native';
import { theme } from '../theme/theme';

export const Card = ({ children, style }) => {
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    gap: theme.space.sm,
    shadowColor: '#1A2A2A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
});
export default Card;
