import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

const circles = [
  { id: 'c1', name: 'Founders Circle', members: '128 members' },
  { id: 'c2', name: 'Design Sprint', members: '64 members' },
  { id: 'c3', name: 'Mindful Makers', members: '92 members' },
];

export function CommunityScreen() {
  return (
    <Screen hero={<AppBar title="Your Circles" subtitle="Find support + momentum" />}>
      <Card>
        {circles.map((circle, index) => (
          <React.Fragment key={circle.id}>
            <ListRow
              title={circle.name}
              subtitle={circle.members}
              icon={<Avatar label={circle.name.slice(0, 2).toUpperCase()} />}
              right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
            />
            {index < circles.length - 1 ? <View style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </Card>
      <PrimaryButton label="Create a circle" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
