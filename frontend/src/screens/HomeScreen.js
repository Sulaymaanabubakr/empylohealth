import React, { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { assessmentService } from '../services/api/assessmentService';
import { resourceService } from '../services/api/resourceService';
import { circleService } from '../services/api/circleService';

export function HomeScreen({ navigation }) {
  const { userData, user } = useAuth();
  const [resources, setResources] = useState([]);
  const [wellbeing, setWellbeing] = useState(null);
  const [myCircles, setMyCircles] = useState([]);

  useEffect(() => {
    let isMounted = true;

    // 1. Initial Load of Resources (Static for now, could be realtime later)
    const loadResources = async () => {
      try {
        const items = await resourceService.getExploreContent();
        if (isMounted) setResources(items || []);
      } catch (error) {
        if (isMounted) setResources([]);
      }
    };
    loadResources();

    // 2. Realtime Wellbeing Stats
    let unsubscribeStats = () => { };
    // 3. Realtime Circles
    let unsubscribeCircles = () => { };

    if (user?.uid) {
      unsubscribeStats = assessmentService.subscribeToWellbeingStats(user.uid, (stats) => {
        if (isMounted && stats) {
          setWellbeing(stats);
        }
      });

      // Subscribe to circles for the "Most Engaged" widget
      unsubscribeCircles = circleService.subscribeToMyCircles(user.uid, (circles) => {
        if (isMounted) {
          // Sort by last activity if available (e.g. updatedAt), else default
          const sorted = (circles || []).sort((a, b) => {
            const timeA = a.updatedAt?.toMillis?.() || 0;
            const timeB = b.updatedAt?.toMillis?.() || 0;
            return timeB - timeA;
          });
          setMyCircles(sorted);
        }
      });
    }

    return () => {
      isMounted = false;
      unsubscribeStats();
      unsubscribeCircles();
    };
  }, [user?.uid]);

  const heroTitle = `Hello, ${userData?.name?.split(' ')[0] || user?.displayName || 'there'}`;
  const heroSubtitle = userData?.focus || 'Welcome back';
  const streakLabel = userData?.streak ? `${userData.streak}-day streak` : null;

  const feedCards = useMemo(() => {
    return (resources || []).slice(0, 2).map((item, index) => ({
      id: item.id || String(index),
      title: item.title || item.name || 'Untitled',
      subtitle: item.subtitle || item.description || '',
      tone: item.color || (index % 2 === 0 ? theme.colors.accentSoft : theme.colors.lavender),
      raw: item
    }));
  }, [resources]);
  return (
    <Screen
      hero={
        <LinearGradient
          colors={[theme.colors.brandSoft, '#F8FFFE']}
          style={styles.heroCard}
        >
          <AppBar
            title={heroTitle}
            subtitle={heroSubtitle}
            right={streakLabel ? <Pill label={streakLabel} /> : null}
          />
          <View style={styles.heroStats}>
            <Card style={styles.statCard}>
              <Text style={styles.statTitle}>Mood today</Text>
              <Text style={styles.statValue}>{wellbeing?.label || '—'}</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statTitle}>Focus</Text>
              <Text style={styles.statValue}>
                {typeof wellbeing?.score === 'number' ? wellbeing.score.toFixed(1) : '—'}
              </Text>
            </Card>
          </View>
        </LinearGradient>
      }
    >
      {/* 1. MOST ENGAGED CIRCLE WIDGET (Top priority, 1 item only) */}
      {myCircles[0] && (
        <FadeInView delay={50}>
          <Text style={styles.sectionTitle}>Your Circle</Text>
          <Card>
            <ListRow
              title={myCircles[0].name}
              subtitle={myCircles[0].activeHuddle ? "Huddle in progress • Join now" : "Tap to open chat"}
              icon={<View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: theme.colors.primary,
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{myCircles[0].name.slice(0, 2).toUpperCase()}</Text>
              </View>}
              right={<Feather name="message-circle" size={20} color={theme.colors.primary} />}
              onPress={() => {
                // Direct Navigation to Chat Interface per user request
                if (myCircles[0].chatId) {
                  navigation.navigate('ChatDetail', {
                    chat: {
                      id: myCircles[0].chatId,
                      name: myCircles[0].name,
                      isGroup: true,
                      circleId: myCircles[0].id
                    }
                  });
                } else {
                  navigation.navigate('CircleDetail', { circle: myCircles[0] });
                }
              }}
            />
          </Card>
        </FadeInView>
      )}
      <FadeInView delay={100}>
        <Text style={styles.sectionTitle}>Your next step</Text>
        <Card>
          <Text style={styles.cardTitle}>{feedCards[0]?.title || 'Pick a resource to begin'}</Text>
          <Text style={styles.cardCopy}>{feedCards[0]?.subtitle || 'Explore content tailored for you.'}</Text>
          <PrimaryButton
            label={feedCards[0] ? 'Start now' : 'Explore'}
            onPress={() => {
              if (feedCards[0]?.raw) {
                navigation.navigate('ActivityDetail', { activity: feedCards[0].raw });
              } else {
                navigation.navigate('Explore');
              }
            }}
          />
        </Card>
      </FadeInView>

      <FadeInView delay={200}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <View style={styles.rowGap}>
          {feedCards.length === 0 ? (
            <Card style={styles.feedCard}>
              <Text style={styles.cardTitle}>No resources yet</Text>
              <Text style={styles.cardCopy}>Check back soon or explore to find new items.</Text>
            </Card>
          ) : feedCards.map((card) => (
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
            title="Create a circle"
            subtitle="Start a new support space"
            right={<Feather name="chevron-right" size={18} color={theme.colors.inkMuted} />}
            onPress={() => navigation.navigate('CreateCircle')}
          />
        </Card>
      </FadeInView>
    </Screen>
  );

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
