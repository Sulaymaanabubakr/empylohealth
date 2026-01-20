import React from 'react';
import { useAuth } from '../context/AuthContext';
import PersonalProfileScreen from './PersonalProfileScreen';
const ProfileScreen = ({ navigation }) => {
  return <PersonalProfileScreen navigation={navigation} />;
};

export default ProfileScreen;
