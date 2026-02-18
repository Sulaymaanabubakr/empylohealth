import React, { useState, useEffect, useRef } from 'react';
console.log('[PERF] Navigation.js: Module evaluating');
import { View, Pressable, Text, StyleSheet, TouchableOpacity, AppState, Linking as RnLinking } from 'react-native';
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
import CommunityGuidelinesScreen from './screens/CommunityGuidelinesScreen';
import CommunityEducationScreen from './screens/CommunityEducationScreen';
import CommunityEducationTopicScreen from './screens/CommunityEducationTopicScreen';
import AboutCirclesScreen from './screens/AboutCirclesScreen';
import { navigationRef, flushPendingNavigation, navigate } from './navigation/navigationRef';
import { huddleService } from './services/api/huddleService';
import { parseDeepLink } from './utils/deepLinks';

const Stack = createNativeStackNavigator();

let LocalAuthentication = null;
try {
    // Optional native module: available on new builds.
    // Keep app functional on older debug APKs that do not include it yet.
    LocalAuthentication = require('expo-local-authentication');
} catch {
    LocalAuthentication = null;
}

export default function Navigation() {
    const { routeTarget, userData } = useAuth();
    const [activeHuddleSession, setActiveHuddleSession] = useState(null);
    const [currentRouteName, setCurrentRouteName] = useState('');
    const [biometricLocked, setBiometricLocked] = useState(false);
    const [unlocking, setUnlocking] = useState(false);
    const [deepLinkBannerText, setDeepLinkBannerText] = useState('');
    const firstRenderLoggedRef = useRef(false);
    const appStateRef = useRef(AppState.currentState);
    const unlockInFlightRef = useRef(false);
    const deepLinkBannerTimerRef = useRef(null);

    const biometricsEnabled = routeTarget !== 'UNAUTH' && Boolean(userData?.settings?.biometrics);

    const unlockWithBiometrics = async () => {
        if (!biometricsEnabled) {
            setBiometricLocked(false);
            return true;
        }
        if (!LocalAuthentication) {
            setBiometricLocked(false);
            return true;
        }
        if (unlockInFlightRef.current) return false;
        unlockInFlightRef.current = true;
        setUnlocking(true);
        try {
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (!hasHardware || !supported?.length) {
                // Do not hard-lock users on devices without biometric capability.
                setBiometricLocked(false);
                return true;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Unlock Circles',
                cancelLabel: 'Cancel',
                fallbackLabel: 'Use device passcode',
                disableDeviceFallback: false
            });

            const success = Boolean(result?.success);
            setBiometricLocked(!success);
            return success;
        } catch (error) {
            setBiometricLocked(true);
            return false;
        } finally {
            setUnlocking(false);
            unlockInFlightRef.current = false;
        }
    };

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

    useEffect(() => {
        if (!biometricsEnabled) {
            setBiometricLocked(false);
            return;
        }
        setBiometricLocked(true);
        unlockWithBiometrics().catch(() => {});
    }, [biometricsEnabled, routeTarget]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            const previous = appStateRef.current;
            appStateRef.current = nextState;
            const comingToForeground =
                (previous === 'background' || previous === 'inactive') && nextState === 'active';
            if (!comingToForeground || !biometricsEnabled) return;
            setBiometricLocked(true);
            unlockWithBiometrics().catch(() => {});
        });
        return () => sub.remove();
    }, [biometricsEnabled, routeTarget]);

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

    const showDeepLinkBanner = (text = 'Opened from shared link') => {
        if (deepLinkBannerTimerRef.current) {
            clearTimeout(deepLinkBannerTimerRef.current);
        }
        setDeepLinkBannerText(text);
        deepLinkBannerTimerRef.current = setTimeout(() => {
            setDeepLinkBannerText('');
            deepLinkBannerTimerRef.current = null;
        }, 2600);
    };

    const routeFromDeepLink = (url) => {
        const parsed = parseDeepLink(url);
        if (!parsed) return false;

        if (parsed.type === 'circle' && parsed.id) {
            const didNavigate = navigate('CircleDetail', { circle: { id: parsed.id } });
            if (didNavigate) showDeepLinkBanner('Opened from shared circle link');
            return didNavigate;
        }
        if (parsed.type === 'affirmation' && parsed.id) {
            const didNavigate = navigate('Affirmations', { affirmationId: parsed.id });
            if (didNavigate) showDeepLinkBanner('Opened from shared affirmation link');
            return didNavigate;
        }
        if (parsed.type === 'invite') {
            const didNavigate = routeTarget === 'UNAUTH' ? navigate('Onboarding') : navigate('MainTabs');
            if (didNavigate) showDeepLinkBanner();
            return didNavigate;
        }
        return false;
    };

    useEffect(() => {
        RnLinking.getInitialURL()
            .then((url) => {
                if (url) routeFromDeepLink(url);
            })
            .catch(() => {});

        const sub = RnLinking.addEventListener('url', ({ url }) => {
            if (url) routeFromDeepLink(url);
        });
        return () => sub.remove();
    }, [routeTarget]);

    useEffect(() => {
        return () => {
            if (deepLinkBannerTimerRef.current) {
                clearTimeout(deepLinkBannerTimerRef.current);
                deepLinkBannerTimerRef.current = null;
            }
        };
    }, []);

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
                        <Stack.Screen name="AboutCircles" component={AboutCirclesScreen} />
                        <Stack.Screen name="CommunityEducation" component={CommunityEducationScreen} />
                        <Stack.Screen name="CommunityEducationTopic" component={CommunityEducationTopicScreen} />
                        <Stack.Screen name="CommunityGuidelines" component={CommunityGuidelinesScreen} />
                        <Stack.Screen name="Assessment" component={AssessmentScreen} />
                        <Stack.Screen name="NineIndex" component={NineIndexScreen} />
                        <Stack.Screen name="Stats" component={StatsScreen} />
                    </Stack.Navigator>
                )}
            </NavigationContainer>

            {!!deepLinkBannerText && (
                <View style={styles.deepLinkBanner}>
                    <Ionicons name="link-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.deepLinkBannerText}>{deepLinkBannerText}</Text>
                </View>
            )}

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

            {biometricLocked && (
                <View style={styles.lockOverlay}>
                    <View style={styles.lockCard}>
                        <Ionicons name="lock-closed" size={22} color="#0F766E" />
                        <Text style={styles.lockTitle}>App Locked</Text>
                        <Text style={styles.lockSubtitle}>
                            Unlock with biometrics or your device passcode to continue.
                        </Text>
                        <TouchableOpacity
                            style={styles.unlockButton}
                            onPress={() => unlockWithBiometrics()}
                            disabled={unlocking}
                        >
                            <Text style={styles.unlockButtonText}>
                                {unlocking ? 'Unlocking...' : 'Unlock'}
                            </Text>
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
    deepLinkBanner: {
        position: 'absolute',
        left: 14,
        right: 14,
        top: 56,
        backgroundColor: 'rgba(17, 24, 39, 0.96)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#334155',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1100
    },
    deepLinkBannerText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 8
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
    },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(12, 16, 23, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        zIndex: 1200
    },
    lockCard: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },
    lockTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginTop: 8
    },
    lockSubtitle: {
        marginTop: 8,
        fontSize: 13,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 18
    },
    unlockButton: {
        marginTop: 14,
        backgroundColor: '#00A99D',
        borderRadius: 12,
        paddingHorizontal: 18,
        paddingVertical: 10
    },
    unlockButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    }
});
