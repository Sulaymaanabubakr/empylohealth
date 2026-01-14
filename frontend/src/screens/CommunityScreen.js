import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { ListRow } from '../components/ListRow';
import Avatar from '../components/Avatar';
import { theme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';

export function CommunityScreen({ navigation }) {
  const { user } = useAuth();
  const [circles, setCircles] = useState([]);

  useEffect(() => {
    if (!user?.uid) return undefined;
    const unsubscribe = circleService.subscribeToMyCircles(user.uid, (data) => {
      setCircles(data || []);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <Screen hero={<AppBar title="Your Circles" subtitle="Find support + momentum" />}>
      <Card>
        {circles.length === 0 ? (
          <Text style={styles.emptyText}>You have not joined any circles yet.</Text>
        ) : (
          circles.map((circle, index) => (
            <React.Fragment key={circle.id}>
              <ListRow
                title={circle.name}
                subtitle={`${circle.members?.length || 0} members`}
                icon={<Avatar label={circle.name.slice(0, 2).toUpperCase()} />}
                right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
                onPress={() => navigation.navigate('CircleDetail', { circle })}
              />
              {index < circles.length - 1 ? <View style={styles.divider} /> : null}
            </React.Fragment>
          ))
        )}
      </Card>
      <PrimaryButton label="Create a circle" onPress={() => navigation.navigate('CreateCircle')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
  emptyText: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.inkMuted,
    padding: theme.space.md,
  },
});
