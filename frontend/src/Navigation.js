import React, { useState, useEffect, useRef } from 'react';
console.log('[PERF] Navigation.js: Module evaluating');
import { View, Pressable, Text, StyleSheet, TouchableOpacity, Linking as RnLinking, Animated, PanResponder, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import MainTabs from './navigation/MainTabs';

import SplashScreen from './screens/SplashScreen';
// ... other imports ...
import { useAuth } from './context/AuthContext';

// Import all screens (keeping original imports for brevity in this replacement)
import OnboardingScreen from './screens/OnboardingScreen';
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import VerificationScreen from './screens/VerificationScreen';
import OtpVerificationScreen from './screens/OtpVerificationScreen';
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
import AppLockScreen from './screens/AppLockScreen';
import { navigationRef, flushPendingNavigation, navigate } from './navigation/navigationRef';
import { huddleService } from './services/api/huddleService';
import { parseDeepLink } from './utils/deepLinks';
import { pendingDeepLink } from './services/deepLink/pendingDeepLink';
import { biometricPrefs } from './services/security/biometricPrefs';
import { useAppLockController } from './services/security/useAppLockController';
import { isProtectedRoute } from './security/protectedRoutes';
import { screenProtectionService } from './security/screenProtectionService';
import { userService } from './services/api/userService';
import { auth } from './services/firebaseConfig';

const Stack = createNativeStackNavigator();
const DRAG_MARGIN = 12;
const formatCallDuration = (seconds = 0) => {
    const total = Math.max(0, Math.floor(Number(seconds) || 0));
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

let LocalAuthentication = null;
try {
    // Optional native module: available on new builds.
    // Keep app functional on older debug APKs that do not include it yet.
    LocalAuthentication = require('expo-local-authentication');
} catch {
    LocalAuthentication = null;
}

export default function Navigation() {
    const { routeTarget, userData, user } = useAuth();
    const [activeHuddleSession, setActiveHuddleSession] = useState(null);
    const [currentRouteName, setCurrentRouteName] = useState('');
    const [passwordUnlocking, setPasswordUnlocking] = useState(false);
    const [unlockPassword, setUnlockPassword] = useState('');
    const [setupPromptVisible, setSetupPromptVisible] = useState(false);
    const [setupPromptBusy, setSetupPromptBusy] = useState(false);
    const [setupPromptError, setSetupPromptError] = useState('');
    const [deepLinkBannerText, setDeepLinkBannerText] = useState('');
    const [privacyMaskVisible, setPrivacyMaskVisible] = useState(false);
    const firstRenderLoggedRef = useRef(false);
    const passwordUnlockInFlightRef = useRef(false);
    const deepLinkBannerTimerRef = useRef(null);
    const screenSizeRef = useRef(Dimensions.get('window'));
    const floatingPos = useRef(new Animated.ValueXY({ x: 14, y: Math.max(100, Dimensions.get('window').height - 130) })).current;
    const [floatingBox, setFloatingBox] = useState({ width: 320, height: 68 });
    const [nowMs, setNowMs] = useState(Date.now());

    const appLock = useAppLockController({ user, userData, routeTarget });
    const lockEnabled = appLock.state.lockEnabled;
    const isLocked = appLock.state.isLocked;
    const unlocking = appLock.state.unlockInProgress;
    const canUsePasswordFallback = Boolean(user?.email && user?.providerData?.some((provider) => provider?.providerId === 'password'));

    const unlockWithPassword = async () => {
        if (passwordUnlockInFlightRef.current) return false;
        const password = String(unlockPassword || '').trim();
        if (!password) {
            appLock.setUnlockError('Enter your account password.');
            return false;
        }
        if (!auth.currentUser?.email) {
            appLock.setUnlockError('Password unlock is only available for email/password accounts.');
            return false;
        }
        passwordUnlockInFlightRef.current = true;
        setPasswordUnlocking(true);
        appLock.setUnlockError('');
        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
            await reauthenticateWithCredential(auth.currentUser, credential);
            appLock.forceUnlock('password');
            setUnlockPassword('');
            return true;
        } catch (error) {
            appLock.setUnlockError('Password is incorrect. Please try again.');
            return false;
        } finally {
            setPasswordUnlocking(false);
            passwordUnlockInFlightRef.current = false;
        }
    };

    useEffect(() => {
        const unsubscribe = huddleService.subscribeToActiveLocalSession((session) => {
            setActiveHuddleSession(session || null);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        const sub = Dimensions.addEventListener('change', ({ window }) => {
            screenSizeRef.current = window;
        });
        return () => sub?.remove?.();
    }, []);

    useEffect(() => {
        console.log('[Navigation] Route target:', routeTarget);
        flushPendingNavigation();
    }, [routeTarget]);

    useEffect(() => {
        const unsubscribe = screenProtectionService.subscribe((snapshot) => {
            setPrivacyMaskVisible(Boolean(snapshot?.maskVisible));
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (routeTarget === 'UNAUTH') {
            screenProtectionService.clearRouteProtection().catch(() => {});
            return;
        }

        const enhancedPrivacyMode = Boolean(userData?.settings?.enhancedPrivacyMode);
        const routeKnown = Boolean(currentRouteName);
        const shouldProtect = !routeKnown || isProtectedRoute(currentRouteName, { enhancedPrivacyMode });
        screenProtectionService.setRouteProtection(shouldProtect, routeKnown ? currentRouteName : '__boot__').catch(() => {});
    }, [currentRouteName, routeTarget, userData?.settings?.enhancedPrivacyMode]);

    useEffect(() => {
        if (!user?.uid || routeTarget === 'UNAUTH') return;
        let cancelled = false;
        const maybeShowSetupPrompt = async () => {
            const seen = await biometricPrefs.hasSeenSetupPrompt(user.uid);
            if (cancelled || seen) return;
            if (!LocalAuthentication) {
                await biometricPrefs.markSetupPromptSeen(user.uid);
                return;
            }
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            if (!hasHardware) {
                await biometricPrefs.markSetupPromptSeen(user.uid);
                return;
            }
            if (!cancelled) {
                setSetupPromptError('');
                setSetupPromptVisible(true);
            }
        };
        maybeShowSetupPrompt().catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [user?.uid, routeTarget]);

    const handleSetupPrompt = async (enableBiometrics) => {
        if (!user?.uid || setupPromptBusy) return;
        setSetupPromptBusy(true);
        setSetupPromptError('');
        try {
            if (!enableBiometrics) {
                await biometricPrefs.setDeviceBiometricEnabled(user.uid, false);
                await biometricPrefs.markSetupPromptSeen(user.uid);
                appLock.setDeviceBiometricEnabled(false);
                setSetupPromptVisible(false);
                return;
            }
            if (!LocalAuthentication) {
                setSetupPromptError('Biometric module is unavailable in this build. Rebuild the app to enable it.');
                return;
            }
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();
            if (!hasHardware || !isEnrolled) {
                setSetupPromptError('Set up Face ID/Fingerprint in device settings first, then try again.');
                return;
            }
            await biometricPrefs.setDeviceBiometricEnabled(user.uid, true);
            await biometricPrefs.markSetupPromptSeen(user.uid);
            await userService.updateUserDocument(user.uid, {
                settings: {
                    ...(userData?.settings || {}),
                    biometrics: true
                }
            });
            appLock.setDeviceBiometricEnabled(true);
            setSetupPromptVisible(false);
        } catch (error) {
            setSetupPromptError('Could not enable biometrics right now. Try again.');
        } finally {
            setSetupPromptBusy(false);
        }
    };

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

    useEffect(() => {
        if (!showHuddleBanner) return undefined;
        const timer = setInterval(() => setNowMs(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [showHuddleBanner]);

    const callStartedAtMs = Number(activeHuddleSession?.startedAtMs || 0);
    const elapsedSeconds = callStartedAtMs > 0
        ? Math.max(0, Math.floor((nowMs - callStartedAtMs) / 1000))
        : Number(activeHuddleSession?.elapsedSeconds || 0);
    const activeSpeakerName = String(activeHuddleSession?.activeSpeakerName || '').trim();
    const huddleSubtitle = activeSpeakerName
        ? `${formatCallDuration(elapsedSeconds)} • ${activeSpeakerName} speaking`
        : `${formatCallDuration(elapsedSeconds)} • Tap to return to call`;

    const clampFloating = (x, y) => {
        const window = screenSizeRef.current || Dimensions.get('window');
        const maxX = Math.max(DRAG_MARGIN, window.width - floatingBox.width - DRAG_MARGIN);
        const maxY = Math.max(DRAG_MARGIN + 40, window.height - floatingBox.height - DRAG_MARGIN - 60);
        return {
            x: Math.min(Math.max(DRAG_MARGIN, x), maxX),
            y: Math.min(Math.max(DRAG_MARGIN + 40, y), maxY)
        };
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2,
            onPanResponderGrant: () => {
                floatingPos.setOffset({
                    x: floatingPos.x.__getValue(),
                    y: floatingPos.y.__getValue()
                });
                floatingPos.setValue({ x: 0, y: 0 });
            },
            onPanResponderMove: Animated.event([null, { dx: floatingPos.x, dy: floatingPos.y }], {
                useNativeDriver: false
            }),
            onPanResponderRelease: () => {
                floatingPos.flattenOffset();
                const clamped = clampFloating(floatingPos.x.__getValue(), floatingPos.y.__getValue());
                Animated.spring(floatingPos, {
                    toValue: clamped,
                    useNativeDriver: false,
                    bounciness: 0
                }).start();
            }
        })
    ).current;

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

    const routeFromDeepLink = async (url, options = {}) => {
        const { persistIfUnauthed = true } = options;
        const parsed = parseDeepLink(url);
        if (!parsed) return false;

        if (routeTarget === 'UNAUTH') {
            if (persistIfUnauthed) {
                await pendingDeepLink.save(url).catch(() => {});
            }
            navigate('Onboarding');
            return true;
        }

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
        if (routeTarget === 'UNAUTH') return;
        let cancelled = false;
        const resolvePending = async () => {
            const pendingUrl = await pendingDeepLink.consume().catch(() => '');
            if (!pendingUrl || cancelled) return;
            await routeFromDeepLink(pendingUrl, { persistIfUnauthed: false });
        };
        resolvePending().catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [routeTarget]);

    useEffect(() => {
        return () => {
            if (deepLinkBannerTimerRef.current) {
                clearTimeout(deepLinkBannerTimerRef.current);
                deepLinkBannerTimerRef.current = null;
            }
            screenProtectionService.cleanup().catch(() => {});
        };
    }, []);

    return (
        <View style={styles.root}>
            {!appLock.initializing && !(lockEnabled && (isLocked || appLock.privacyCoverVisible || unlocking)) && (
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
                        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
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
                        <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
                    </Stack.Navigator>
                    )}
                </NavigationContainer>
            )}

            {!!deepLinkBannerText && (
                <View style={styles.deepLinkBanner}>
                    <Ionicons name="link-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.deepLinkBannerText}>{deepLinkBannerText}</Text>
                </View>
            )}

            {showHuddleBanner && (
                <Animated.View
                    style={[
                        styles.huddleBanner,
                        {
                            left: floatingPos.x,
                            top: floatingPos.y
                        }
                    ]}
                    onLayout={(event) => {
                        const { width, height } = event.nativeEvent.layout;
                        setFloatingBox({ width, height });
                    }}
                >
                    <View style={styles.huddleDragHandle} {...panResponder.panHandlers}>
                        <Ionicons name="reorder-two-outline" size={18} color="#A3A3A3" />
                    </View>
                    <Pressable style={styles.huddleBannerInfo} onPress={openHuddle}>
                        <Text style={styles.huddleBannerTitle}>Huddle in progress</Text>
                        <Text style={styles.huddleBannerSubtitle} numberOfLines={1}>{huddleSubtitle}</Text>
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
                </Animated.View>
            )}

            {setupPromptVisible && !(lockEnabled && isLocked) && routeTarget !== 'UNAUTH' && (
                <View style={styles.setupPromptOverlay}>
                    <View style={styles.setupPromptCard}>
                        <View style={styles.setupPromptIconWrap}>
                            <Ionicons name="shield-checkmark" size={26} color="#FFFFFF" />
                        </View>
                        <Text style={styles.setupPromptTitle}>Protect Circles on this device?</Text>
                        <Text style={styles.setupPromptBody}>
                            Enable Face ID/Fingerprint lock so your app stays private.
                        </Text>
                        {!!setupPromptError && (
                            <Text style={styles.setupPromptError}>{setupPromptError}</Text>
                        )}
                        <TouchableOpacity
                            style={styles.setupEnableButton}
                            onPress={() => handleSetupPrompt(true)}
                            disabled={setupPromptBusy}
                        >
                            <Text style={styles.setupEnableButtonText}>
                                {setupPromptBusy ? 'Setting up...' : 'Enable biometrics'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.setupSkipButton}
                            onPress={() => handleSetupPrompt(false)}
                            disabled={setupPromptBusy}
                        >
                            <Text style={styles.setupSkipButtonText}>Not now</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {(lockEnabled && (isLocked || unlocking)) && (
                <AppLockScreen
                    user={user}
                    unlocking={unlocking}
                    passwordUnlocking={passwordUnlocking}
                    unlockPassword={unlockPassword}
                    setUnlockPassword={setUnlockPassword}
                    unlockError={appLock.unlockError}
                    canUsePasswordFallback={canUsePasswordFallback}
                    onUnlockBiometric={appLock.tryBiometricUnlock}
                    onUnlockPassword={unlockWithPassword}
                    promptEpoch={appLock.promptEpoch}
                />
            )}

            {appLock.privacyCoverVisible && !isLocked && (
                <View style={styles.privacyCover}>
                    <View style={styles.privacyCard}>
                        <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
                        <Text style={styles.privacyCoverText}>Circles Health App</Text>
                    </View>
                </View>
            )}

            {privacyMaskVisible && !isLocked && (
                <View style={styles.screenProtectionMask}>
                    <View style={styles.screenProtectionMaskCard}>
                        <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
                        <Text style={styles.screenProtectionMaskTitle}>Protected View</Text>
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
        width: 336,
        backgroundColor: '#111111',
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#2E2E2E',
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1150
    },
    huddleDragHandle: {
        width: 22,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6
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
    setupPromptOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(2, 20, 21, 0.72)',
        zIndex: 1180,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    setupPromptCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderWidth: 1,
        borderColor: '#CCFBF1'
    },
    setupPromptIconWrap: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#00A99D',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginBottom: 10
    },
    setupPromptTitle: {
        fontSize: 21,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center'
    },
    setupPromptBody: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 20,
        color: '#334155',
        textAlign: 'center'
    },
    setupPromptError: {
        marginTop: 10,
        fontSize: 13,
        color: '#DC2626',
        textAlign: 'center',
        fontWeight: '600'
    },
    setupEnableButton: {
        marginTop: 14,
        backgroundColor: '#00A99D',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    setupEnableButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800'
    },
    setupSkipButton: {
        marginTop: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        paddingVertical: 11,
        alignItems: 'center',
        justifyContent: 'center'
    },
    setupSkipButtonText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '700'
    },
    privacyCover: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#042726',
        zIndex: 1300,
        alignItems: 'center',
        justifyContent: 'center'
    },
    privacyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.14)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16
    },
    privacyCoverText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    screenProtectionMask: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(3, 35, 34, 0.96)',
        zIndex: 1310,
        alignItems: 'center',
        justifyContent: 'center'
    },
    screenProtectionMaskCard: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.16)'
    },
    screenProtectionMaskTitle: {
        marginTop: 8,
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800'
    }
});
