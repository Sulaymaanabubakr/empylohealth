import React from 'react';
import { View, Text } from 'react-native';
import { PROFILE_DATA } from '../data/mockData';
import ClientProfileScreen from './ClientProfileScreen';
import PersonalProfileScreen from './PersonalProfileScreen';

const ProfileScreen = ({ navigation }) => {
  // In a real app, this would come from AuthContext or similar global state
  const isClient = PROFILE_DATA.user.role === 'Client user';

  if (isClient) {
    return <ClientProfileScreen navigation={navigation} />;
  } else {
    return <PersonalProfileScreen navigation={navigation} />;
  }
};

export default ProfileScreen;
