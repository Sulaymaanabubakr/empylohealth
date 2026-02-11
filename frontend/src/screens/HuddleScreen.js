import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Dimensions, PermissionsAndroid, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Daily from '@daily-co/react-native-daily-js';
import { COLORS } from '../theme/theme';
import { huddleService } from '../services/api/huddleService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';

const MAX_VISIBLE_PARTICIPANTS = 8;
const JOIN_TIMEOUT_MS = 20000;

const HuddleScreen = ({ navigation, route }) => {
    const { user, userData } = useAuth();
    const insets = useSafeAreaInsets();
    const callObjectRef = useRef(null);
    const hasStartedJoinRef = useRef(false);
    const isLeavingRef = useRef(false);
    const firstRemoteAudioLoggedRef = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const screenShownAtRef = useRef(Date.now());
    const metricsRef = useRef({
        tapTs: route?.params?.callTapTs || null,
        callableResolvedAt: null,
        joinStartedAt: null,
        joinedEventAt: null
    });

    const chat = route?.params?.chat || { id: route?.params?.chatId, name: 'Huddle', isGroup: true };
    const mode = route?.params?.mode || (route?.params?.huddleId ? 'join' : 'start');
    const [huddleId, setHuddleId] = useState(route?.params?.huddleId || null);
    const [phase, setPhase] = useState('connecting'); // connecting | joined | error | ended
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
            setIsHost(Boolean(local.owner));
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

    const leaveCall = useCallback(async (endForEveryone = false, navigateBack = true) => {
        if (isLeavingRef.current) return;
        isLeavingRef.current = true;

        const callObject = callObjectRef.current;
        const currentHuddleId = huddleId;
        callObjectRef.current = null;

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

        if (navigateBack) {
            navigation.goBack();
        }
    }, [huddleId, isHost, navigation]);

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

    useEffect(() => {
        const sub = AppState.addEventListener('change', (nextState) => {
            if (nextState !== 'active') {
                leaveCall(false, false);
            }
        });
        return () => sub.remove();
    }, [leaveCall]);

    useEffect(() => {
        return () => {
            leaveCall(false, false);
        };
    }, [leaveCall]);

    useEffect(() => {
        if (hasStartedJoinRef.current) return;
        hasStartedJoinRef.current = true;

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

            const callObject = Daily.createCallObject({
                startVideoOff: true,
                startAudioOff: false,
                subscribeToTracksAutomatically: true
            });
            callObjectRef.current = callObject;

            callObject.on('joined-meeting', () => {
                metricsRef.current.joinedEventAt = Date.now();
                if (metricsRef.current.joinStartedAt) {
                    logMetric('join_started_to_joined_event', metricsRef.current.joinedEventAt - metricsRef.current.joinStartedAt);
                }
                setPhase('joined');
                refreshParticipants();
                callObject.startRemoteParticipantsAudioLevelObserver(250).catch(() => {});
            });
            callObject.on('participant-joined', refreshParticipants);
            callObject.on('participant-updated', refreshParticipants);
            callObject.on('participant-left', refreshParticipants);
            callObject.on('active-speaker-change', (ev) => {
                setActiveSpeakerSessionId(ev?.activeSpeaker?.peerId || null);
            });
            callObject.on('track-started', (ev) => {
                const isFirstRemoteAudio = ev?.type === 'audio' && ev?.participant && !ev.participant.local && !firstRemoteAudioLoggedRef.current;
                if (isFirstRemoteAudio) {
                    firstRemoteAudioLoggedRef.current = true;
                    if (metricsRef.current.joinedEventAt) {
                        logMetric('joined_event_to_first_remote_audio', Date.now() - metricsRef.current.joinedEventAt);
                    }
                }
            });
            callObject.on('error', () => {
                setPhase('error');
                setErrorMessage('Call error. Please try again.');
            });

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
                await Promise.race([
                    callObject.join(joinOptions),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('join-timeout')), JOIN_TIMEOUT_MS))
                ]);

                callObject.setLocalVideo(false);
                callObject.setNativeInCallAudioMode('video');
                setIsSpeakerOn(true);
                refreshParticipants();
            } catch (error) {
                console.error('Huddle join failed', error);
                setPhase('error');
                setErrorMessage('Unable to connect huddle. Please try again.');
            }
        };

        start();
    }, [chat.id, chat.isGroup, huddleId, logMetric, mode, refreshParticipants, requestMicPermission, route?.params?.huddleId, user?.displayName, userData?.name]);

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

    const statusText = phase === 'joined' ? formatTime(seconds) : phase === 'error' ? 'Connection failed' : 'Connecting...';

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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#111111" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => leaveCall(false, true)}>
                        <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
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
                    {phase !== 'joined' && (
                        <View style={styles.connectingOverlay}>
                            <ActivityIndicator size="large" color="#FFFFFF" />
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
                        <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.controlButton, isSpeakerOn && styles.controlButtonActive]} onPress={toggleSpeaker}>
                        <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-mute'} size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.controlButton, styles.endButton]}
                        onPress={() => leaveCall(isHost, true)}
                    >
                        <MaterialIcons name={isHost ? 'call-end' : 'logout'} size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111'
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
        backgroundColor: 'rgba(255,255,255,0.12)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTextWrap: {
        alignItems: 'center'
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700'
    },
    headerSubtitle: {
        color: '#D0D0D0',
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
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20
    },
    connectingText: {
        color: '#FFFFFF',
        marginTop: 10,
        fontWeight: '600'
    },
    participantTile: {
        position: 'absolute',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.18)',
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
        color: '#F4F4F4',
        fontSize: 11,
        fontWeight: '600',
        maxWidth: 84,
        textAlign: 'center'
    },
    overflowTile: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderColor: 'rgba(255,255,255,0.2)'
    },
    overflowText: {
        color: '#FFFFFF',
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
        backgroundColor: 'rgba(255,255,255,0.14)'
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
