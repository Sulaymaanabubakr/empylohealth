import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
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
            Dashboard: 'home',
            Explore: 'compass',
            Chat: 'message-circle',
            Profile: 'user',
          };
          const iconName = icons[route.name] || 'home';
          return <Feather name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Home' }} />
      <Tabs.Screen name="Explore" component={ExploreScreen} />
      <Tabs.Screen name="Chat" component={ChatListScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
