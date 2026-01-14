import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';
import ConfirmationModal from '../components/ConfirmationModal';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';
import Avatar from '../components/Avatar';
import { db } from '../services/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const ClientProfileScreen = ({ navigation }) => {
    const { user, userData } = useAuth();
    const [activeTab, setActiveTab] = useState('My circles'); // 'My circles' | 'Activity' | 'Account'
    const [activityTab, setActivityTab] = useState('Ongoing'); // 'Ongoing' | 'Completed'
    const [myCircles, setMyCircles] = useState([]);

    useEffect(() => {
        if (user?.uid) {
            const unsubscribe = circleService.subscribeToMyCircles(user.uid, (circles) => {
                setMyCircles(circles);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const safeAvatar = userData?.photoURL || user?.photoURL || '';
    const displayName = userData?.name || user?.displayName || 'User';
    const displayEmail = userData?.email || user?.email || '';
    const displayRole = userData?.role || 'client';

    const [learningSessions, setLearningSessions] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [completedLearningSessions, setCompletedLearningSessions] = useState([]);
    const [completedCampaigns, setCompletedCampaigns] = useState([]);

    useEffect(() => {
        if (!user?.uid) return;
        const fetchActivity = async () => {
            try {
                const [ongoingSessionsSnap, completedSessionsSnap, ongoingCampaignsSnap, completedCampaignsSnap] = await Promise.all([
                    getDocs(query(collection(db, 'learningSessions'), where('uid', '==', user.uid), where('status', '==', 'ongoing'))),
                    getDocs(query(collection(db, 'learningSessions'), where('uid', '==', user.uid), where('status', '==', 'completed'))),
                    getDocs(query(collection(db, 'campaigns'), where('uid', '==', user.uid), where('status', '==', 'ongoing'))),
                    getDocs(query(collection(db, 'campaigns'), where('uid', '==', user.uid), where('status', '==', 'completed'))),
                ]);

                setLearningSessions(ongoingSessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setCompletedLearningSessions(completedSessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setCampaigns(ongoingCampaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setCompletedCampaigns(completedCampaignsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (error) {
                console.error('Failed to load activity data', error);
                setLearningSessions([]);
                setCompletedLearningSessions([]);
                setCampaigns([]);
                setCompletedCampaigns([]);
            }
        };

        fetchActivity();
    }, [user?.uid]);

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </TouchableOpacity>

            <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                    <Avatar uri={safeAvatar || ''} name={displayName} size={80} />
                </View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.email}>{displayEmail}</Text>
                <Text style={[styles.roleBadge, { color: '#009688' }]}>
                    {displayRole}
                </Text>
            </View>

            <TouchableOpacity style={styles.qrButton}>
                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#FFA000" />
            </TouchableOpacity>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            {['My circles', 'Activity', 'Account'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMyCircles = () => (
        <View style={styles.contentSection}>
            <TouchableOpacity style={styles.joinButton}>
                <Ionicons name="add" size={20} color="#FFA000" />
                <Text style={styles.joinButtonText}>Join Organisation</Text>
            </TouchableOpacity>

            {myCircles.length === 0 && (
                <Text style={styles.emptyStateText}>You are not part of any circles yet.</Text>
            )}
            {myCircles.map((circle) => (
                <View key={circle.id} style={styles.circleCard}>
                    <View style={styles.circleHeader}>
                        <View>
                            <Text style={styles.circleTitle}>{circle.name}</Text>
                            <Text style={styles.circleSubtitle}>Circle's Wellbeing Score: {circle.score || 0}</Text>
                            <Text style={styles.circleMembers}>Members: {circle.members?.length || 0}</Text>
                            <Text style={styles.circleMembers}>Activity level: {circle.activityLevel || '—'}</Text>
                        </View>
                    </View>

                    <View style={styles.timelineContainer}>
                        <View style={styles.timelineLine}>
                            <LinearGradient
                                colors={['#FF5252', '#FFD740', '#69F0AE']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flex: 1, borderRadius: 7 }}
                            />
                        </View>
                        {(circle.memberAvatars || []).map((member, index) => (
                            <View key={index} style={[styles.timelineAvatarWrapper, { left: `${(index + 1) * 16}%` }]}>
                                <Image source={{ uri: member.image }} style={styles.timelineAvatar} />
                                <Text style={styles.memberName}>{member.name}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.viewButton}
                        onPress={() => navigation.navigate('CircleDetail', { circle })}
                    >
                        <Text style={styles.viewButtonText}>View Circle</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );

    const renderActivity = () => {
        const isOngoing = activityTab === 'Ongoing';

        return (
            <View style={styles.contentSection}>
                <View style={styles.activityTabs}>
                    <TouchableOpacity onPress={() => setActivityTab('Ongoing')} style={styles.subTab}>
                        <Text style={[styles.subTabText, isOngoing && styles.activeSubTabText]}>Ongoing</Text>
                        {isOngoing && <View style={styles.activeSubLine} />}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setActivityTab('Completed')} style={styles.subTab}>
                        <Text style={[styles.subTabText, !isOngoing && styles.activeSubTabText]}>Completed</Text>
                        {!isOngoing && <View style={styles.activeSubLine} />}
                    </TouchableOpacity>
                </View>

                {isOngoing ? (
                    <>
                        <Text style={styles.sectionHeader}>Learning sessions ({learningSessions.length})</Text>
                        {learningSessions.length === 0 && (
                            <Text style={styles.emptyStateText}>No ongoing learning sessions yet.</Text>
                        )}
                        {learningSessions.map((session) => (
                            <TouchableOpacity
                                key={session.id}
                                style={styles.sessionCard}
                                onPress={() => navigation.navigate('LearningSession', { session })}
                            >
                                <View style={styles.sessionHeader}>
                                    <Text style={styles.sessionTitle}>{session.title}</Text>
                                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#757575" />
                                </View>
                                <View style={styles.progressContainer}>
                                    <Text style={styles.progressLabel}>Overall progress: {session.progress * 100}%</Text>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${session.progress * 100}%` }]} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <Text style={styles.sectionHeader}>Campaigns</Text>
                        {campaigns.length === 0 && (
                            <Text style={styles.emptyStateText}>No active campaigns yet.</Text>
                        )}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campaignList}>
                            {campaigns.map((camp) => (
                                <View key={camp.id} style={styles.campaignCard}>
                                    {camp.image ? (
                                        <Image source={{ uri: camp.image }} style={styles.campaignImage} />
                                    ) : (
                                        <View style={styles.campaignPlaceholder}>
                                            <Text style={styles.campaignPlaceholderText}>
                                                {(camp.title || 'CP').slice(0, 2).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.campaignInfo}>
                                        <Text style={styles.campaignTitle}>{camp.title}</Text>
                                        <View style={styles.campaignMeta}>
                                            <Text style={styles.campaignDate}><Feather name="calendar" /> {camp.date}</Text>
                                            <Text style={styles.campaignTime}><Feather name="clock" /> {camp.time}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                ) : (
                    <>
                        <Text style={styles.sectionHeader}>Learning sessions ({completedLearningSessions.length})</Text>
                        {completedLearningSessions.length === 0 && (
                            <Text style={styles.emptyStateText}>No completed learning sessions yet.</Text>
                        )}
                        {completedLearningSessions.map((session) => (
                            <View key={session.id} style={styles.sessionCard}>
                                <View style={styles.sessionHeader}>
                                    <Text style={styles.sessionTitle}>{session.title}</Text>
                                    <MaterialCommunityIcons name="dots-vertical" size={20} color="#757575" />
                                </View>
                                <View style={styles.completedInfo}>
                                    <View style={styles.completedBadge}>
                                        <Ionicons name="checkmark" size={16} color="#009688" />
                                        <Text style={styles.completedText}>Completed!</Text>
                                    </View>
                                    <View style={styles.gradeBadge}>
                                        <Ionicons name="star" size={16} color="#009688" />
                                        <Text style={styles.gradeText}>Grade: {session.grade}%</Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        <Text style={styles.sectionHeader}>Campaigns</Text>
                        {completedCampaigns.length === 0 && (
                            <Text style={styles.emptyStateText}>No completed campaigns yet.</Text>
                        )}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.campaignList}>
                            {completedCampaigns.map((camp) => (
                                <View key={camp.id} style={styles.campaignCard}>
                                    {camp.image ? (
                                        <Image source={{ uri: camp.image }} style={styles.campaignImage} />
                                    ) : (
                                        <View style={styles.campaignPlaceholder}>
                                            <Text style={styles.campaignPlaceholderText}>
                                                {(camp.title || 'CP').slice(0, 2).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.campaignInfo}>
                                        <Text style={styles.campaignTitle}>{camp.title}</Text>
                                        <View style={styles.completedMeta}>
                                            <Ionicons name="checkmark" size={12} color="#009688" />
                                            <Text style={styles.completedDateText}>Completed on {camp.completedDate}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </>
                )}
            </View>
        );
    };

    const renderAccount = () => (
        <View style={styles.contentSection}>
            <View style={styles.emptyState}>
                <Text style={{ color: '#757575' }}>Account Settings</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {renderHeader()}
                {renderTabs()}
                {activeTab === 'My circles' && renderMyCircles()}
                {activeTab === 'Activity' && renderActivity()}
                {activeTab === 'Account' && renderAccount()}
            </ScrollView>

            {/* Bottom Nav Placeholder */}
            <View style={styles.bottomNavContainer}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Dashboard')}>
                        <Ionicons name="home-outline" size={24} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
                        <Feather name="compass" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatList')}>
                        <Ionicons name="chatbubble-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="person" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '700' }]}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
    },
    qrButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        borderRadius: 20,
    },
    profileInfo: {
        alignItems: 'center',
        marginTop: 10,
    },
    avatarContainer: {
        marginBottom: 10,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    email: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 4,
    },
    roleBadge: {
        fontWeight: '600',
        fontSize: 12,
    },
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: '#E0E0E0',
        borderRadius: 25,
        marginHorizontal: 20,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 20,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '600',
    },
    activeTabText: {
        color: '#1A1A1A',
    },
    contentSection: {
        paddingHorizontal: 20,
    },
    joinButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFF8E1',
    },
    joinButtonText: {
        color: '#FFA000',
        fontWeight: '600',
        marginLeft: 8,
    },
    circleCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    circleHeader: {
        marginBottom: 16,
    },
    circleTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    circleSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    circleMembers: {
        fontSize: 12,
        color: '#757575',
    },
    timelineContainer: {
        height: 60,
        position: 'relative',
        justifyContent: 'center',
        marginBottom: 16,
    },
    timelineLine: {
        height: 8,
        width: '100%',
        position: 'absolute',
    },
    timelineAvatarWrapper: {
        position: 'absolute',
        alignItems: 'center',
        top: -12,
    },
    timelineAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#FFF',
        marginBottom: 4,
    },
    memberName: {
        fontSize: 10,
        color: '#424242',
    },
    viewButton: {
        backgroundColor: '#009688',
        borderRadius: 20,
        paddingVertical: 10,
        alignItems: 'center',
        width: 120,
        alignSelf: 'center',
    },
    viewButtonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    // Activity Styles
    activityTabs: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 24,
    },
    subTab: {
        paddingBottom: 4,
        position: 'relative',
    },
    subTabText: {
        fontSize: 16,
        color: '#757575',
        fontWeight: '600',
    },
    activeSubTabText: {
        color: '#1A1A1A',
    },
    activeSubLine: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        backgroundColor: '#009688',
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 12,
    },
    emptyStateText: {
        fontSize: 13,
        color: '#9E9E9E',
        marginBottom: 12,
    },
    sessionCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 1,
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sessionTitle: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        marginRight: 8,
    },
    progressContainer: {
        gap: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: '#757575',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#EEEEEE',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFA000',
    },
    campaignList: {
        marginTop: 8,
    },
    campaignCard: {
        width: 160,
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginRight: 16,
        overflow: 'hidden',
        paddingBottom: 12,
    },
    campaignImage: {
        width: '100%',
        height: 100,
        marginBottom: 8,
    },
    campaignPlaceholder: {
        width: '100%',
        height: 100,
        marginBottom: 8,
        backgroundColor: '#ECEFF1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    campaignPlaceholderText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#90A4AE',
    },
    campaignInfo: {
        paddingHorizontal: 12,
    },
    campaignTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 4,
    },
    campaignMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    campaignDate: {
        fontSize: 10,
        color: '#757575',
    },
    campaignTime: {
        fontSize: 10,
        color: '#757575',
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: 24,
        backgroundColor: 'transparent',
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingVertical: 12,
        borderRadius: 32,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 25,
        justifyContent: 'space-around',
    },
    navItem: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    activeNavIcon: {
        padding: 10,
        borderRadius: 20,
        marginBottom: 4,
    },
    navLabel: {
        fontSize: 11,
        color: '#BDBDBD',
        fontWeight: '600',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    // Completed Activity Styles
    completedInfo: {
        flexDirection: 'column',
        gap: 4,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    completedText: {
        color: '#424242',
        fontSize: 12,
        fontWeight: '700',
    },
    gradeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    gradeText: {
        color: '#424242',
        fontSize: 12,
        fontWeight: '700',
    },
    completedMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    completedDateText: {
        fontSize: 10,
        color: '#424242',
        fontWeight: '600',
    },
});

export default ClientProfileScreen;
