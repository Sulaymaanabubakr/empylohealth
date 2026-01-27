import React, { useState, useEffect } from 'react';
console.log('[PERF] Navigation.js: Module evaluating');
import { Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import SplashScreen from './screens/SplashScreen';
// ... other imports ...
import { useAuth } from './context/AuthContext';

// Import all screens (keeping original imports for brevity in this replacement)
import OnboardingScreen from './screens/OnboardingScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerificationScreen from './screens/VerificationScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import AssessmentScreen from './screens/AssessmentScreen';
import NineIndexScreen from './screens/NineIndexScreen';
import StatsScreen from './screens/StatsScreen';
import DashboardScreen from './screens/DashboardScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import { CheckInScreen } from './screens/CheckInScreen';
import ExploreScreen from './screens/ExploreScreen';
import ActivityDetailScreen from './screens/ActivityDetailScreen';
import AffirmationsScreen from './screens/AffirmationsScreen';
import SupportGroupsScreen from './screens/SupportGroupsScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatDetailScreen from './screens/ChatDetailScreen';
import HuddleScreen from './screens/HuddleScreen';
import ProfileScreen from './screens/ProfileScreen';
import LearningSessionScreen from './screens/LearningSessionScreen';
import CreateCircleScreen from './screens/CreateCircleScreen';
import CircleDetailScreen from './screens/CircleDetailScreen';
import CircleAnalysisScreen from './screens/CircleAnalysisScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import PersonalInformationScreen from './screens/PersonalInformationScreen';
import SecurityScreen from './screens/SecurityScreen';
import TellAFriendScreen from './screens/TellAFriendScreen';
import FAQScreen from './screens/FAQScreen';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';
const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { user, userData } = useAuth();
    const [isReady, setIsReady] = useState(false);
    const [initialState, setInitialState] = useState();

    useEffect(() => {
        const restoreState = async () => {
            try {
                const initialUrl = await Linking.getInitialURL();

                if (Platform.OS !== 'web' && initialUrl == null) {
                    const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
                    const state = savedStateString ? JSON.parse(savedStateString) : undefined;

                    if (state !== undefined) {
                        setInitialState(state);
                    }
                }
            } catch (e) {
                console.error('Failed to restore navigation state', e);
            } finally {
                console.log('[PERF] Navigation: isReady set to true');
                setIsReady(true);
            }
        };

        if (!isReady) {
            restoreState();
        }
    }, [isReady]);

    if (!isReady) {
        console.log('[PERF] Navigation: Waiting for isReady...');
        return null;
    }
    if (user && userData === null) {
        return null;
    }

    const isProfileComplete = userData?.onboardingCompleted;

    console.log('[Navigation] Rendering. User:', user?.email, 'ProfileComplete:', isProfileComplete);

    return (
        <NavigationContainer
            initialState={initialState}
            onStateChange={(state) =>
                AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
            }
        >
            {!user ? (
                <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                </Stack.Navigator>
            ) : !isProfileComplete ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator initialRouteName="Dashboard" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Dashboard" component={DashboardScreen} />
                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="CheckIn" component={CheckInScreen} />
                    <Stack.Screen name="Explore" component={ExploreScreen} />
                    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
                    <Stack.Screen name="Affirmations" component={AffirmationsScreen} />
                    <Stack.Screen name="SupportGroups" component={SupportGroupsScreen} />
                    <Stack.Screen name="ChatList" component={ChatListScreen} />
                    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                    <Stack.Screen name="Huddle" component={HuddleScreen} options={{ presentation: 'modal' }} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="LearningSession" component={LearningSessionScreen} />
                    <Stack.Screen name="CreateCircle" component={CreateCircleScreen} />
                    <Stack.Screen name="CircleDetail" component={CircleDetailScreen} />
                    <Stack.Screen name="CircleAnalysis" component={CircleAnalysisScreen} />
                    <Stack.Screen name="CircleSettings" component={require('./screens/CircleSettingsScreen').default} />
                    <Stack.Screen name="NotificationsSettings" component={NotificationsSettingsScreen} />
                    <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
                    <Stack.Screen name="Security" component={SecurityScreen} />
                    <Stack.Screen name="TellAFriend" component={TellAFriendScreen} />
                    <Stack.Screen name="FAQ" component={FAQScreen} />
                    <Stack.Screen name="Assessment" component={AssessmentScreen} />
                    <Stack.Screen name="NineIndex" component={NineIndexScreen} />
                    <Stack.Screen name="Stats" component={StatsScreen} />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    );
};
