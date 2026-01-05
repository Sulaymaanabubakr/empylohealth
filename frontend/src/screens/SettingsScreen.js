import React, { useMemo } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';
import { SecondaryButton } from '../components/Buttons';
import { theme } from '../theme/theme';

export function SettingsScreen() {
  const toggles = useMemo(
    () => [
      { id: 's1', label: 'Daily reminders', value: true },
      { id: 's2', label: 'Weekly review email', value: false },
      { id: 's3', label: 'Community invites', value: true },
    ],
    []
  );

  return (
    <Screen hero={<AppBar title="Settings" subtitle="Tune your experience" />}>
      <Card>
        {toggles.map((toggle, index) => (
          <View key={toggle.id}>
            <ListRow
              title={toggle.label}
              right={<Switch value={toggle.value} onValueChange={() => {}} />}
            />
            {index < toggles.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </Card>
      <SecondaryButton label="Sign out" onPress={() => {}} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
