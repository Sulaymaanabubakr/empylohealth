import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Dimensions, PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Daily from '@daily-co/react-native-daily-js';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import { huddleService } from '../services/api/huddleService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

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
    const [phase, setPhase] = useState('connecting'); // connecting | ringing | joined | error | ended
    const [errorMessage, setErrorMessage] = useState('');
    const [participants, setParticipants] = useState([]);
    const [activeSpeakerSessionId, setActiveSpeakerSessionId] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isHost, setIsHost] = useState(mode === 'start');
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

        const handlers = {
            'joined-meeting': () => {
                metricsRef.current.joinedEventAt = Date.now();
                if (metricsRef.current.joinStartedAt) {
                    logMetric('join_started_to_joined_event', metricsRef.current.joinedEventAt - metricsRef.current.joinStartedAt);
                }
                setPhase('joined');
                refreshParticipants();
                callObject.startRemoteParticipantsAudioLevelObserver(250).catch(() => {});
            },
            'participant-joined': () => refreshParticipants(),
            'participant-updated': () => refreshParticipants(),
            'participant-left': () => refreshParticipants(),
            'active-speaker-change': (ev) => {
                setActiveSpeakerSessionId(ev?.activeSpeaker?.peerId || null);
            },
            'track-started': (ev) => {
                const isFirstRemoteAudio = ev?.type === 'audio' && ev?.participant && !ev.participant.local && !firstRemoteAudioLoggedRef.current;
                if (isFirstRemoteAudio) {
                    firstRemoteAudioLoggedRef.current = true;
                    if (metricsRef.current.joinedEventAt) {
                        logMetric('joined_event_to_first_remote_audio', Date.now() - metricsRef.current.joinedEventAt);
                    }
                }
            },
            error: () => {
                stopRingbackTone();
                setPhase('error');
                setErrorMessage('Call error. Please try again.');
            }
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
        setPhase('ended');

        const callObject = callObjectRef.current;
        const currentHuddleId = huddleId;
        callObjectRef.current = null;
        detachCallHandlers();

        if (clearLocalSession) {
            huddleService.clearActiveLocalSession();
        }

        if (navigateBack) {
            navigation.goBack();
        }

        // Clean up async in background so UI doesn't feel stuck on hangup.
        (async () => {
            await stopRingbackTone();

            if (callObject) {
                await safeCall(() => callObject.stopRemoteParticipantsAudioLevelObserver());
                await safeCall(() => callObject.leave());
                await safeCall(() => callObject.destroy());
            }

            if (currentHuddleId) {
                if (endForEveryone && isHost) {
                    await safeCall(() => huddleService.endHuddle(currentHuddleId));
                } else {
                    await safeCall(() => huddleService.updateHuddleState(currentHuddleId, 'leave'));
                }
            }
        })();
    }, [detachCallHandlers, huddleId, isHost, navigation, stopRingbackTone]);

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

    useEffect(() => {
        if (hasStartedJoinRef.current) return;
        hasStartedJoinRef.current = true;
        joinFlowCancelledRef.current = false;

        const start = async () => {
            setPhase('connecting');
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

            const callObject = Daily.createCallObject({
                startVideoOff: true,
                startAudioOff: false,
                subscribeToTracksAutomatically: true
            });
            callObjectRef.current = callObject;
            attachCallHandlers(callObject);

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
                if (hostStatus) {
                    // Show ringing immediately for caller while connection/join settles.
                    setPhase('ringing');
                }
                if (joinFlowCancelledRef.current || isLeavingRef.current || callObjectRef.current !== callObject) {
                    return;
                }
                const joinOptions = {
                    url: huddleSession?.roomUrl,
                    token: huddleSession?.token,
                    userName: userData?.name || user?.displayName || 'Member',
                    startVideoOff: true,
                    startAudioOff: false
                };

                metricsRef.current.joinStartedAt = Date.now();
                if (metricsRef.current.callableResolvedAt) {
                    logMetric('callable_resolved_to_join_started', metricsRef.current.joinStartedAt - metricsRef.current.callableResolvedAt);
                }
                let joinAttempt = 0;
                while (joinAttempt < JOIN_MAX_ATTEMPTS) {
                    joinAttempt += 1;
                    try {
                        await Promise.race([
                            callObject.join(joinOptions),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('join-timeout')), JOIN_TIMEOUT_MS))
                        ]);
                        break;
                    } catch (joinError) {
                        const isTimeout = String(joinError?.message || '').toLowerCase().includes('join-timeout');
                        const shouldRetry = isTimeout && joinAttempt < JOIN_MAX_ATTEMPTS;
                        if (!shouldRetry) {
                            throw joinError;
                        }
                        console.warn(`[HUDDLE] join attempt ${joinAttempt} timed out. Retrying...`);
                    }
                }
                if (joinFlowCancelledRef.current || isLeavingRef.current || callObjectRef.current !== callObject) {
                    return;
                }

                callObject.setLocalVideo(false);
                callObject.setNativeInCallAudioMode('video');
                setIsSpeakerOn(true);
                refreshParticipants();
                huddleService.setActiveLocalSession({
                    chatId: chat.id,
                    huddleId: resolvedHuddleId,
                    chatName: chat?.name || 'Huddle',
                    startedBy: resolvedHostUid,
                    isHost: Boolean(hostStatus),
                    callObject
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
            huddleService.ringHuddleParticipants(huddleId).catch(() => {});
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
            huddleService.updateHuddleState(huddleId, next ? 'mute' : 'unmute').catch(() => {});
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

    const statusText = phase === 'ringing'
        ? 'Ringing...'
        : phase === 'joined'
        ? (isHost && remoteParticipantCount === 0 ? 'Ringing...' : formatTime(seconds))
        : phase === 'error'
            ? 'Connection failed'
            : 'Connecting...';

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
        <ExpoLinearGradient colors={['#F6FAFF', '#EEF5FF']} style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F6FAFF" />
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
            </SafeAreaView>
        </ExpoLinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6FAFF'
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
        borderColor: '#DCE6F3',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTextWrap: {
        alignItems: 'center'
    },
    headerTitle: {
        color: '#1E2A3D',
        fontSize: 18,
        fontWeight: '700'
    },
    headerSubtitle: {
        color: '#5D6B82',
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
        color: '#1E2A3D',
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
        color: '#1E2A3D',
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
        color: '#1E2A3D',
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
        borderColor: '#D3E1F2'
    },
    controlButtonActive: {
        backgroundColor: COLORS.primary
    },
    endButton: {
        backgroundColor: '#E53935'
    },
    errorScreen: {
        flex: 1,
        backgroundColor: '#111111',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 22
    },
    errorTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 10
    },
    errorSubtitle: {
        color: '#D0D0D0',
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
