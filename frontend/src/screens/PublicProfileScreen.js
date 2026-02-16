import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Avatar from '../components/Avatar';
import { chatService } from '../services/api/chatService';
import { callableClient } from '../services/api/callableClient';
import { presenceRepository } from '../services/repositories/PresenceRepository';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { COLORS, SPACING } from '../theme/theme';

const labelFromScore = (score) => {
    const n = Number(score);
    if (Number.isNaN(n)) return 'No data';
    if (n >= 80) return 'Thriving';
    if (n >= 60) return 'Doing Well';
    if (n >= 40) return 'Okay';
    if (n >= 20) return 'Struggling';
    return 'Needs Attention';
};

const ringColorFromProfile = (profile = {}) => {
    const rawScore = profile?.wellbeingScore;
    const score = typeof rawScore === 'number'
        ? rawScore
        : (typeof rawScore === 'string' ? Number(String(rawScore).replace('%', '').trim()) : NaN);
    const label = String(profile?.wellbeingLabel || profile?.wellbeingStatus || '').toLowerCase();

    if (label.includes('struggl') || label.includes('attention')) return '#C62828';
    if (label.includes('good') || label.includes('well') || label.includes('thriv')) return '#2E7D32';
    if (Number.isFinite(score)) return score >= 70 ? '#2E7D32' : '#C62828';
    return '#BDBDBD';
};

const fmtDate = (value) => {
    if (!value) return 'Unknown';
    try {
        if (typeof value?.toDate === 'function') {
            return value.toDate().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
        }
        if (typeof value === 'object' && (value?.seconds || value?._seconds)) {
            const seconds = Number(value?.seconds || value?._seconds || 0);
            const nanos = Number(value?.nanoseconds || value?._nanoseconds || 0);
            const d = new Date((seconds * 1000) + Math.floor(nanos / 1e6));
            if (!Number.isNaN(d.getTime())) {
                return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
            }
        }
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return 'Unknown';
        return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
        return 'Unknown';
    }
};

const PublicProfileScreen = ({ navigation, route }) => {
    const uid = route?.params?.uid;
    const { user } = useAuth();
    const { showModal } = useModal();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [presence, setPresence] = useState({ state: 'offline', lastChanged: null });

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!uid) {
                setLoading(false);
                return;
            }

            try {
                const data = await callableClient.invokeWithAuth('getPublicProfile', { uid });
                if (!mounted) return;
                if (!data?.uid) {
                    setProfile(null);
                    return;
                }
                setProfile({
                    uid: data.uid,
                    name: data?.name || data?.displayName || data?.fullName || 'Member',
                    photoURL: data?.photoURL || '',
                    bio: data?.bio || data?.about || data?.aboutMe || 'No bio available yet.',
                    wellbeingScore: data?.wellbeingScore ?? null,
                    wellbeingLabel: data?.wellbeingLabel || data?.wellbeingStatus || labelFromScore(data?.wellbeingScore),
                    streak: Number(data?.streak || 0),
                    role: data?.role || 'personal',
                    location: data?.location || data?.city || data?.country || '',
                    gender: data?.gender || data?.sex || '',
                    createdAt: data?.createdAt || null,
                    circlesCount: Number(data?.circlesCount || 0)
                });
            } catch {
                if (mounted) {
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [uid]);

    useEffect(() => {
        if (!uid) return undefined;
        return presenceRepository.subscribeToPresence(uid, (state) => {
            setPresence(state || { state: 'offline', lastChanged: null });
        });
    }, [uid]);

    const handleMessage = async () => {
        if (!profile?.uid || profile.uid === user?.uid) return;
        try {
            const result = await chatService.createDirectChat(profile.uid);
            navigation.navigate('ChatDetail', {
                chat: {
                    id: result?.chatId,
                    name: profile.name,
                    avatar: profile.photoURL || '',
                    isGroup: false,
                    participants: [user?.uid, profile.uid]
                }
            });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Unable to open chat right now.' });
        }
    };

    const handleCall = async () => {
        if (!profile?.uid || profile.uid === user?.uid) return;
        try {
            const result = await chatService.createDirectChat(profile.uid);
            navigation.navigate('Huddle', {
                chat: {
                    id: result?.chatId,
                    name: profile.name,
                    avatar: profile.photoURL || '',
                    isGroup: false,
                    participants: [user?.uid, profile.uid]
                },
                mode: 'start',
                callTapTs: Date.now()
            });
        } catch (error) {
            showModal({ type: 'error', title: 'Error', message: 'Unable to start call right now.' });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F9FB" />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : !profile ? (
                <View style={styles.centerState}>
                    <Text style={styles.emptyText}>Profile not available.</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <LinearGradient colors={[COLORS.primary, '#00C9B1']} style={styles.heroCard}>
                        <View style={[styles.heroAvatarRing, { borderColor: ringColorFromProfile(profile) }]}>
                            <Avatar uri={profile.photoURL} name={profile.name} size={88} />
                        </View>
                        <Text style={styles.name}>{profile.name}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.presenceDot, presence?.state === 'online' ? styles.presenceOnline : styles.presenceOffline]} />
                            <Text style={styles.statusText}>{presence?.state === 'online' ? 'Online' : 'Offline'}</Text>
                        </View>
                        <Text style={styles.scoreLine}>{profile.wellbeingLabel}</Text>
                    </LinearGradient>

                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Wellbeing</Text>
                            <Text style={styles.metricValue}>
                                {typeof profile.wellbeingScore === 'number' ? Math.round(profile.wellbeingScore) : '—'}
                            </Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Streak</Text>
                            <Text style={styles.metricValue}>{profile.streak || 0} days</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Circles</Text>
                            <Text style={styles.metricValue}>{profile.circlesCount || 0}</Text>
                        </View>
                        <View style={styles.metricCard}>
                            <Text style={styles.metricLabel}>Role</Text>
                            <Text style={styles.metricValue}>{String(profile.role || 'member')}</Text>
                        </View>
                    </View>

                    <View style={styles.bioCard}>
                        <Text style={styles.bioTitle}>Profile Details</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailKey}>Joined</Text>
                            <Text style={styles.detailValue}>{fmtDate(profile.createdAt)}</Text>
                        </View>
                        {profile.location ? (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailKey}>Location</Text>
                                <Text style={styles.detailValue}>{profile.location}</Text>
                            </View>
                        ) : null}
                        {profile.gender ? (
                            <View style={styles.detailRow}>
                                <Text style={styles.detailKey}>Gender</Text>
                                <Text style={styles.detailValue}>{profile.gender}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.bioCard}>
                        <Text style={styles.bioTitle}>About</Text>
                        <Text style={styles.bio}>{profile.bio}</Text>
                    </View>

                    {profile.uid !== user?.uid && (
                        <View style={styles.actions}>
                            <TouchableOpacity style={[styles.actionBtn, styles.primaryBtn]} onPress={handleMessage}>
                                <Text style={styles.primaryBtnText}>Message</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={handleCall}>
                                <Text style={styles.secondaryBtnText}>Call</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FB'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.sm
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    headerTitle: {
        fontSize: 16,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: '#1A1A1A'
    },
    centerState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24
    },
    emptyText: {
        color: '#6A7385',
        fontSize: 15
    },
    content: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.xl
    },
    heroCard: {
        borderRadius: 20,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8
    },
    heroAvatarRing: {
        borderWidth: 3,
        borderRadius: 48,
        padding: 2
    },
    name: {
        marginTop: 14,
        fontSize: 24,
        fontFamily: 'SpaceGrotesk_700Bold',
        color: '#FFFFFF'
    },
    score: {
        marginTop: 8,
        fontSize: 14,
        color: '#E8FFFB',
        fontWeight: '700'
    },
    statusRow: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    presenceDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5
    },
    presenceOnline: {
        backgroundColor: '#22C55E'
    },
    presenceOffline: {
        backgroundColor: '#9CA3AF'
    },
    statusText: {
        color: '#E8FFFB',
        fontWeight: '700'
    },
    scoreLine: {
        marginTop: 6,
        color: '#E8FFFB',
        fontWeight: '700'
    },
    metricsGrid: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10
    },
    metricCard: {
        width: '48%',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E9ECEF',
        padding: 14
    },
    metricLabel: {
        fontSize: 12,
        color: '#6A7385',
        fontFamily: 'DMSans_500Medium'
    },
    metricValue: {
        marginTop: 6,
        fontSize: 16,
        color: '#1A1A1A',
        fontFamily: 'SpaceGrotesk_700Bold'
    },
    bioCard: {
        marginTop: 14,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E9ECEF'
    },
    bioTitle: {
        fontFamily: 'SpaceGrotesk_600SemiBold',
        fontSize: 16,
        color: '#1A1A1A',
        marginBottom: 8
    },
    bio: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4A5565',
        fontFamily: 'DMSans_400Regular'
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6
    },
    detailKey: {
        color: '#6A7385',
        fontSize: 13,
        fontFamily: 'DMSans_500Medium'
    },
    detailValue: {
        color: '#1A1A1A',
        fontSize: 13,
        fontFamily: 'DMSans_500Medium',
        maxWidth: '62%',
        textAlign: 'right'
    },
    actions: {
        width: '100%',
        marginTop: 18,
        gap: 10
    },
    actionBtn: {
        width: '100%',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center'
    },
    primaryBtn: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 5
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontFamily: 'SpaceGrotesk_700Bold'
    },
    secondaryBtn: {
        backgroundColor: '#E9F7F6'
    },
    secondaryBtnText: {
        color: COLORS.primary,
        fontFamily: 'SpaceGrotesk_700Bold'
    }
});

export default PublicProfileScreen;
