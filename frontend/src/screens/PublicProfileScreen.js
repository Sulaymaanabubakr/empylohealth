import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';
import Avatar from '../components/Avatar';
import { db } from '../services/firebaseConfig';
import { chatService } from '../services/api/chatService';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { COLORS, SPACING } from '../theme/theme';

const PublicProfileScreen = ({ navigation, route }) => {
    const uid = route?.params?.uid;
    const { user } = useAuth();
    const { showModal } = useModal();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            if (!uid) {
                setLoading(false);
                return;
            }

            try {
                const snap = await getDoc(doc(db, 'users', uid));
                if (!mounted) return;
                if (!snap.exists()) {
                    setProfile(null);
                    return;
                }
                const data = snap.data();
                setProfile({
                    uid,
                    name: data?.name || data?.displayName || 'Member',
                    photoURL: data?.photoURL || '',
                    bio: data?.bio || data?.about || 'No bio available yet.',
                    wellbeingScore: data?.wellbeingScore ?? null
                });
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
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
                        <Avatar uri={profile.photoURL} name={profile.name} size={88} />
                        <Text style={styles.name}>{profile.name}</Text>
                        {typeof profile.wellbeingScore === 'number' && (
                            <Text style={styles.score}>Wellbeing Score: {profile.wellbeingScore}</Text>
                        )}
                    </LinearGradient>

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
