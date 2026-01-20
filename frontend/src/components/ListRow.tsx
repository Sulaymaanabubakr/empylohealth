import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  icon?: ReactNode;
}

export const ListRow: React.FC<ListRowProps> = ({ title, subtitle, right, icon }) => {
  return (
    <View style={styles.listRow}>
      <View style={styles.listRowLeft}>
        {icon ? <View style={styles.listRowIcon}>{icon}</View> : null}
        <View>
          <Text style={styles.listRowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.listRowSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.space.sm,
  },
  listRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.sm,
  },
  listRowTitle: {
    fontFamily: theme.typography.bodyMedium,
    fontSize: 15,
    color: theme.colors.ink,
  },
  listRowSubtitle: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.inkMuted,
    marginTop: 2,
  },
  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
