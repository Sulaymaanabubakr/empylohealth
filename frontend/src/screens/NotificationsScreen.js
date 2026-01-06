import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';

const NotificationsScreen = ({ navigation }) => {

  const todayNotifications = [
    { id: '1', title: 'Daily Check-in Reminder', subtitle: 'It’s time to log your mood for the afternoon. How are you feeling?', color: '#80CBC4' }, // Teal
    { id: '2', title: 'New Badge Unlocked!', subtitle: 'Congratulations! You’ve reached a 7-day streak.', color: '#FFCC80' }, // Orange
    { id: '3', title: 'Circle Update', subtitle: 'Sarah posted in "Mindfulness Matters": "Found this great meditation app..."', color: '#CE93D8' }, // Purple
    { id: '4', title: 'Assessment Complete', subtitle: 'Your weekly insights are ready to view. See how you’ve improved.', color: '#BCAAA4' }, // Brown
  ];

  const earlierNotifications = [
    { id: '5', title: 'Welcome to Empylo', subtitle: 'Thanks for joining! Start your journey to better wellbeing today.', color: '#B2DFDB' }, // Light Teal
    { id: '6', title: 'Tip of the Day', subtitle: 'Taking short breaks can significantly improve focus and reduce stress.', color: '#BCAAA4' }, // Brown
    { id: '7', title: 'New Challenge Available', subtitle: 'Join the "Sleep Better" challenge to improve your rest quality.', color: '#FFCC80' }, // Orange
    { id: '8', title: 'Profile Updated', subtitle: 'Your profile details have been successfully saved.', color: '#CE93D8' }, // Purple
  ];

  const NotificationCard = ({ item }) => (
    <View style={styles.card}>
      <View style={[styles.iconCircle, { backgroundColor: item.color }]} />
      <View style={styles.textContainer}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80' }}
          style={styles.avatar}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.screenTitle}>Notifications</Text>

        {/* Today Section */}
        <Text style={styles.sectionTitle}>Today</Text>
        {todayNotifications.map((item) => (
          <NotificationCard key={item.id} item={item} />
        ))}

        {/* Earlier Section */}
        <Text style={styles.sectionTitle}>Earlier this week</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    backgroundColor: '#FCFCFC',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECEFF1', // Light gray circle
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderRadius: 32, // Pill shape
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
