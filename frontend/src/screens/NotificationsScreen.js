import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SPACING } from '../theme/theme';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { collection, onSnapshot, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const NotificationsScreen = ({ navigation }) => {
  const { user, userData } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
  if (!user?.uid) return null;
    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid)
    );
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = doc.data();
        return { id: doc.id, ...data };
      });
      items.sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() || 0;
        const bMs = b.createdAt?.toMillis?.() || 0;
        return bMs - aMs;
      });
      setNotifications(items);

      const unreadDocs = snapshot.docs.filter((d) => d.data()?.read !== true);
      if (unreadDocs.length > 0) {
        const batch = writeBatch(db);
        unreadDocs.forEach((d) => {
          batch.update(d.ref, { read: true });
        });
        batch.commit().catch(() => {});
      }
    }, (error) => {
      console.log('Notifications query failed:', error);
      setNotifications([]);
    });
  }, [user?.uid]);

  const { todayNotifications, earlierNotifications } = useMemo(() => {
    const todayKey = new Date().toDateString();
    const today = [];
    const earlier = [];
    notifications.forEach((item) => {
      const createdAt = item.createdAt?.toDate ? item.createdAt.toDate() : (item.createdAt ? new Date(item.createdAt) : null);
      const bucket = createdAt && createdAt.toDateString() === todayKey ? today : earlier;
      bucket.push(item);
    });
    return { todayNotifications: today, earlierNotifications: earlier };
  }, [notifications]);

  const NotificationCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => {
        if (item.type === 'HUDDLE_STARTED' && item.huddleId) {
          navigation.navigate('Huddle', {
            chat: { id: item.chatId || 'chat', name: 'Huddle', isGroup: true },
            huddleId: item.huddleId,
            mode: 'join',
            callTapTs: Date.now()
          });
        }
      }}
    >
      <View style={[styles.iconCircle, { backgroundColor: item.color || '#B2DFDB' }]} />
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle || item.body || ''}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.avatarContainer}>
          <Avatar uri={userData?.photoURL || user?.photoURL} name={userData?.name || user?.displayName || 'User'} size={40} />
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
