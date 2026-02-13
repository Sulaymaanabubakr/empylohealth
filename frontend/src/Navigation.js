import React, { useState, useEffect } from 'react';
console.log('[PERF] Navigation.js: Module evaluating');
import { Linking, Platform, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainTabs from './navigation/MainTabs';

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
import PublicProfileScreen from './screens/PublicProfileScreen';
import NotificationsSettingsScreen from './screens/NotificationsSettingsScreen';
import PersonalInformationScreen from './screens/PersonalInformationScreen';
import SecurityScreen from './screens/SecurityScreen';
import TellAFriendScreen from './screens/TellAFriendScreen';
import FAQScreen from './screens/FAQScreen';
import { navigationRef, flushPendingNavigation } from './navigation/navigationRef';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';
const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { user, userData, loading } = useAuth();
    const [isReady, setIsReady] = useState(false);
    const [initialState, setInitialState] = useState();

    // Helper: Check if saved state belongs to authenticated navigator
    const isAuthenticatedState = (state) => {
        if (!state?.routes) return false;
        const authRoutes = ['Dashboard', 'Profile', 'Explore', 'ChatList', 'Notifications',
            'CheckIn', 'CircleDetail', 'Affirmations', 'Stats', 'Assessment'];
        return state.routes.some(r => authRoutes.includes(r.name));
    };

    useEffect(() => {
        const restoreState = async () => {
            try {
                const initialUrl = await Linking.getInitialURL();

                if (Platform.OS !== 'web' && initialUrl == null) {
                    const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
                    const state = savedStateString ? JSON.parse(savedStateString) : undefined;

                    if (state !== undefined) {
                        // Only restore state if it matches current auth context
                        // This prevents restoring Onboarding routes when user is logged in
                        const savedIsAuth = isAuthenticatedState(state);
                        const userIsLoggedIn = !!user;

                        if (savedIsAuth === userIsLoggedIn) {
                            console.log('[PERF] Navigation: Restoring compatible state');
                            setInitialState(state);
                        } else {
                            // Mismatch: don't restore, but DON'T delete either.
                            // A valid state will be saved once user navigates in the correct stack.
                            console.log('[PERF] Navigation: Skipping incompatible state (saved:', savedIsAuth, 'current:', userIsLoggedIn, ')');
                        }
                    }
                }
            } catch (e) {
                console.error('Failed to restore navigation state', e);
            } finally {
                console.log('[PERF] Navigation: isReady set to true');
                setIsReady(true);
            }
        };

        // Wait for auth to resolve definitively before restoring state
        if (!isReady && !loading) {
            restoreState();
        }
    }, [isReady, user, loading]);

    if (!isReady) {
        console.log('[PERF] Navigation: Waiting for isReady...');
        return (
            <View style={{ flex: 1, backgroundColor: '#00A99D', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    // If user is logged in but userData is still null, we are in a loading state.
    // We should not optimistically assume profile is complete to prevent flickering.
    if (user && userData === null) {
        console.log('[PERF] Navigation: User logged in, waiting for userData...');
        return (
            <View style={{ flex: 1, backgroundColor: '#00A99D', justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    const isProfileComplete = !!userData?.onboardingCompleted;

    console.log('[Navigation] Rendering. User:', user?.email, 'ProfileComplete:', isProfileComplete);

    return (
        <NavigationContainer
            ref={navigationRef}
            initialState={initialState}
            onReady={flushPendingNavigation}
            onStateChange={(state) => {
                // Only persist navigation state when user is authenticated
                // This prevents saving unauthenticated "flicker" states
                if (user) {
                    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
                }
            }}
        >
            {!user ? (
                <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
                    <Stack.Screen name="Splash" component={SplashScreen} />
                    <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                    <Stack.Screen name="SignIn" component={SignInScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                </Stack.Navigator>
            ) : !isProfileComplete ? (
                <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
                    <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator initialRouteName="MainTabs" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    {/* Dashboard, Explore, ChatList, Profile moved to MainTabs */}

                    <Stack.Screen name="Notifications" component={NotificationsScreen} />
                    <Stack.Screen name="CheckIn" component={CheckInScreen} />
                    {/* <Stack.Screen name="Explore" component={ExploreScreen} /> Removing duplicate */}
                    <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
                    <Stack.Screen name="Affirmations" component={AffirmationsScreen} />
                    <Stack.Screen name="SupportGroups" component={SupportGroupsScreen} />
                    {/* <Stack.Screen name="ChatList" component={ChatListScreen} /> Removing duplicate */}
                    <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
                    <Stack.Screen name="Huddle" component={HuddleScreen} options={{ presentation: 'modal' }} />
                    {/* <Stack.Screen name="Profile" component={ProfileScreen} /> Removing duplicate */}
                    <Stack.Screen name="LearningSession" component={LearningSessionScreen} />

                    <Stack.Screen name="CreateCircle" component={CreateCircleScreen} />
                    <Stack.Screen name="CircleDetail" component={CircleDetailScreen} />
                    <Stack.Screen name="CircleAnalysis" component={CircleAnalysisScreen} />
                    <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
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
