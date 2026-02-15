import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Dimensions, PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, Vibration, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Daily from '@daily-co/react-native-daily-js';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import { huddleService } from '../services/api/huddleService';
import { nativeCallService } from '../services/native/nativeCallService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const MAX_VISIBLE_PARTICIPANTS = 8;
const JOIN_TIMEOUT_MS = 45000;
const JOIN_MAX_ATTEMPTS = 2;
let ExpoAudio = null;
try {
    ExpoAudio = require('expo-av').Audio;
} catch {
    ExpoAudio = null;
}

const HuddleScreen = ({ navigation, route }) => {
    const { user, userData } = useAuth();
    const insets = useSafeAreaInsets();
    const callObjectRef = useRef(null);
    const hasStartedJoinRef = useRef(false);
    const isLeavingRef = useRef(false);
    const joinFlowCancelledRef = useRef(false);
    const ringbackSoundRef = useRef(null);
    const ringbackSessionRef = useRef(0);
    const ringbackVibrationIntervalRef = useRef(null);
    const firstRemoteAudioLoggedRef = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const screenShownAtRef = useRef(Date.now());
    const metricsRef = useRef({
        tapTs: route?.params?.callTapTs || null,
        callableResolvedAt: null,
        joinStartedAt: null,
        joinedEventAt: null
    });
    const keepAliveOnUnmountRef = useRef(false);
    const eventHandlersRef = useRef(null);

    const chat = route?.params?.chat || { id: route?.params?.chatId, name: 'Huddle', isGroup: true };
    const mode = route?.params?.mode || (route?.params?.huddleId ? 'join' : 'start');
    const [huddleId, setHuddleId] = useState(route?.params?.huddleId || null);
    const [phase, setPhase] = useState('connecting'); // connecting | ringing | joined | ending | error | ended
    const [errorMessage, setErrorMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [activeSpeakerSessionId, setActiveSpeakerSessionId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isHost, setIsHost] = useState(mode === 'start');
    const [expectedParticipants, setExpectedParticipants] = useState([]);
    const [seconds, setSeconds] = useState(0);
    const [layoutSize, setLayoutSize] = useState({
        width: Dimensions.get('window').width,
        height: Math.max(Dimensions.get('window').height - 260, 320)
    });

    const logMetric = useCallback((label, value) => {
        console.log(`[HUDDLE_METRIC] ${label}: ${value}ms`);
    }, []);

    const refreshParticipants = useCallback(() => {
        const callObject = callObjectRef.current;
        if (!callObject) return;
        const allParticipants = Object.values(callObject.participants() || {});
        setParticipants(allParticipants);
        const local = allParticipants.find((p) => p.local);
        if (local) {
            setIsMuted(local.audio === false);
        }
    }, []);

    useEffect(() => {
        if (!chat?.id) return undefined;

        const chatRef = doc(db, 'chats', chat.id);
        const unsubscribe = onSnapshot(chatRef, async (chatSnap) => {
            const ids = chatSnap.data()?.participants || [];
            if (!Array.isArray(ids) || ids.length === 0) {
                setExpectedParticipants([]);
                return;
            }
            const rows = await Promise.all(ids.map(async (uid) => {
                const userSnap = await getDoc(doc(db, 'users', uid));
                const data = userSnap.exists() ? userSnap.data() : {};
                return {
                    uid,
                    name: data?.name || data?.displayName || 'Member',
                    photoURL: data?.photoURL || ''
                };
            }));
            setExpectedParticipants(rows);
        }, () => {
            setExpectedParticipants([]);
        });

        return unsubscribe;
    }, [chat?.id]);

    const requestMicPermission = useCallback(async () => {
        if (Platform.OS !== 'android') return true;
        try {
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            return result === PermissionsAndroid.RESULTS.GRANTED;
        } catch {
            return false;
        }
    }, []);

    const safeCall = async (fn) => {
        try {
            return await fn();
        } catch {
            return null;
        }
    };

    const stopRingbackTone = useCallback(async () => {
        ringbackSessionRef.current += 1;
        if (ringbackVibrationIntervalRef.current) {
            clearInterval(ringbackVibrationIntervalRef.current);
            ringbackVibrationIntervalRef.current = null;
        }
        Vibration.cancel();
        const sound = ringbackSoundRef.current;
        ringbackSoundRef.current = null;
        if (!sound) return;
        await safeCall(() => sound.stopAsync());
        await safeCall(() => sound.unloadAsync());
    }, []);

    const startRingbackTone = useCallback(async () => {
        const sessionId = ringbackSessionRef.current + 1;
        ringbackSessionRef.current = sessionId;
        await stopRingbackTone();

        if (ExpoAudio) {
            await safeCall(() => ExpoAudio.setAudioModeAsync({
                playsInSilentModeIOS: true,
                shouldDuckAndroid: true,
                staysActiveInBackground: false
            }));
            const created = await safeCall(() => ExpoAudio.Sound.createAsync(
                require('../assets/sounds/ringback.wav'),
                { isLooping: true, shouldPlay: true, volume: 1.0 }
            ));
            if (!created?.sound) return;
            if (ringbackSessionRef.current !== sessionId) {
                await safeCall(() => created.sound.unloadAsync());
                return;
            }
            ringbackSoundRef.current = created.sound;
            return;
        }

        // Fallback for binaries without expo-av.
        Vibration.vibrate(350);
        ringbackVibrationIntervalRef.current = setInterval(() => {
            Vibration.vibrate(350);
        }, 1800);
    }, [stopRingbackTone]);

    const detachCallHandlers = useCallback(() => {
        const callObject = callObjectRef.current;
        const handlers = eventHandlersRef.current;
        if (!callObject || !handlers) return;
        Object.entries(handlers).forEach(([eventName, handler]) => {
            try {
                callObject.off(eventName, handler);
            } catch {
                // ignore
            }
        });
        eventHandlersRef.current = null;
    }, []);

    const attachCallHandlers = useCallback((callObject) => {
        detachCallHandlers();

        // Guard: ignore all Daily events once we're leaving to prevent ghost updates
        const guarded = (fn) => (...args) => {
            if (isLeavingRef.current) return;
            fn(...args);
        };

        const handlers = {
            'joined-meeting': guarded(() => {
                metricsRef.current.joinedEventAt = Date.now();
                if (metricsRef.current.joinStartedAt) {
                    logMetric('join_started_to_joined_event', metricsRef.current.joinedEventAt - metricsRef.current.joinStartedAt);
                }
                setPhase('joined');
                refreshParticipants();
                callObject.startRemoteParticipantsAudioLevelObserver(250).catch(() => { });
            }),
            'participant-joined': guarded(() => refreshParticipants()),
            'participant-updated': guarded(() => refreshParticipants()),
            'participant-left': guarded(() => refreshParticipants()),
            'active-speaker-change': guarded((ev) => {
                setActiveSpeakerSessionId(ev?.activeSpeaker?.peerId || null);
            }),
            'track-started': guarded((ev) => {
                const isFirstRemoteAudio = ev?.type === 'audio' && ev?.participant && !ev.participant.local && !firstRemoteAudioLoggedRef.current;
                if (isFirstRemoteAudio) {
                    firstRemoteAudioLoggedRef.current = true;
                    if (metricsRef.current.joinedEventAt) {
                        logMetric('joined_event_to_first_remote_audio', Date.now() - metricsRef.current.joinedEventAt);
                    }
                }
            }),
            error: guarded(() => {
                stopRingbackTone();
                setPhase('error');
                setErrorMessage('Call error. Please try again.');
            })
        };

        Object.entries(handlers).forEach(([eventName, handler]) => {
            callObject.on(eventName, handler);
        });
        eventHandlersRef.current = handlers;
    }, [detachCallHandlers, logMetric, refreshParticipants, stopRingbackTone]);

    const leaveCall = useCallback(async (endForEveryone = false, navigateBack = true, clearLocalSession = true) => {
        if (isLeavingRef.current) return;
        isLeavingRef.current = true;
        joinFlowCancelledRef.current = true;

        // Show "Ending call..." overlay while cleanup runs
        setPhase('ending');

        const callObject = callObjectRef.current;
        const currentHuddleId = huddleId;
        callObjectRef.current = null;
        detachCallHandlers();

        if (clearLocalSession) {
            huddleService.clearActiveLocalSession();
        }

        // Do backend + media cleanup BEFORE navigating, with a 3s safety timeout
        const cleanup = async () => {
            await stopRingbackTone();

            // Backend cleanup first so Firestore doc updates for the other party
            if (currentHuddleId) {
                nativeCallService.endHuddleCall(currentHuddleId);
                // endHuddle now works for any participant (not just host)
                await safeCall(() => huddleService.endHuddle(currentHuddleId));
            }

            // Then tear down media
            if (callObject) {
                await safeCall(() => callObject.stopRemoteParticipantsAudioLevelObserver());
                await safeCall(() => callObject.leave());
                await safeCall(() => callObject.destroy());
            }
        };

        // Race cleanup against a 3s timeout so the user is never stuck
        await Promise.race([
            cleanup(),
            new Promise((resolve) => setTimeout(resolve, 3000))
        ]);

        setPhase('ended');

        if (navigateBack) {
            if (navigation.canGoBack()) {
                navigation.goBack();
            } else {
                navigation.navigate('MainTabs');
            }
        }
    }, [detachCallHandlers, huddleId, navigation, stopRingbackTone]);

    useEffect(() => {
        if (!metricsRef.current.tapTs) return;
        logMetric('tap_to_huddle_screen', screenShownAtRef.current - metricsRef.current.tapTs);
    }, [logMetric]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.1, duration: 500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true })
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);

    useEffect(() => {
        if (phase !== 'joined') return undefined;
        const timer = setInterval(() => setSeconds((prev) => prev + 1), 1000);
        return () => clearInterval(timer);
    }, [phase]);

    useEffect(() => () => {
        stopRingbackTone();
    }, [stopRingbackTone]);

    useEffect(() => {
        return () => {
            if (keepAliveOnUnmountRef.current) {
                detachCallHandlers();
                return;
            }
            leaveCall(isHost, false);
        };
    }, [detachCallHandlers, isHost, leaveCall]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {
            if (isLeavingRef.current) return;
            if (callObjectRef.current && phase === 'joined') {
                keepAliveOnUnmountRef.current = true;
            }
        });
        return unsubscribe;
    }, [navigation, phase]);

    useEffect(() => {
        const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
            keepAliveOnUnmountRef.current = true;
            navigation.goBack();
            return true;
        });
        return () => backSub.remove();
    }, [navigation]);

    // Phase 2 + 1: Firestore real-time listener on the huddle document
    useEffect(() => {
        if (!huddleId) return undefined;
        if (isLeavingRef.current) return undefined;

        const huddleDocRef = doc(db, 'huddles', huddleId);
        const unsubscribe = onSnapshot(huddleDocRef, (snap) => {
            if (!snap.exists() || isLeavingRef.current) return;
            const data = snap.data();

            // If huddle ended remotely, tear down locally
            if (data.status === 'ended' || data.isActive === false) {
                leaveCall(false, true, true);
                return;
            }

            // If callee answered (status went to 'active'), stop ringback for the caller
            if (data.status === 'active' && isHost) {
                stopRingbackTone();
            }

            // Debug: log participant array changes from Firestore
            const firestoreParticipants = data.participants || [];
            console.log('[Huddle] Firestore participants updated:', firestoreParticipants.length, firestoreParticipants);
        }, (err) => {
            console.warn('[Huddle] onSnapshot error:', err);
        });

        return unsubscribe;
    }, [huddleId, isHost, leaveCall, stopRingbackTone]);

    useEffect(() => {
        if (hasStartedJoinRef.current) return;
        hasStartedJoinRef.current = true;
        joinFlowCancelledRef.current = false;

        const start = async () => {
            // Phase 3: Show ringing immediately for caller before the callable resolves
            if (mode === 'start') {
                setPhase('ringing');
            } else {
                setPhase('connecting');
            }
            setErrorMessage('');
            setSeconds(0);
            firstRemoteAudioLoggedRef.current = false;

            const hasMic = await requestMicPermission();
            if (!hasMic) {
                setPhase('error');
                setErrorMessage('Microphone permission is required to join this huddle.');
                return;
            }

            const existingSession = huddleService.getActiveLocalSession();
            if (existingSession?.callObject && existingSession?.chatId === chat.id) {
                callObjectRef.current = existingSession.callObject;
                setHuddleId(existingSession.huddleId || huddleId || route?.params?.huddleId || null);
                const sessionHostUid = existingSession.startedBy || null;
                setIsHost(Boolean(sessionHostUid && sessionHostUid === user?.uid));
                setPhase('joined');
                attachCallHandlers(existingSession.callObject);
                refreshParticipants();
                return;
            }

            try {
                const callableStartAt = Date.now();
                let huddleSession;
                if (mode === 'start') {
                    huddleSession = await huddleService.startHuddle(chat.id, !!chat.isGroup);
                    setIsHost(true);
                } else {
                    huddleSession = await huddleService.joinHuddle(huddleId || route?.params?.huddleId);
                }

                metricsRef.current.callableResolvedAt = Date.now();
                logMetric('screen_to_callable_resolved', metricsRef.current.callableResolvedAt - screenShownAtRef.current);
                console.log('[HUDDLE_METRIC] callable_duration:', metricsRef.current.callableResolvedAt - callableStartAt, 'ms');

                const resolvedHuddleId = huddleSession?.huddleId || huddleId || route?.params?.huddleId;
                setHuddleId(resolvedHuddleId);
                const resolvedHostUid = huddleSession?.startedBy || (mode === 'start' ? user?.uid : null) || null;
                const hostStatus = Boolean(resolvedHostUid && resolvedHostUid === user?.uid);
                setIsHost(Boolean(hostStatus));
                if (hostStatus && resolvedHuddleId) {
                    nativeCallService.startOutgoingHuddleCall({
                        huddleId: resolvedHuddleId,
                        chatName: chat?.name || 'Huddle'
                    });
                }
                // Phase is already 'ringing' for caller (set before callable) — no need to set again
                if (joinFlowCancelledRef.current || isLeavingRef.current) {
                    return;
                }
                const joinOptions = {
                    url: huddleSession?.roomUrl,
                    token: huddleSession?.token,
                    userName: userData?.name || user?.displayName || 'Member',
                    userData: {
                        uid: user?.uid || '',
                        photoURL: userData?.photoURL || user?.photoURL || ''
                    },
                    startVideoOff: true,
                    startAudioOff: false
                };

                metricsRef.current.joinStartedAt = Date.now();
                if (metricsRef.current.callableResolvedAt) {
                    logMetric('callable_resolved_to_join_started', metricsRef.current.joinStartedAt - metricsRef.current.callableResolvedAt);
                }
                let activeCallObject = null;
                let joinAttempt = 0;
                while (joinAttempt < JOIN_MAX_ATTEMPTS && !activeCallObject) {
                    joinAttempt += 1;
                    const attemptCallObject = Daily.createCallObject({
                        startVideoOff: true,
                        startAudioOff: false,
                        subscribeToTracksAutomatically: true
                    });
                    callObjectRef.current = attemptCallObject;
                    attachCallHandlers(attemptCallObject);
                    try {
                        await Promise.race([
                            attemptCallObject.join(joinOptions),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('join-timeout')), JOIN_TIMEOUT_MS))
                        ]);
                        activeCallObject = attemptCallObject;
                    } catch (joinError) {
                        const isTimeout = String(joinError?.message || '').toLowerCase().includes('join-timeout');
                        const shouldRetry = isTimeout && joinAttempt < JOIN_MAX_ATTEMPTS;
                        detachCallHandlers();
                        await safeCall(() => attemptCallObject.leave());
                        await safeCall(() => attemptCallObject.destroy());
                        if (callObjectRef.current === attemptCallObject) {
                            callObjectRef.current = null;
                        }
                        if (!shouldRetry) {
                            throw joinError;
                        }
                        console.warn(`[HUDDLE] join attempt ${joinAttempt} timed out. Retrying...`);
                    }
                }
                if (!activeCallObject) {
                    throw new Error('join-timeout');
                }
                if (joinFlowCancelledRef.current || isLeavingRef.current || callObjectRef.current !== activeCallObject) {
                    return;
                }

                activeCallObject.setLocalVideo(false);
                activeCallObject.setNativeInCallAudioMode('video');
                nativeCallService.setHuddleCallActive(resolvedHuddleId);
                setIsSpeakerOn(true);
                refreshParticipants();
                huddleService.setActiveLocalSession({
                    chatId: chat.id,
                    huddleId: resolvedHuddleId,
                    chatName: chat?.name || 'Huddle',
                    startedBy: resolvedHostUid,
                    isHost: Boolean(hostStatus),
                    callObject: activeCallObject
                });
            } catch (error) {
                const isExpectedCancellation =
                    joinFlowCancelledRef.current ||
                    isLeavingRef.current ||
                    String(error?.message || '').toLowerCase().includes('use after destroy');
                if (isExpectedCancellation) {
                    return;
                }
                await stopRingbackTone();
                console.error('Huddle join failed', error);
                setPhase('error');
                const isTimeout = String(error?.message || '').toLowerCase().includes('join-timeout');
                setErrorMessage(
                    isTimeout
                        ? 'Huddle is not connecting to the call server right now. This is not caused by other members not joining.'
                        : 'Unable to connect huddle. Please try again.'
                );
            }
        };

        start();
    }, [attachCallHandlers, chat.id, chat.isGroup, huddleId, logMetric, mode, refreshParticipants, requestMicPermission, route?.params?.huddleId, user?.displayName, user?.uid, userData?.name]);

    const remoteParticipantCount = useMemo(
        () => participants.filter((p) => !p.local).length,
        [participants]
    );

    useEffect(() => {
        if (!isHost || !huddleId || phase === 'error' || remoteParticipantCount > 0) return undefined;

        const interval = setInterval(() => {
            huddleService.ringHuddleParticipants(huddleId).catch(() => { });
        }, 12000);

        return () => clearInterval(interval);
    }, [huddleId, isHost, phase, remoteParticipantCount]);

    useEffect(() => {
        const shouldPlayRingback = (phase === 'joined' || phase === 'ringing') && isHost && remoteParticipantCount === 0;
        if (shouldPlayRingback) {
            startRingbackTone();
            return undefined;
        }
        stopRingbackTone();
        return undefined;
    }, [isHost, phase, remoteParticipantCount, startRingbackTone, stopRingbackTone]);

    const toggleMute = async () => {
        const callObject = callObjectRef.current;
        if (!callObject) return;
        const next = !isMuted;
        callObject.setLocalAudio(!next);
        setIsMuted(next);
        if (huddleId) {
            huddleService.updateHuddleState(huddleId, next ? 'mute' : 'unmute').catch(() => { });
        }
    };

    const toggleSpeaker = () => {
        const callObject = callObjectRef.current;
        if (!callObject) return;
        const next = !isSpeakerOn;
        setIsSpeakerOn(next);
        callObject.setNativeInCallAudioMode(next ? 'video' : 'voice');
    };

    const participantsForUI = useMemo(() => {
        const sorted = [...participants].sort((a, b) => {
            if (a.local && !b.local) return -1;
            if (!a.local && b.local) return 1;
            return (a.user_name || '').localeCompare(b.user_name || '');
        });
        const visible = sorted.slice(0, MAX_VISIBLE_PARTICIPANTS);
        return { visible, overflowCount: Math.max(sorted.length - MAX_VISIBLE_PARTICIPANTS, 0) };
    }, [participants]);

    const rosterParticipants = useMemo(() => {
        const normalize = (value) => String(value || '').trim().toLowerCase();
        const joinedUidSet = new Set();
        const joinedNameSet = new Set();
        participants.forEach((p) => {
            const uid = p?.userData?.uid;
            if (uid) joinedUidSet.add(uid);
            const name = normalize(p?.user_name);
            if (name) joinedNameSet.add(name);
        });

        const expected = expectedParticipants.map((member) => ({
            ...member,
            joined: joinedUidSet.has(member.uid) || joinedNameSet.has(normalize(member.name))
        }));

        if (expected.length > 0) return expected;

        return participants.map((p) => ({
            uid: p?.userData?.uid || p?.session_id || p?.user_name || Math.random().toString(36),
            name: p?.local ? 'You' : (p?.user_name || 'Member'),
            photoURL: p?.userData?.photoURL || '',
            joined: true
        }));
    }, [expectedParticipants, participants]);

    const circleNodes = useMemo(() => {
        const { visible } = participantsForUI;
        const count = Math.max(visible.length, 1);
        const radius = Math.max(80, Math.min(layoutSize.width, layoutSize.height) * 0.32);
        const centerX = layoutSize.width / 2;
        const centerY = layoutSize.height / 2;
        const size = 86;

        return visible.map((participant, index) => {
            const angle = (-Math.PI / 2) + ((2 * Math.PI * index) / count);
            return {
                participant,
                x: centerX + radius * Math.cos(angle) - (size / 2),
                y: centerY + radius * Math.sin(angle) - (size / 2),
                size
            };
        });
    }, [layoutSize.height, layoutSize.width, participantsForUI]);

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const statusText = phase === 'ending'
        ? 'Ending call...'
        : phase === 'ringing'
            ? 'Ringing...'
            : phase === 'joined'
                ? (isHost && remoteParticipantCount === 0 ? 'Ringing...' : formatTime(seconds))
                : phase === 'error'
                    ? 'Connection failed'
                    : 'Connecting...';

    if (phase === 'ending') {
        return (
            <View style={styles.errorScreen}>
                <StatusBar barStyle="light-content" backgroundColor="#111111" />
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={[styles.errorTitle, { marginTop: 16 }]}>Ending call...</Text>
            </View>
        );
    }

    if (phase === 'error') {
        return (
            <View style={styles.errorScreen}>
                <StatusBar barStyle="light-content" backgroundColor="#111111" />
                <Text style={styles.errorTitle}>Could not join huddle</Text>
                <Text style={styles.errorSubtitle}>{errorMessage}</Text>
                <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.errorButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ExpoLinearGradient colors={[COLORS.background, '#EAF7F5']} style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            keepAliveOnUnmountRef.current = true;
                            navigation.goBack();
                        }}
                    >
                        <Ionicons name="chevron-back" size={26} color="#1E2A3D" />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>{chat?.name || 'Huddle'}</Text>
                        <Text style={styles.headerSubtitle}>{statusText}</Text>
                    </View>
                    <View style={{ width: 36 }} />
                </View>

                <View
                    style={styles.circleCanvas}
                    onLayout={(e) => {
                        const { width, height } = e.nativeEvent.layout;
                        setLayoutSize({ width, height });
                    }}
                >
                    {phase === 'connecting' && (
                        <View style={styles.connectingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.primary} />
                            <Text style={styles.connectingText}>Connecting call...</Text>
                        </View>
                    )}

                    {circleNodes.map((node) => {
                        const isActive = activeSpeakerSessionId && activeSpeakerSessionId === node.participant.session_id;
                        return (
                            <Animated.View
                                key={node.participant.session_id}
                                style={[
                                    styles.participantTile,
                                    {
                                        left: node.x,
                                        top: node.y,
                                        width: node.size,
                                        height: node.size,
                                        borderRadius: node.size / 2,
                                        transform: [{ scale: isActive ? pulseAnim : 1 }]
                                    },
                                    isActive && styles.participantTileActive
                                ]}
                            >
                                <Avatar
                                    uri={node.participant?.userData?.photoURL || ''}
                                    name={node.participant?.user_name || 'Member'}
                                    size={node.size - 8}
                                />
                                <Text style={styles.participantName} numberOfLines={1}>
                                    {node.participant.local ? 'You' : (node.participant.user_name || 'Member')}
                                </Text>
                            </Animated.View>
                        );
                    })}

                    {participantsForUI.overflowCount > 0 && (
                        <View style={[styles.participantTile, styles.overflowTile, { left: 16, bottom: 16 }]}>
                            <Text style={styles.overflowText}>+{participantsForUI.overflowCount}</Text>
                        </View>
                    )}
                </View>

                <View style={[styles.controlsContainer, { paddingBottom: insets.bottom + 20 }]}>
                    <TouchableOpacity style={[styles.controlButton, isMuted && styles.controlButtonActive]} onPress={toggleMute}>
                        <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color={isMuted ? '#FFFFFF' : '#1E2A3D'} />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} onPress={toggleSpeaker}>
                        <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={24} color={isSpeakerOn ? '#FFFFFF' : '#1E2A3D'} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.endButton]}
                        onPress={() => leaveCall(isHost, true)}
                    >
                        <MaterialIcons name={isHost ? 'call-end' : 'logout'} size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.rosterCard}>
                    <Text style={styles.rosterTitle}>Participants</Text>
                    <ScrollView style={styles.rosterList} showsVerticalScrollIndicator={false}>
                        {rosterParticipants.map((member) => (
                            <View key={member.uid} style={styles.rosterItem}>
                                <View style={styles.rosterIdentity}>
                                    <Avatar uri={member.photoURL} name={member.name} size={32} />
                                    <Text style={styles.rosterName} numberOfLines={1}>{member.name}</Text>
                                </View>
                                <View style={[styles.rosterStatusPill, member.joined ? styles.rosterJoined : styles.rosterPending]}>
                                    <View style={[styles.rosterDot, member.joined ? styles.rosterDotJoined : styles.rosterDotPending]} />
                                    <Text style={[styles.rosterStatusText, member.joined ? styles.rosterStatusTextJoined : styles.rosterStatusTextPending]}>
                                        {member.joined ? 'Joined' : 'Not joined yet'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>
            </SafeAreaView>
        </ExpoLinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background
    },
    safeArea: {
        flex: 1
    },
    header: {
        height: 72,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTextWrap: {
        alignItems: 'center'
    },
    headerTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700'
    },
    headerSubtitle: {
        color: COLORS.gray,
        fontSize: 13,
        marginTop: 2
    },
    circleCanvas: {
        flex: 1,
        marginHorizontal: 8,
        position: 'relative'
    },
    connectingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(246,250,255,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20
    },
    connectingText: {
        color: COLORS.text,
        marginTop: 10,
        fontWeight: '600'
    },
    participantTile: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: '#C9D7EA',
        alignItems: 'center',
        justifyContent: 'center'
    },
    participantTileActive: {
        borderColor: '#4CD7A5',
        shadowColor: '#4CD7A5',
        shadowOpacity: 0.45,
        shadowRadius: 12
    },
    participantName: {
        marginTop: 6,
        color: COLORS.text,
        fontSize: 11,
        fontWeight: '600',
        maxWidth: 84,
        textAlign: 'center'
    },
    overflowTile: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFFFFF',
        borderColor: '#D3E1F2'
    },
    overflowText: {
        color: COLORS.text,
        fontWeight: '700'
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 22,
        paddingTop: 14
    },
    controlButton: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    controlButtonActive: {
        backgroundColor: COLORS.primary
    },
    endButton: {
        backgroundColor: COLORS.error
    },
    rosterCard: {
        marginHorizontal: 14,
        marginBottom: 10,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 8
    },
    rosterTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 8
    },
    rosterList: {
        maxHeight: 132
    },
    rosterItem: {
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    rosterIdentity: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 10
    },
    rosterName: {
        marginLeft: 8,
        color: COLORS.text,
        fontWeight: '600',
        flexShrink: 1
    },
    rosterStatusPill: {
        height: 24,
        paddingHorizontal: 10,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center'
    },
    rosterJoined: {
        backgroundColor: '#E7F7EF'
    },
    rosterPending: {
        backgroundColor: '#F2F4F7'
    },
    rosterDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 6
    },
    rosterDotJoined: {
        backgroundColor: COLORS.success
    },
    rosterDotPending: {
        backgroundColor: '#98A2B3'
    },
    rosterStatusText: {
        fontSize: 11,
        fontWeight: '700'
    },
    rosterStatusTextJoined: {
        color: '#1A7F4B'
    },
    rosterStatusTextPending: {
        color: '#667085'
    },
    errorScreen: {
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22
    },
    errorTitle: {
        color: COLORS.text,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10
    },
    errorSubtitle: {
        color: COLORS.gray,
        textAlign: 'center',
        marginBottom: 20
    },
    errorButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20
    },
    errorButtonText: {
        color: '#FFFFFF',
        fontWeight: '700'
    }
});

export default HuddleScreen;
