import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { ListRow } from '../components/ListRow';
import { Avatar } from '../components/Avatar';
import { theme } from '../theme/theme';

const chats = [
  { id: 't1', name: 'Aisha', preview: 'Loved the session today.', time: '2m' },
  { id: 't2', name: 'Team Lounge', preview: 'Next meetup on Fri.', time: '1h' },
];

export function ChatScreen() {
  return (
    <Screen hero={<AppBar title="Chat" subtitle="Stay connected" />}>
      <Card>
        {chats.map((chat, index) => (
          <React.Fragment key={chat.id}>
            <ListRow
              title={chat.name}
              subtitle={chat.preview}
              icon={<Avatar label={chat.name.slice(0, 2).toUpperCase()} />}
              right={<Text style={styles.chatTime}>{chat.time}</Text>}
            />
            {index < chats.length - 1 ? <View style={styles.divider} /> : null}
          </React.Fragment>
        ))}
      </Card>
      <Card style={styles.chatComposer}>
        <TextInput placeholder="Send a message" placeholderTextColor="#99A8A6" />
        <Feather name="send" size={18} color={theme.colors.brand} />
      </Card>
      <View style={styles.bubbleStack}>
        <View style={styles.bubbleIncoming}>
          <Text style={styles.bubbleText}>I just finished my check-in.</Text>
        </View>
        <View style={styles.bubbleOutgoing}>
          <Text style={styles.bubbleText}>Nice! Want to join the focus session?</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chatTime: {
    fontFamily: theme.typography.body,
    fontSize: 12,
    color: theme.colors.inkMuted,
  },
  chatComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubbleStack: {
    gap: theme.space.sm,
  },
  bubbleIncoming: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    padding: theme.space.sm,
    borderRadius: theme.radius.lg,
    maxWidth: '80%',
  },
  bubbleOutgoing: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.brandSoft,
    padding: theme.space.sm,
    borderRadius: theme.radius.lg,
    maxWidth: '80%',
  },
  bubbleText: {
    fontFamily: theme.typography.body,
    color: theme.colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
