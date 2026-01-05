import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

export function AppBar({ title, subtitle, right }) {
  return (
    <View style={styles.appBar}>
      <View>
        <Text style={styles.appBarTitle}>{title}</Text>
        {subtitle ? <Text style={styles.appBarSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  appBarTitle: {
    fontFamily: theme.typography.title,
    fontSize: 24,
    color: theme.colors.ink,
  },
  appBarSubtitle: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.inkMuted,
  },
});
