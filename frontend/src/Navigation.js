import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpSelectionScreen from './screens/SignUpSelectionScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerificationScreen from './screens/VerificationScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

import ProfileSetupScreen from './screens/ProfileSetupScreen';
import ProfileSetupClientScreen from './screens/ProfileSetupClientScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import NineIndexScreen from './screens/NineIndexScreen';
import DashboardScreen from './screens/DashboardScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ExploreScreen from './screens/ExploreScreen';
import ActivityDetailScreen from './screens/ActivityDetailScreen';
import AffirmationsScreen from './screens/AffirmationsScreen';
import SupportGroupsScreen from './screens/SupportGroupsScreen';
import SupportGroupDetailScreen from './screens/SupportGroupDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import HuddleScreen from './screens/HuddleScreen';
import ProfileScreen from './screens/ProfileScreen';
import LearningSessionScreen from './screens/LearningSessionScreen';
import CreateCircleScreen from './screens/CreateCircleScreen';
import CircleDetailScreen from './screens/CircleDetailScreen';
import SubscriptionScreen from './screens/SubscriptionScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import PersonalInformationScreen from './screens/PersonalInformationScreen';
import SecurityScreen from './screens/SecurityScreen';

import TellAFriendScreen from './screens/TellAFriendScreen';
import FAQScreen from './screens/FAQScreen';
import { useAuth } from './context/AuthContext';





const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { user } = useAuth();

    return (
        <NavigationContainer>
            {user ? (
                <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="Explore" component={ExploreScreen} />
                    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
                    <Stack.Screen name="Affirmations" component={AffirmationsScreen} />
                    <Stack.Screen name="SupportGroups" component={SupportGroupsScreen} />
                    <Stack.Screen name="SupportGroupDetail" component={SupportGroupDetailScreen} />
                    <Stack.Screen name="ChatList" component={ChatListScreen} />
                    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                    <Stack.Screen name="Huddle" component={HuddleScreen} options={{ presentation: 'modal' }} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="LearningSession" component={LearningSessionScreen} />
                    <Stack.Screen name="CreateCircle" component={CreateCircleScreen} />
                    <Stack.Screen name="CircleDetail" component={CircleDetailScreen} />
                    <Stack.Screen name="Subscription" component={SubscriptionScreen} />
                    <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                    <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
                    <Stack.Screen name="Security" component={SecurityScreen} />

                    <Stack.Screen name="TellAFriend" component={TellAFriendScreen} />
                    <Stack.Screen name="FAQ" component={FAQScreen} />
                    <Stack.Screen name="Assessment" component={AssessmentScreen} />
                    <Stack.Screen name="NineIndex" component={NineIndexScreen} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="SignUpSelection" component={SignUpSelectionScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="Verification" component={VerificationScreen} />

                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                    <Stack.Screen name="ProfileSetupClient" component={ProfileSetupClientScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
}
