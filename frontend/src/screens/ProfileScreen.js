import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

export function ProfileScreen() {
  return (
    <Screen
      hero={
        <View style={styles.heroArea}>
          <AppBar title="Profile" subtitle="Your rhythm" />
          <Card style={styles.profileHeader}>
            <Avatar label="SA" />
            <View>
              <Text style={styles.profileName}>Sulaymaan A.</Text>
              <Text style={styles.profileMeta}>Designer · Riyadh</Text>
            </View>
          </Card>
        </View>
      }
    >
      <Text style={styles.sectionTitle}>Highlights</Text>
      <View style={styles.rowGap}>
        <Card style={styles.statCard}>
          <Text style={styles.statTitle}>Check-ins</Text>
          <Text style={styles.statValue}>18</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statTitle}>Focus hours</Text>
          <Text style={styles.statValue}>12.5</Text>
        </Card>
      </View>
      <Text style={styles.sectionTitle}>Account</Text>
      <Card>
        <ListRow
          title="Notifications"
          subtitle="2 unread"
          right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
        />
        <View style={styles.divider} />
        <ListRow
          title="Settings"
          subtitle="Preferences & privacy"
          right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroArea: {
    gap: theme.space.sm,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.space.md,
  },
  profileName: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  profileMeta: {
    fontFamily: theme.typography.body,
    fontSize: 13,
    color: theme.colors.inkMuted,
  },
  sectionTitle: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  rowGap: {
    gap: theme.space.md,
  },
  statCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  statTitle: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  statValue: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
