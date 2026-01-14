import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import ConfirmationModal from '../components/ConfirmationModal';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { huddleService } from '../services/api/huddleService';
import { circleService } from '../services/api/circleService';

const CircleDetailScreen = ({ navigation, route }) => {
    const { user } = useAuth();
    const circle = route.params?.circle;

    const [isLeaveVisible, setIsLeaveVisible] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState([]);
    const [isLeaving, setIsLeaving] = useState(false);

    const handleLeaveCircle = async () => {
        if (!circle?.id) {
            setIsLeaveVisible(false);
            navigation.goBack();
            return;
        }
        try {
            setIsLeaving(true);
            await circleService.leaveCircle(circle.id);
            setIsLeaveVisible(false);
            navigation.goBack();
        } catch (error) {
            console.error('Failed to leave circle', error);
        } finally {
            setIsLeaving(false);
        }
    };

    useEffect(() => {
        if (!circle) return;
        const loadMembers = async () => {
            if (!Array.isArray(circle.members) || circle.members.length === 0) {
                setMemberProfiles([]);
                return;
            }
            try {
                const docs = await Promise.all(
                    circle.members.map(async (uid) => {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        const data = userDoc.exists() ? userDoc.data() : {};
                        return {
                            id: uid,
                            name: data?.name || data?.displayName || 'Member',
                            image: data?.photoURL || '',
                            isAdmin: uid === circle.adminId,
                            status: uid === user?.uid ? 'online' : 'offline'
                        };
                    })
                );
                setMemberProfiles(docs);
            } catch (error) {
                setMemberProfiles([]);
            }
        };
        loadMembers();
    }, [circle, user]);

    if (!circle) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Circle details are unavailable.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Circle Overview */}
                <View style={styles.overviewContainer}>
                    <Text style={styles.circleName}>{circle.name}</Text>

                    {/* Score Ring Placeholder */}
                    <View style={styles.scoreContainer}>
                        {/* Simple border representation of the ring for now */}
                        <View style={styles.scoreRing}>
                            <View style={styles.scoreInner}>
                                <Text style={styles.scoreValue}>
                                    {typeof circle.score === 'number' ? circle.score.toFixed(1) : '—'}
                                </Text>
                                <Text style={styles.scoreLabel}>{circle.scoreLabel || circle.status || '—'}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.statsText}>Members: {Array.isArray(circle.members) ? circle.members.length : circle.members || 0}</Text>
                    <Text style={styles.statsText}>Activity level: {circle.activityLevel || circle.activity || '—'}</Text>
                </View>

                {/* Actions */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity
                        style={styles.actionButtonTeal}
                        onPress={() => {
                            if (circle.chatId) {
                                navigation.navigate('ChatDetail', { chat: { id: circle.chatId, name: circle.name, isGroup: true } });
                            } else {
                                Alert.alert('Chat unavailable', 'This circle does not have a chat yet.');
                            }
                        }}
                    >
                        <MaterialCommunityIcons name="message-outline" size={18} color="#FFF" />
                        <Text style={styles.actionButtonText}>Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButtonTeal}
                        onPress={async () => {
                            if (!circle.chatId) {
                                Alert.alert('Huddle unavailable', 'This circle does not have a chat yet.');
                                return;
                            }
                            try {
                                const result = await huddleService.startHuddle(circle.chatId, true);
                                navigation.navigate('Huddle', { chat: { id: circle.chatId, name: circle.name, isGroup: true }, huddleId: result.huddleId, roomUrl: result.roomUrl });
                            } catch (error) {
                                Alert.alert('Unable to start huddle', 'Please try again later.');
                            }
                        }}
                    >
                        <Ionicons name="call-outline" size={18} color="#FFF" />
                        <Text style={styles.actionButtonText}>Start huddle</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButtonYellow}
                        onPress={() => setIsLeaveVisible(true)}
                        disabled={isLeaving}
                    >
                        <Ionicons name="exit-outline" size={18} color="#5D4037" />
                        <Text style={styles.actionButtonTextDark}>{isLeaving ? 'Leaving...' : 'Leave circle'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Members List */}
                <View style={styles.membersHeader}>
                    <Text style={styles.membersTitle}>Members</Text>
                    <View style={styles.underline} />
                </View>

                <View style={styles.membersList}>
                    {memberProfiles.length === 0 && (
                        <Text style={styles.emptyStateText}>No members to display yet.</Text>
                    )}
                    {memberProfiles.map((member) => (
                        <View key={member.id} style={styles.memberCard}>
                            <Avatar uri={member.image} name={member.name} size={44} />
                            <View style={styles.memberInfo}>
                                <Text style={styles.memberName}>{member.name}</Text>
                                <Text style={styles.memberScore}>
                                    Score: {typeof member.score === 'number' ? member.score : '—'}
                                </Text>
                            </View>
                            <View style={styles.memberRight}>
                                {member.isAdmin && (
                                    <View style={styles.adminBadge}>
                                        <Text style={styles.adminText}>ADMIN</Text>
                                    </View>
                                )}
                                <View style={[
                                    styles.statusDot,
                                    { backgroundColor: member.status === 'online' ? '#76FF03' : '#E0E0E0' }
                                ]} />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <ConfirmationModal
                visible={isLeaveVisible}
                message="Are you sure you want to leave this Circle?"
                onConfirm={handleLeaveCircle}
                onCancel={() => setIsLeaveVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#757575',
    },
    overviewContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 24,
    },
    circleName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 20,
    },
    scoreContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    scoreRing: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        borderColor: '#4DB6AC', // Teal ring color
        borderTopColor: '#B2DFDB', // Lighter teal for variation
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreInner: {
        alignItems: 'center',
    },
    scoreValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#757575',
    },
    statsText: {
        fontSize: 12,
        color: '#424242',
        marginBottom: 2,
    },
    actionsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
        paddingHorizontal: 16,
    },
    actionButtonTeal: {
        backgroundColor: '#4DB6AC',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    actionButtonYellow: {
        backgroundColor: '#FFCC80', // Light orange/yellow
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 12,
    },
    actionButtonTextDark: {
        color: '#5D4037',
        fontWeight: '600',
        fontSize: 12,
    },
    membersHeader: {
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    membersTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#009688', // Teal color for "Members" text
        marginBottom: 4,
    },
    underline: {
        height: 2,
        width: 60,
        backgroundColor: '#009688',
        borderRadius: 1,
    },
    membersList: {
        paddingHorizontal: 24,
        gap: 12,
    },
    memberCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    memberAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    memberScore: {
        fontSize: 12,
        color: '#757575',
    },
    memberRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emptyStateText: {
        textAlign: 'center',
        color: '#9E9E9E',
        marginTop: 8,
    },
    adminBadge: {
        borderWidth: 1,
        borderColor: '#00BCD4', // Cyan/Teal border
        borderRadius: 4,
        paddingHorizontal: 4,
        paddingVertical: 2,
    },
    adminText: {
        fontSize: 8,
        color: '#00BCD4',
        fontWeight: '700',
    },
    statusDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        // color set inline based on status
    },
});

export default CircleDetailScreen;
