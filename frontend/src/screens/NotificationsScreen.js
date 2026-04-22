import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { notificationService } from '../services/api/notificationService';
import { supabase } from '../services/supabase/supabaseClient';

const realtimeChannelId = (prefix, value) => `${prefix}:${value}:${Math.random().toString(36).slice(2, 8)}`;

const NotificationsScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('MainTabs', { screen: 'Dashboard' });
  };

  useEffect(() => {
    if (!user?.uid) return null;
    let active = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.uid)
          .order('created_at', { ascending: false });
        if (error) throw error;

        const items = (data || []).map((item) => ({
          id: item.id,
          ...item,
          createdAt: item.created_at || null,
        }));

        if (active) {
          setNotifications(items);
        }

        const unreadIds = items.filter((item) => item.read !== true).map((item) => item.id);
        if (unreadIds.length) {
          await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        }
      } catch (error) {
        console.log('Notifications query failed:', error);
        if (active) setNotifications([]);
      }
    };

    load();

    const channel = supabase
      .channel(realtimeChannelId('notifications', user.uid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.uid}` }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel).catch(() => {});
    };
  }, [user?.uid]);

  const { todayNotifications, earlierNotifications } = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = [];
    const earlier = [];
    notifications.forEach((item) => {
      const createdAt = item.createdAt ? new Date(item.createdAt) : null;
      const bucket = createdAt && createdAt.toDateString() === todayKey ? today : earlier;
      bucket.push(item);
    });
    return { todayNotifications: today, earlierNotifications: earlier };
  }, [notifications]);

  const getNotificationAvatarUri = (item) => (
    item?.avatar
    || item?.senderAvatar
    || item?.chatAvatar
    || item?.image
    || ''
  );

  const getNotificationFallbackIcon = (type) => {
    if (type === 'CHAT_MESSAGE') return 'chatbubble-ellipses-outline';
    if (type === 'HUDDLE_STARTED' || type === 'SCHEDULED_HUDDLE_REMINDER') return 'call-outline';
    if (type === 'MISSED_HUDDLE') return 'call-outline';
    if (type === 'DAILY_AFFIRMATION') return 'sparkles-outline';
    if (type === 'ROLE_UPDATED') return 'shield-checkmark-outline';
    if (type === 'MODERATION_WARNING') return 'alert-circle-outline';
    return 'notifications-outline';
  };

  const NotificationCard = ({ item }) => {
    const avatarUri = getNotificationAvatarUri(item);
    const fallbackIcon = getNotificationFallbackIcon(item?.type);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={async () => {
          try {
            const handled = await notificationService.routeFromNotificationPayload({ data: item });
            if (!handled) {
              navigation.navigate('MainTabs', { screen: 'Dashboard' });
            }
          } catch (error) {
            console.error('[NotificationsScreen] Failed to route notification tap', error);
            navigation.navigate('MainTabs', { screen: 'Dashboard' });
          }
        }}
      >
        {avatarUri ? (
          <Avatar
            uri={avatarUri}
            name={item?.title || 'Notification'}
            size={50}
            style={styles.notificationAvatar}
          />
        ) : (
          <View style={[styles.iconCircle, { backgroundColor: item.color || '#B2DFDB' }]}>
            <Ionicons name={fallbackIcon} size={22} color="#1A1A1A" />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle || item.body || ''}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.avatarContainer}>
          <Avatar
            uri={userData?.photoURL || user?.photoURL}
            name={userData?.name || user?.displayName || 'User'}
            size={40}
            showWellbeingRing
            wellbeingScore={userData?.wellbeingScore}
            wellbeingLabel={userData?.wellbeingLabel || userData?.wellbeingStatus}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Today Section */}
        <Text style={styles.sectionTitle}>Today</Text>
        {todayNotifications.length === 0 && (
          <Text style={styles.emptyText}>No notifications yet.</Text>
        )}
        {todayNotifications.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}

        {/* Earlier Section */}
        <Text style={styles.sectionTitle}>Earlier this week</Text>
        {earlierNotifications.length === 0 && (
          <Text style={styles.emptyText}>Nothing earlier this week.</Text>
        )}
        {earlierNotifications.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 10,
    backgroundColor: '#FCFCFC',
    position: 'relative',
    height: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  avatarContainer: {
    position: 'absolute',
    right: SPACING.lg,
    zIndex: 1,
  },
  emptyText: {
    fontSize: 14,
    color: '#9E9E9E',
    marginBottom: SPACING.md,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F9F9F9',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationAvatar: {
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#757575',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
