import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';
import { theme } from '../theme/theme';

const notifications = [
  { id: 'n1', title: 'New comment in Founders Circle', time: '2h ago' },
  { id: 'n2', title: 'Your check-in streak hit 4 days', time: 'Yesterday' },
  { id: 'n3', title: 'Weekly reflection is ready', time: 'Mon' },
];

export function NotificationsScreen() {
  return (
    <Screen hero={<AppBar title="Notifications" subtitle="Stay in the loop" />}>
      <Card>
        {notifications.map((note, index) => (
          <View key={note.id}>
            <ListRow title={note.title} subtitle={note.time} />
            {index < notifications.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
