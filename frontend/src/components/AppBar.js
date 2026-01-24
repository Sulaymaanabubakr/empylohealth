import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, COLORS } from '../theme/theme';

}

export const AppBar = ({ title, subtitle, right }) => {
  return (
    <View style={styles.appBar}>
      <View>
        <Text style={styles.appBarTitle}>{title}</Text>
        {subtitle ? <Text style={styles.appBarSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  appBarTitle: {
    fontFamily: 'SpaceGrotesk_600SemiBold',
    fontSize: 24,
    color: COLORS.text,
  },
  appBarSubtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: COLORS.gray,
  },
});
