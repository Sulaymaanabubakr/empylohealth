import React from 'react';
import { useAuth } from '../context/AuthContext';
import ClientProfileScreen from './ClientProfileScreen';
import PersonalProfileScreen from './PersonalProfileScreen';

const ProfileScreen = ({ navigation }) => {
  const { userData } = useAuth();
  const role = (userData?.role || 'personal').toLowerCase();
  const isClient = role === 'client';

  if (isClient) {
    return <ClientProfileScreen navigation={navigation} />;
  } else {
    return <PersonalProfileScreen navigation={navigation} />;
  }
};

export default ProfileScreen;
