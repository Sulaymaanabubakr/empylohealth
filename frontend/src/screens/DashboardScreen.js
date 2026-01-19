import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssessmentModal from '../components/AssessmentModal';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';
import Avatar from '../components/Avatar';

const { width } = Dimensions.get('window');

const CircularProgress = ({ score, label }) => {
    const size = 120;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const normalizedScore = typeof score === 'number' ? score : 0;
    const progress = normalizedScore / 100;
    const strokeDashoffset = circumference - progress * circumference;
    const displayScore = typeof score === 'number' ? score : '--';
    const displayLabel = label || 'No data';

    return (
        <View style={styles.circularProgressContainer}>
            <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Svg width={size} height={size}>
                    <Defs>
                        <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                            <Stop offset="0" stopColor="#00E5FF" stopOpacity="1" />
                            <Stop offset="1" stopColor="#2979FF" stopOpacity="1" />
                        </LinearGradient>
                    </Defs>
                    <Circle
                        stroke="#E0F7FA" // Very light cyan track
                        fill="white"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeOpacity={1}
                    />
                    <Circle
                        stroke="url(#grad)" // Gradient stroke
                        fill="none"
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${circumference} ${circumference}`}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                    />
                </Svg>
            </View>
            <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreNumber}>{displayScore}</Text>
                <Text style={styles.scoreLabel}>{displayLabel}</Text>
            </View>
        </View>
    );
};

import { assessmentService } from '../services/api/assessmentService';

const DashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, user } = useAuth();
    const [circles, setCircles] = useState([]);
    const [wellbeing, setWellbeing] = useState({ score: 0, label: 'Loading...' });
    const [challenges, setChallenges] = useState([]);
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentType, setAssessmentType] = useState('daily'); // 'daily' or 'weekly'

    useEffect(() => {
        console.log('DashboardScreen mounted. User:', user?.email);
        checkAssessments();
        fetchDashboardData();

        if (user?.uid) {
            const unsubscribe = circleService.subscribeToMyCircles(user.uid, (data) => {
                console.log('Fetched circles:', data.length);
                setCircles(data);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [stats, challs] = await Promise.all([
                assessmentService.getWellbeingStats(),
                assessmentService.getKeyChallenges()
            ]);
            setWellbeing(stats);
            setChallenges(challs);
        } catch (err) {
            console.log("Error fetching dashboard data", err);
        }
    };

    const checkAssessments = async () => {
        try {
            const today = new Date();
            const lastWeekly = await AsyncStorage.getItem('lastWeeklyAssessmentDate');
            const lastDaily = await AsyncStorage.getItem('lastDailyCheckInDate');

            // Check Weekly (every 7 days)
            let weeklyDue = true;
            if (lastWeekly) {
                const lastWeeklyDate = new Date(lastWeekly);
                const diffTime = Math.abs(today - lastWeeklyDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays < 7) weeklyDue = false;
            }

            if (weeklyDue) {
                setAssessmentType('weekly');
                setTimeout(() => setShowAssessment(true), 1500);
                return;
            }

            // Check Daily (every day)
            const todayStr = today.toDateString();
            if (lastDaily !== todayStr) {
                setAssessmentType('daily');
                setTimeout(() => setShowAssessment(true), 1500);
            }
        } catch (error) {
            console.error('Error checking assessment dates:', error);
        }
    };

    const handleTakeAssessment = async () => {
        try {
            const today = new Date();
            const todayStr = today.toDateString();
            setShowAssessment(false);

            if (assessmentType === 'weekly') {
                await AsyncStorage.setItem('lastWeeklyAssessmentDate', today.toISOString()); // Store full ISO for 7-day calc
                // Also mark daily as done for today so we don't double prompt
                await AsyncStorage.setItem('lastDailyCheckInDate', todayStr);
                navigation.navigate('Assessment'); // Navigate to Weekly Flow (AssessmentScreen -> NineIndex)
            } else {
                await AsyncStorage.setItem('lastDailyCheckInDate', todayStr);
                navigation.navigate('CheckIn'); // Navigate to Daily Flow
            }
        } catch (error) {
            console.error('Error saving assessment date:', error);
        }
    };

    const handleLater = () => {
        setShowAssessment(false);
    };

    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.dateText}>{currentDate}</Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications')}
                >
                    <Ionicons name="notifications" size={24} color="#333" />
                    <View style={styles.notificationDot} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 160 }]}
            >
                {/* User Greeting */}
                <View style={styles.greetingContainer}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            uri={userData?.photoURL || user?.photoURL}
                            name={userData?.name || user?.displayName || 'User'}
                            size={60}
                        />
                        <View style={styles.onlineBadge} />
                    </View>
                    <View style={styles.greetingText}>
                        <Text style={styles.greeting}>Hi, {userData?.name?.split(' ')[0] || 'Friend'}!</Text>
                        <Text style={styles.subGreeting}>How're you feeling today?</Text>
                    </View>
                </View>

                {/* Wellbeing Score Card */}
                <View style={styles.wellbeingCard}>
                    <View style={styles.wellbeingContent}>
                        <Text style={styles.wellbeingTitle}>Wellbeing Score</Text>
                        <Text style={styles.wellbeingDescription}>
                            Your score is looking great! Keep up the good work.
                        </Text>
                        <TouchableOpacity
                            style={styles.checkDetailsButton}
                            onPress={() => navigation.navigate('Assessment')}
                        >
                            <Text style={styles.checkDetailsText}>Check Details</Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <CircularProgress score={wellbeing.score} label={wellbeing.label} />
                </View>

                {/* Circles Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Circles</Text>
                    <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('SupportGroups')}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFA726" />
                    </TouchableOpacity>
                </View>

                {/* Real Circles List */}
                {circles.length === 0 ? (
                    <View style={styles.circleCard}>
                        <Text style={{ textAlign: 'center', color: '#757575', padding: 20 }}>
                            You haven't joined any circles yet.
                            {'\n'}Go to Explore to find one!
                        </Text>
                    </View>
                ) : (
                    circles.map((circle) => (
                        <TouchableOpacity
                            key={circle.id}
                            style={styles.circleCard}
                            onPress={() => navigation.navigate('CircleDetail', { circle })}
                        >
                            <View style={styles.circleHeader}>
                                <View>
                                    <Text style={styles.circleTitle}>{circle.name}</Text>
                                    <Text style={styles.circleMembers}>{circle.members?.length || 0} Members • {circle.category || 'General'}</Text>
                                </View>
                                {typeof circle.score === 'number' && (
                                    <View style={styles.scoreBadge}>
                                        <Text style={styles.scoreBadgeText}>{circle.score.toFixed(1)}</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={styles.circleLabel}>Visual Timeline</Text>
                            <Text style={styles.timelineEmptyText}>
                                Timeline will appear after member check-ins.
                            </Text>
                        </TouchableOpacity>
                    ))
                )}

                {/* Key Challenges */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Key Challenges</Text>

                <View style={styles.challengeRow}>
                    {challenges.length > 0 ? challenges.slice(0, 2).map((challenge, index) => (
                        <View key={index} style={[styles.challengeCard, { marginRight: index === 0 ? 10 : 0, marginLeft: index === 1 ? 10 : 0, flex: 1 }]}>
                            <View style={[styles.challengeIcon, { backgroundColor: challenge.bg || '#FFF3E0' }]}>
                                <MaterialCommunityIcons name={challenge.icon || 'alert-circle-outline'} size={28} color={challenge.color || '#FF9800'} />
                            </View>
                            <Text style={styles.challengeTitle}>{challenge.title}</Text>
                            <Text style={styles.challengeLevel}>Level: {challenge.level}</Text>
                        </View>
                    )) : (
                        <Text style={{ color: '#999', fontStyle: 'italic', padding: 10 }}>No specific challenges flagged.</Text>
                    )}
                </View>

                {challenges.length > 2 && (
                    <View style={[styles.challengeCard, { marginBottom: 30, flexDirection: 'row', alignItems: 'center', paddingVertical: 15, justifyContent: 'center' }]}>
                        <View style={[styles.challengeIcon, { backgroundColor: '#F3E5F5', marginRight: 15, marginBottom: 0 }]}>
                            <MaterialCommunityIcons name="head-outline" size={28} color="#8E24AA" />
                        </View>
                        <View>
                            <Text style={[styles.challengeTitle, { textAlign: 'left', marginBottom: 0 }]}>Stress Level</Text>
                            <Text style={[styles.challengeLevel, { textAlign: 'left' }]}>Currently Low</Text>
                        </View>
                    </View>
                )}

            </ScrollView>

            <AssessmentModal
                visible={showAssessment}
                type={assessmentType}
                onClose={handleLater}
                onTakeNow={handleTakeAssessment}
            />

            {/* Bottom Navigation */}
            <View style={[styles.bottomNavContainer, { paddingBottom: insets.bottom }]}>
                <View style={styles.bottomNav}>
                    <TouchableOpacity style={styles.navItem}>
                        <View style={[styles.activeNavIcon, { backgroundColor: '#E0F2F1' }]}>
                            <Ionicons name="home" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={[styles.navLabel, { color: COLORS.primary, fontWeight: '700' }]}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Explore')}>
                        <Feather name="compass" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Explore</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('ChatList')}>
                        <Ionicons name="chatbubble-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Profile')}>
                        <Ionicons name="person-outline" size={26} color="#BDBDBD" />
                        <Text style={styles.navLabel}>Profile</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 0,
        marginTop: -24, // Increased negative margin greatly
        paddingBottom: SPACING.md,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    calendarIconContainer: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '600',
    },
    notificationButton: {
        position: 'relative',
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 50,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#FF5252',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 110,
        paddingTop: 10,
    },
    greetingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.xl,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: SPACING.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#00E676',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    greetingText: {
        flex: 1,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#212121',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    subGreeting: {
        fontSize: 16,
        color: '#757575',
        fontWeight: '500',
    },
    wellbeingCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#FFAB40", // Orange shadow
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, // Stronger opacity
        shadowRadius: 20, // Softer dispersion
        elevation: 15,
        borderWidth: 1,
        borderColor: '#FFF8E1',
    },
    wellbeingContent: {
        flex: 1,
        paddingRight: SPACING.md,
    },
    wellbeingTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
        color: '#212121',
    },
    wellbeingDescription: {
        fontSize: 14,
        color: '#616161',
        lineHeight: 20,
        marginBottom: 12,
    },
    checkDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E0F2F1',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    checkDetailsText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
        marginRight: 4,
    },
    circularProgressContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 120,
        height: 120,
    },
    scoreTextContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreNumber: {
        fontSize: 40,
        fontWeight: '900',
        color: '#212121',
    },
    scoreLabel: {
        fontSize: 13,
        color: '#757575',
        marginTop: 0,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#212121',
    },
    seeAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    seeAllText: {
        fontSize: 16,
        color: '#FFA726',
        fontWeight: '700',
        marginRight: 2,
    },
    circleCard: {
        backgroundColor: '#FFF',
        borderRadius: 32,
        padding: 24,
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    circleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    circleTitle: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
        color: '#212121',
    },
    circleMembers: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    scoreBadge: {
        backgroundColor: '#E8F5E9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    scoreBadgeText: {
        color: '#2E7D32',
        fontWeight: '800',
        fontSize: 16,
    },
    circleLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#9E9E9E',
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    timelineEmptyText: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '500',
        marginBottom: 16,
    },
    timelineContainer: {
        height: 80,
        justifyContent: 'center',
        marginBottom: 24,
        width: '100%',
        position: 'relative',
        marginTop: 10,
    },
    timelineLine: {
        height: 14, // Thicker line
        borderRadius: 7,
        overflow: 'hidden',
        width: '100%',
        position: 'absolute',
        top: 13, // Vertically centered with avatars
    },
    timelinePerson: {
        position: 'absolute',
        alignItems: 'center',
        top: 0,
        width: 40,
    },
    avatarBorder: {
        borderWidth: 2,
        borderRadius: 20,
        padding: 2,
        backgroundColor: '#FFF',
        marginBottom: 6,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
    },
    timelineAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    timelineName: {
        fontSize: 12,
        color: '#616161',
        fontWeight: '700',
        width: 60,
        textAlign: 'center',
    },
    viewCircleButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 24,
        paddingVertical: 18,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    viewCircleButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: '700',
    },
    challengeRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    challengeCard: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#FAFAFA',
        alignItems: 'center', // Center content horizontally
    },
    challengeIcon: {
        width: 56,
        height: 56,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    challengeTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#212121',
        marginBottom: 4,
        textAlign: 'center', // Center text
    },
    challengeLevel: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
        textAlign: 'center', // Center text
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: 'transparent',
        zIndex: 100, // Ensure it sits on top of ScrollView
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
});

export default DashboardScreen;
