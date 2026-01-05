import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { HomeScreen } from '../screens/HomeScreen';
import { CheckInScreen } from '../screens/CheckInScreen';
import { CommunityScreen } from '../screens/CommunityScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { theme } from '../theme/theme';

const Tabs = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 6,
          backgroundColor: '#FFFFFF',
          height: 68,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: theme.colors.brand,
        tabBarInactiveTintColor: '#94A4A2',
        tabBarLabelStyle: {
          fontFamily: theme.typography.bodyMedium,
          fontSize: 11,
        },
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'home',
            CheckIn: 'smile',
            Community: 'users',
            Chat: 'message-circle',
            Profile: 'user',
          };
          return <Feather name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="CheckIn" component={CheckInScreen} options={{ title: 'Check-In' }} />
      <Tabs.Screen name="Community" component={CommunityScreen} />
      <Tabs.Screen name="Chat" component={ChatScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
