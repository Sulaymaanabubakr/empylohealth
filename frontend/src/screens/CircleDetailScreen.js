import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Share, Dimensions, ImageBackground, ActivityIndicator, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import Avatar from '../components/Avatar';
import { circleService } from '../services/api/circleService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CircleDetailScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const initialCircle = route.params?.circle;
    const circleId = initialCircle?.id;
    const insets = useSafeAreaInsets();
    const { showModal } = useModal();

    const [circle, setCircle] = useState(initialCircle);
    const [memberProfiles, setMemberProfiles] = useState([]);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isMember, setIsMember] = useState(false);
    const [role, setRole] = useState(null); // 'creator' | 'admin' | 'moderator' | 'member' | null
    const [requestStatus, setRequestStatus] = useState('none'); // 'none' | 'pending'
    const [events, setEvents] = useState([]);
    const [showAllMembers, setShowAllMembers] = useState(false);

    // Refresh circle data locally to keep member list updated
    const refreshCircle = async () => {
        if (!circleId) return;
        try {
            const updated = await circleService.getCircleById(circleId);
            if (updated) {
                setCircle(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        refreshCircle();
    }, [circleId]);

    useEffect(() => {
        if (!circleId) return undefined;
        const circleRef = doc(db, 'circles', circleId);
        const unsubscribeCircle = onSnapshot(circleRef, (snap) => {
            if (snap.exists()) {
                setCircle({ id: snap.id, ...snap.data() });
            }
        }, (error) => {
            console.error('Failed to subscribe to circle updates', error);
        });

        return () => unsubscribeCircle();
    }, [circleId]);

    useEffect(() => {
        if (!circleId || !user) return;

        // 1. Subscribe to Real-time Role (Subcollection)
        const unsubscribe = circleService.subscribeToCircleMember(circleId, user.uid, (member) => {
            if (member) {
                // Check for pending status
                if (member.status === 'pending' || member.role === 'pending') {
                    setRequestStatus('pending');
                    setIsMember(false);
                    setRole(null);
                } else {
                    setRole(member.role || 'member');
                    setIsMember(true);
                    setRequestStatus('none');

                    // Sync local membership check logic
                    if (!circle.members?.includes(user.uid)) {
                        refreshCircle(); // Force refresh if array is out of sync
                    }
                }
            } else {
                setRole(null);
                setIsMember(false);
                // Don't auto-reset requestStatus here if it was set by local storage check? 
                // Actually, if member doc doesn't exist, they definitely aren't pending (unless pending requests are stored elsewhere).
                // But let's verify if pending requests are in 'members' collection or 'requests' collection.
                // If they are in 'requests', this subscription won't find them.
                // But usually for simplicity they are in members with status='pending'.
                // If not, we rely on AsyncStorage as fallback.
            }
        });

        // 2. Load Public Profiles
        const loadMembers = async () => {
            // ... (keep existing loadMembers logic short for brevity, just hook placement)
            if (!Array.isArray(circle.members) || circle.members.length === 0) {
                setMemberProfiles([]);
                return;
            }
            try {
                const docs = await Promise.all(
                    circle.members.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        const memberDoc = await getDoc(doc(db, 'circles', circle.id, 'members', uid));
                        const data = userDoc.exists() ? userDoc.data() : {};
                        const memberData = memberDoc.exists() ? memberDoc.data() : {};
                        const memberRole = memberData?.role || (uid === circle.adminId ? 'admin' : 'member');
                        return {
                            id: uid,
                            name: data?.name || data?.displayName || 'Member',
                            image: data?.photoURL || '',
                            role: memberRole,
                            status: uid === user?.uid ? 'online' : 'offline',
                            score: data?.wellbeingScore || 0
                        };
                    })
                );
                setMemberProfiles(docs);
            } catch (error) {
                setMemberProfiles([]);
            }
        };
        loadMembers();

        // 3. Subscribe to Scheduled Huddles
        const unsubscribeEvents = circleService.subscribeToScheduledHuddles(circleId, (list) => {
            setEvents(list);
        });

        return () => {
            unsubscribe();
            unsubscribeEvents();
        };
    }, [circleId, circle?.members, circle?.adminId, user?.uid]);

    useEffect(() => {
        checkPendingStatus();
    }, [circleId]);

    const checkPendingStatus = async () => {
        try {
            if (!circle?.id) return;
            const status = await AsyncStorage.getItem(`pending_request_${circle.id}`);
            if (status === 'true') {
                setRequestStatus('pending');
            }
        } catch (e) {
            console.log(e);
        }
    };

    const handleJoinCircle = async () => {
        if (!circle?.id) return;
        try {
            setIsJoining(true);
            const result = await circleService.joinCircle(circle.id);

            if (result.status === 'pending') {
                setRequestStatus('pending');
                await AsyncStorage.setItem(`pending_request_${circle.id}`, 'true');
                showModal({ type: 'success', title: 'Request Sent', message: result.message || "Your request to join is pending approval." });
            } else {
                // Success: Listener will update state
                // Clear pending status if it existed
                await AsyncStorage.removeItem(`pending_request_${circle.id}`);
                await refreshCircle();
                showModal({
                    type: 'success',
                    title: 'Welcome!',
                    message: `You have successfully joined ${circle.name}.`,
                    confirmText: "Let's Go!"
                });
            }
        } catch (error) {
            console.error('Failed to join circle', error);
            showModal({ type: 'error', title: 'Error', message: 'Failed to join circle. Please try again.' });
        } finally {
            setIsJoining(false);
        }
    };

    const handleLeaveCircle = async () => {
        if (!circle?.id) {
            navigation.goBack();
            return;
        }

        if (circle.adminId === user?.uid) {
            showModal({
                type: 'error',
                title: 'Creator Restriction',
                message: 'Creators must transfer ownership before leaving.'
            });
            return;
        }

        showModal({
            type: 'confirmation',
            title: 'Leave Circle',
            message: 'Are you sure you want to leave this Circle?',
            confirmText: 'Leave',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    setIsLeaving(true);
                    await circleService.leaveCircle(circle.id);
                    navigation.goBack();
                } catch (error) {
                    console.error('Failed to leave circle', error);
                } finally {
                    setIsLeaving(false);
                }
            }
        });
    };

    const handleInvite = async () => {
        try {
            await Share.share({
                message: `Join my circle "${circle.name}" on Empylo! Use code: ${circle.id}`,
            });
        } catch (error) {
            console.error('Error sharing', error);
        }
    };

    if (!circle) {
        return (
            <View style={styles.container}>
                <SafeAreaView edges={['top']}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonSimple}>
                        <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyStateText}>Circle details unavailable.</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // Helper component for stats
    const StatsRow = () => (
        <View style={styles.statsRow}>
            <View style={styles.statItem}>
                <Ionicons name="people" size={20} color={COLORS.primary} />
                <Text style={styles.statValue}>{memberProfiles.length}</Text>
                <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Ionicons name="chatbubbles" size={20} color="#FF9800" />
                <Text style={styles.statValue}>{circle.activityLevel || 'Active'}</Text>
                <Text style={styles.statLabel}>Activity</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
                <Ionicons name="globe-outline" size={20} color="#2196F3" />
                <Text style={styles.statValue}>{circle.type === 'private' ? 'Private' : 'Public'}</Text>
                <Text style={styles.statLabel}>Circle Access</Text>
            </View>
        </View>
    );

    const hasActiveHuddle = Boolean(circle.activeHuddle?.isActive !== false && circle.activeHuddle?.roomUrl);
    const canStartHuddle = ['creator', 'admin', 'moderator'].includes(role);
    const canSeeHuddleAction = hasActiveHuddle || canStartHuddle;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <ScrollView contentContainerStyle={{ paddingBottom: isMember ? 40 : 120 }} showsVerticalScrollIndicator={false}>

                {/* Visual Header */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={[COLORS.primary, '#00897B']}
                        style={styles.headerBackground}
                    >
                        <MaterialCommunityIcons name="account-group-outline" size={120} color="rgba(255,255,255,0.1)" style={styles.headerPatternIcon} />
                    </LinearGradient>

                    <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
                        <View style={styles.headerNav}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                                <Ionicons name="arrow-back" size={24} color="#FFF" />
                            </TouchableOpacity>
                            {(role === 'admin' || role === 'creator') && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('CircleSettings', { circleId: circle.id })}
                                    style={styles.iconButton}
                                >
                                    <Ionicons name="settings-outline" size={24} color="#FFF" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.headerContent}>
                            <View style={[styles.circleIconLarge, circle.image && { overflow: 'hidden', padding: 0 }]}>
                                {circle.image ? (
                                    <Image source={{ uri: circle.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                                ) : (
                                    <Text style={styles.circleEmoji}>{circle.icon || '👥'}</Text>
                                )}
                            </View>
                            <Text style={styles.circleTitle}>{circle.name}</Text>
                            <Text style={styles.circleCategory}>{circle.category || 'General'}</Text>
                        </View>
                    </SafeAreaView>
                </View>

                {/* Main Content Card */}
                <View style={styles.contentCard}>

                    <View style={{ marginTop: -40, marginBottom: 24 }}>
                        <StatsRow />
                    </View>

                    {/* Action Bar - MEMBERS ONLY */}
                    {isMember && (
                        <>
                            <View style={styles.actionBar}>
                                <TouchableOpacity style={styles.actionItem} onPress={handleInvite}>
                                    <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2F1' }]}>
                                        <Ionicons name="person-add" size={22} color={COLORS.primary} />
                                    </View>
                                    <Text style={styles.actionLabel}>Invite</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.actionItem}
                                    onPress={() => {
                                        if (circle.chatId) {
                                            navigation.navigate('ChatDetail', {
                                                chat: {
                                                    id: circle.chatId,
                                                    name: circle.name,
                                                    isGroup: true,
                                                    circleId: circle.id // Pass circleId for reporting context
                                                }
                                            });
                                        } else {
                                            showModal({ type: 'info', title: 'Chat unavailable', message: 'This circle does not have a chat yet.' });
                                        }
                                    }}
                                >
                                    <View style={[styles.actionIconCircle, { backgroundColor: '#E3F2FD' }]}>
                                        <Ionicons name="chatbubble" size={22} color="#1E88E5" />
                                    </View>
                                    <Text style={styles.actionLabel}>Chat</Text>
                                </TouchableOpacity>

                                {canSeeHuddleAction && (
                                    <TouchableOpacity
                                        style={styles.actionItem}
                                        onPress={async () => {
                                            if (!circle.chatId) {
                                                showModal({ type: 'info', title: 'Huddle unavailable', message: 'This circle does not have a chat yet.' });
                                                return;
                                            }

                                            if (hasActiveHuddle) {
                                                navigation.navigate('Huddle', {
                                                    chat: { id: circle.chatId, name: circle.name, isGroup: true },
                                                    huddleId: circle.activeHuddle.huddleId,
                                                    mode: 'join',
                                                    callTapTs: Date.now()
                                                });
                                                return;
                                            }

                                            if (!canStartHuddle) {
                                                return;
                                            }

                                            navigation.navigate('Huddle', {
                                                chat: { id: circle.chatId, name: circle.name, isGroup: true },
                                                mode: 'start',
                                                callTapTs: Date.now()
                                            });
                                        }}
                                    >
                                        <View style={[
                                            styles.actionIconCircle,
                                            { backgroundColor: hasActiveHuddle ? '#E8F5E9' : '#F3E5F5' }
                                        ]}>
                                            <Ionicons
                                                name={hasActiveHuddle ? "videocam" : "videocam-outline"}
                                                size={22}
                                                color={hasActiveHuddle ? "#4CAF50" : "#8E24AA"}
                                            />
                                        </View>
                                        <Text style={[
                                            styles.actionLabel,
                                            hasActiveHuddle && { color: '#4CAF50', fontWeight: '700' }
                                        ]}>
                                            {hasActiveHuddle ? 'Join Huddle' : 'Start Huddle'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={styles.divider} />
                        </>
                    )}

                    {/* About Section */}
                    {circle.description && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.sectionTitle}>About</Text>
                                </View>
                            </View>
                            <Text style={styles.descriptionText}>{circle.description}</Text>
                        </View>
                    )}

                    {/* Scheduled Events Section */}
                    {events.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="calendar-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                    <Text style={styles.sectionTitle}>Upcoming Huddles</Text>
                                </View>
                            </View>
                            {events.map((event) => (
                                <View key={event.id} style={styles.eventCard}>
                                    <View style={styles.eventDateBox}>
                                        <Text style={styles.eventMonth}>
                                            {event.scheduledAt?.toDate ? event.scheduledAt.toDate().toLocaleString('default', { month: 'short' }) : new Date(event.scheduledAt).toLocaleString('default', { month: 'short' })}
                                        </Text>
                                        <Text style={styles.eventDay}>
                                            {event.scheduledAt?.toDate ? event.scheduledAt.toDate().getDate() : new Date(event.scheduledAt).getDate()}
                                        </Text>
                                    </View>
                                    <View style={styles.eventInfo}>
                                        <Text style={styles.eventTitle}>{event.title}</Text>
                                        <Text style={styles.eventTime}>
                                            {event.scheduledAt?.toDate ? event.scheduledAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(event.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                    <TouchableOpacity style={styles.remindBtn} onPress={() => showModal({ type: 'success', title: 'Reminder', message: 'Added to your calendar (Demo)' })}>
                                        <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Members Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="people-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                                <Text style={styles.sectionTitle}>Members ({memberProfiles.length})</Text>
                            </View>
                            {isMember && memberProfiles.length > 5 && (
                                <TouchableOpacity onPress={() => setShowAllMembers((prev) => !prev)}>
                                    <Text style={styles.seeAllText}>{showAllMembers ? 'Show Less' : 'See All'}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.membersGrid}>
                            {memberProfiles.length === 0 && (
                                <Text style={styles.emptyMembersText}>No members visible.</Text>
                            )}
                            {memberProfiles
                                .slice(0, isMember ? (showAllMembers ? undefined : 5) : 5)
                                .map((member) => (
                                <View key={member.id} style={styles.memberRow}>
                                    <Avatar uri={member.image} name={member.name} size={48} />
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.name}</Text>
                                        <Text style={styles.memberStatus}>
                                            {member.role === 'creator'
                                                ? 'Creator'
                                                : member.role === 'moderator'
                                                    ? 'Moderator'
                                                    : member.role === 'admin'
                                                        ? 'Admin'
                                                        : 'Member'}
                                        </Text>
                                    </View>
                                    {isMember && (
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: member.status === 'online' ? '#E8F5E9' : '#F5F5F5' }
                                        ]}>
                                            <View style={[
                                                styles.statusDot,
                                                { backgroundColor: member.status === 'online' ? '#4CAF50' : '#BDBDBD' }
                                            ]} />
                                            <Text style={[
                                                styles.statusText,
                                                { color: member.status === 'online' ? '#4CAF50' : '#9E9E9E' }
                                            ]}>
                                                {member.status === 'online' ? 'Online' : 'Offline'}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                ))}
                            {!isMember && memberProfiles.length > 5 && (
                                <Text style={styles.moreMembersText}>+ {(memberProfiles.length - 5)} more members</Text>
                            )}
                        </View>
                    </View>

                    {/* Leave Circle Button (moved from header) */}
                    {isMember && (
                        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveCircle}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="log-out-outline" size={20} color="#FF5252" style={{ marginRight: 8 }} />
                                <Text style={styles.leaveButtonText}>Leave Circle</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                </View>
            </ScrollView>

            {/* Sticky Join Footer for Non-Members */}
            {!isMember && requestStatus !== 'pending' && (
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 10 }]}>
                    <TouchableOpacity
                        style={styles.joinButtonLarge}
                        onPress={handleJoinCircle}
                        disabled={isJoining}
                        activeOpacity={0.9}
                    >
                        {isJoining ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.joinButtonTextLarge}>
                                    {circle.type === 'private' ? 'Request to Join' : `Join ${circle.name}`}
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                    <Text style={styles.joinButtonSubtext}>Join the conversation and connect with others!</Text>
                </View>
            )}

            {/* Sticky Pending Status */}
            {requestStatus === 'pending' && (
                <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 10 }]}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFF8E1', // Light yellow button background
                        paddingVertical: 18,
                        paddingHorizontal: 32,
                        borderRadius: 32,
                        width: '100%',
                    }}>
                        <Ionicons name="time-outline" size={24} color="#F57F17" style={{ marginRight: 8 }} />
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#F57F17' }}>Request Pending</Text>
                    </View>
                    <Text style={styles.joinButtonSubtext}>Admins are reviewing your request.</Text>
                </View>
            )}


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerContainer: {
        height: 280,
        backgroundColor: COLORS.primary,
        position: 'relative',
    },
    headerBackground: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    headerPatternIcon: {
        opacity: 0.15,
        transform: [{ rotate: '-15deg' }, { scale: 1.5 }],
    },
    headerSafeArea: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        alignItems: 'center',
        marginBottom: 20,
    },
    circleIconLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    circleEmoji: {
        fontSize: 40,
    },
    circleTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 6,
        textAlign: 'center',
    },
    circleCategory: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    contentCard: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 40,
        minHeight: 500,
    },
    actionBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 32,
    },
    actionItem: {
        alignItems: 'center',
    },
    actionIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#424242',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 32,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 15,
        lineHeight: 24,
        color: '#616161',
    },
    seeAllText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    membersGrid: {
        marginTop: 8,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#FFF',
    },
    memberInfo: {
        flex: 1,
        marginLeft: 16,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    memberStatus: {
        fontSize: 13,
        color: '#9E9E9E',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    moreMembersText: {
        textAlign: 'center',
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 8,
        fontSize: 14,
    },
    backButtonSimple: {
        marginLeft: 20,
        marginTop: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        marginTop: 100,
        alignItems: 'center',
    },
    emptyStateText: {
        color: '#9E9E9E',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyMembersText: {
        color: '#BDBDBD',
        fontStyle: 'italic',
        marginTop: 8,
    },
    // New Styles
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 6,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1A1A1A',
        marginTop: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#757575',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: '80%',
        backgroundColor: '#F0F0F0',
        alignSelf: 'center',
    },
    stickyFooter: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingTop: 16,
        paddingHorizontal: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 20,
        alignItems: 'center',
    },
    joinButtonLarge: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 32,
        width: '100%',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    joinButtonTextLarge: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
        marginRight: 8,
    },
    joinButtonSubtext: {
        marginTop: 12,
        color: '#757575',
        fontSize: 13,
        fontWeight: '500',
    },
    leaveButton: {
        marginTop: 32,
        marginBottom: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#FFEBEE',
        alignSelf: 'center',
        width: '100%',
    },
    leaveButtonText: {
        color: '#FF5252',
        fontSize: 16,
        fontWeight: '700',
    },
    // Event Card
    eventCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0'
    },
    eventDateBox: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2
    },
    eventMonth: { fontSize: 12, color: '#FF5252', fontWeight: '700', textTransform: 'uppercase' },
    eventDay: { fontSize: 20, color: '#333', fontWeight: '700' },
    eventInfo: { flex: 1, marginLeft: 16 },
    eventTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 4 },
    eventTime: { fontSize: 13, color: '#757575' },
    remindBtn: { padding: 8, backgroundColor: '#E0F2F1', borderRadius: 12 }
});

export default CircleDetailScreen;
