import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BottomNavigation from '../components/BottomNavigation';
import { chatService } from '../services/api/chatService';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { user } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      setUnreadTotal(0);
      return undefined;
    }
    return chatService.subscribeUnreadCounts(user.uid, (state) => {
      setUnreadTotal(Number(state?.total || 0));
    });
  }, [user?.uid]);

  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavigation {...props} />}
      lazy={false}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#F8F9FA' },
      }}
      initialRouteName="Dashboard"
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          tabBarBadge: unreadTotal > 0 ? (unreadTotal > 99 ? '99+' : unreadTotal) : undefined
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default MainTabs;
