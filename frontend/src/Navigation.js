import React, { useState, useEffect, useRef } from 'react';
console.log('[PERF] Navigation.js: Module evaluating');
import { View, Pressable, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import IncomingHuddleScreen from './screens/IncomingHuddleScreen';
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
import { huddleService } from './services/api/huddleService';

const Stack = createNativeStackNavigator();

export default function Navigation() {
    const { routeTarget } = useAuth();
    const [activeHuddleSession, setActiveHuddleSession] = useState(null);
    const [currentRouteName, setCurrentRouteName] = useState('');
    const firstRenderLoggedRef = useRef(false);

    useEffect(() => {
        const unsubscribe = huddleService.subscribeToActiveLocalSession((session) => {
            setActiveHuddleSession(session || null);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        console.log('[Navigation] Route target:', routeTarget);
        flushPendingNavigation();
    }, [routeTarget]);

    if (!firstRenderLoggedRef.current) {
        firstRenderLoggedRef.current = true;
        console.log('[PERF] time_to_first_render: navigation tree mounted');
    }

    const showHuddleBanner = !!activeHuddleSession && currentRouteName !== 'Huddle';
    const isMuted = !!activeHuddleSession?.controlState?.isMuted;
    const isSpeakerOn = activeHuddleSession?.controlState?.isSpeakerOn !== false;

    const openHuddle = () => {
        navigationRef.navigate('Huddle', {
            mode: 'join',
            chatId: activeHuddleSession?.chatId,
            huddleId: activeHuddleSession?.huddleId,
            chat: {
                id: activeHuddleSession?.chatId,
                name: activeHuddleSession?.chatName || 'Huddle',
                isGroup: true
            }
        });
    };

    return (
        <View style={styles.root}>
            <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                    flushPendingNavigation();
                    setCurrentRouteName(navigationRef.getCurrentRoute()?.name || '');
                }}
                onStateChange={() => {
                    flushPendingNavigation();
                    setCurrentRouteName(navigationRef.getCurrentRoute()?.name || '');
                }}
            >
                {routeTarget === 'UNAUTH' ? (
                    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F9FA' } }}>
                        <Stack.Screen name="Splash" component={SplashScreen} />
                        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                        <Stack.Screen name="SignIn" component={SignInScreen} />
                        <Stack.Screen name="SignUp" component={SignUpScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
                    </Stack.Navigator>
                ) : routeTarget === 'PROFILE_SETUP' ? (
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
                        <Stack.Screen name="IncomingHuddle" component={IncomingHuddleScreen} options={{ presentation: 'modal' }} />
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

            {showHuddleBanner && (
                <View style={styles.huddleBanner}>
                    <Pressable style={styles.huddleBannerInfo} onPress={openHuddle}>
                        <Text style={styles.huddleBannerTitle}>Huddle in progress</Text>
                        <Text style={styles.huddleBannerSubtitle}>Tap to return to call</Text>
                    </Pressable>
                    <View style={styles.huddleBannerActions}>
                        <TouchableOpacity
                            style={styles.huddleActionButton}
                            onPress={() => huddleService.toggleActiveSessionMute()}
                        >
                            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.huddleActionButton}
                            onPress={() => huddleService.toggleActiveSessionSpeaker()}
                        >
                            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.huddleActionButton, styles.huddleActionDanger]}
                            onPress={() => huddleService.hangupActiveSession()}
                        >
                            <MaterialIcons name="call-end" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1
    },
    huddleBanner: {
        position: 'absolute',
        left: 14,
        right: 14,
        bottom: 26,
        backgroundColor: '#111111',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#2E2E2E',
        flexDirection: 'row',
        alignItems: 'center'
    },
    huddleBannerInfo: {
        flex: 1,
        paddingRight: 10
    },
    huddleBannerActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    huddleActionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2F2F2F',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8
    },
    huddleActionDanger: {
        backgroundColor: '#E53935'
    },
    huddleBannerTitle: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    huddleBannerSubtitle: {
        color: '#D0D0D0',
        fontSize: 12,
        marginTop: 2
    }
});
