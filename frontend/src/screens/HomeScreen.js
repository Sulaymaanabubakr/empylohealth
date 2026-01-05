import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { FadeInView } from '../components/FadeInView';
import { AppBar } from '../components/AppBar';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { Pill } from '../components/Pill';
import { ListRow } from '../components/ListRow';
import { theme } from '../theme/theme';

const demoUser = {
  name: 'Sulaymaan',
  streak: '4-day streak',
  focus: 'Balance & clarity',
};

const feedCards = [
  {
    id: '1',
    title: 'Morning Reset',
    subtitle: '3-min breathing + intention',
    tone: theme.colors.accentSoft,
  },
  {
    id: '2',
    title: 'Focus Soundscape',
    subtitle: '20-min deep work mix',
    tone: theme.colors.lavender,
  },
];

export function HomeScreen() {
  return (
    <Screen
      hero={
        <LinearGradient
          colors={[theme.colors.brandSoft, '#F8FFFE']}
          style={styles.heroCard}
        >
          <AppBar
            title={`Hello, ${demoUser.name}`}
            subtitle={demoUser.focus}
            right={<Pill label={demoUser.streak} />}
          />
          <View style={styles.heroStats}>
            <Card style={styles.statCard}>
              <Text style={styles.statTitle}>Mood today</Text>
              <Text style={styles.statValue}>Calm</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statTitle}>Focus</Text>
              <Text style={styles.statValue}>8.2</Text>
            </Card>
          </View>
        </LinearGradient>
      }
    >
      <FadeInView delay={100}>
        <Text style={styles.sectionTitle}>Your next step</Text>
        <Card>
          <Text style={styles.cardTitle}>Midday reset</Text>
          <Text style={styles.cardCopy}>A 5-minute grounding session.</Text>
          <PrimaryButton label="Start now" onPress={() => {}} />
        </Card>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <View style={styles.rowGap}>
          {feedCards.map((card) => (
            <Card key={card.id} style={[styles.feedCard, { backgroundColor: card.tone }]}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardCopy}>{card.subtitle}</Text>
            </Card>
          ))}
        </View>
      </FadeInView>

      <FadeInView delay={300}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Card>
          <ListRow
            title="Invite your circle"
            subtitle="Build accountability together"
            right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
          />
          <View style={styles.divider} />
          <ListRow
            title="Create a focus block"
            subtitle="Plan tomorrow's session"
            right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
          />
        </Card>
      </FadeInView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    padding: theme.space.lg,
    borderRadius: theme.radius.xl,
    gap: theme.space.md,
  },
  heroStats: {
    flexDirection: 'row',
    gap: theme.space.md,
  },
  statCard: {
    flex: 1,
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
  sectionTitle: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  cardTitle: {
    fontFamily: theme.typography.title,
    fontSize: 18,
    color: theme.colors.ink,
  },
  cardCopy: {
    fontFamily: theme.typography.body,
    fontSize: 14,
    color: theme.colors.inkMuted,
    lineHeight: 20,
  },
  rowGap: {
    gap: theme.space.md,
  },
  feedCard: {
    borderRadius: theme.radius.lg,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
  },
});
