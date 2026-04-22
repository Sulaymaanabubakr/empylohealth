import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme, COLORS } from '../theme/theme';
import { FONT_FAMILIES } from '../theme/fonts';


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
    fontFamily: FONT_FAMILIES.displaySemiBold,
    fontSize: 24,
    color: COLORS.text,
  },
  appBarSubtitle: {
    fontFamily: FONT_FAMILIES.bodyRegular,
    fontSize: 14,
    color: COLORS.gray,
  },
});
export default AppBar;
