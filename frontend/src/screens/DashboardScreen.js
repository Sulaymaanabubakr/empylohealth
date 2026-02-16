import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssessmentModal from '../components/AssessmentModal';
import { weeklyAssessment } from '../services/assessments/weeklyAssessment';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Avatar from '../components/Avatar';

import { assessmentService } from '../services/api/assessmentService';

const { width } = Dimensions.get('window');

/**
 * Calculates a dynamic "Health Score" for the circle based on members and activity.
 */
const calculateCircleRating = (circle) => {
    if (!circle) return '4.2';
    if (circle.score) return circle.score; // Use backend score if available

    let score = 4.2; // Strong baseline because all circles are supportive

    // Member count impact (More members = more trusted)
    const memberCount = circle.members?.length || 0;
    if (memberCount > 50) score += 0.4;
    else if (memberCount > 20) score += 0.3;
    else if (memberCount > 10) score += 0.2;
    else if (memberCount > 2) score += 0.1;

    // Activity Bonus (Recency of updates)
    const lastUpdate = circle.updatedAt?.toMillis?.() || circle.lastMessageAt?.toMillis?.() || 0;

    if (lastUpdate > 0) {
        const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) score += 0.4; // Updated today
        else if (hoursSinceUpdate < 72) score += 0.2; // Updated recently
        else if (hoursSinceUpdate < 168) score += 0.1; // Updated this week
    }

    return Math.min(score, 5.0).toFixed(1); // Cap at 5.0
};

const getWellbeingRingColor = (memberWellbeing) => {
    const rawScore = memberWellbeing?.wellbeingScore;
    const score =
        typeof rawScore === 'number'
            ? rawScore
            : (typeof rawScore === 'string' ? Number(String(rawScore).replace('%', '').trim()) : NaN);
    const label = String(memberWellbeing?.wellbeingLabel || memberWellbeing?.wellbeingStatus || '').toLowerCase();

    // Prefer explicit labels/status where available.
    if (label.includes('struggl')) return '#C62828'; // red
    if (label.includes('good') || label.includes('well') || label.includes('thriv')) return '#2E7D32'; // green

    // Fall back to score if present.
    if (Number.isFinite(score)) {
        if (score >= 70) return '#2E7D32'; // green
        return '#C62828'; // red
    }

    // Unknown/no recent wellbeing data.
    return '#BDBDBD';
};

const resolveMemberWellbeing = (userData = {}) => {
    const directScore = userData?.wellbeingScore;
    const statsScore = userData?.stats?.overallScore;
    const rawScore = directScore ?? statsScore;
    const parsedScore =
        typeof rawScore === 'number'
            ? rawScore
            : (typeof rawScore === 'string' ? Number(String(rawScore).replace('%', '').trim()) : NaN);

    const directLabel = userData?.wellbeingLabel || userData?.wellbeingStatus;
    let label = directLabel || '';
    if (!label && Number.isFinite(parsedScore)) {
        if (parsedScore >= 70) label = 'Doing Well';
        else label = 'Struggling';
    }

    return {
        score: Number.isFinite(parsedScore) ? parsedScore : null,
        label
    };
};

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



const DashboardScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const { userData, user } = useAuth();
    const [circles, setCircles] = useState([]);
    const [wellbeing, setWellbeing] = useState({ score: 0, label: 'Loading...' });
    const [challenges, setChallenges] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentType, setAssessmentType] = useState('daily'); // 'daily' or 'weekly'
    const [memberProfiles, setMemberProfiles] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

    useEffect(() => {
        if (!user?.uid) return;

        const q = query(
            collection(db, 'notifications'),
            where('uid', '==', user.uid),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setHasUnreadNotifications(!snapshot.empty);
        }, (error) => {
            console.log("Error fetching notifications:", error);
            setHasUnreadNotifications(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        console.log('DashboardScreen mounted. User:', user?.email);
        checkAssessments();
        fetchDashboardData();

        if (user?.uid) {
            const unsubscribe = circleService.subscribeToMyCircles(user.uid, (data) => {
                console.log('Fetched circles:', data.length);
                // Sort by most engaged (updatedAt or lastMessageAt)
                const sorted = (data || []).sort((a, b) => {
                    const timeA = a.updatedAt?.toMillis?.() || 0;
                    const timeB = b.updatedAt?.toMillis?.() || 0;
                    return timeB - timeA;
                });
                // Only keep the top circle
                const topCircle = sorted.slice(0, 1);
                setCircles(topCircle);

                // Fetch member profiles for the top circle
                if (topCircle.length > 0 && topCircle[0].members) {
                    loadMemberProfiles(topCircle[0]);
                }
            });
            return () => unsubscribe();
        }
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const [stats, challs, recs] = await Promise.all([
                assessmentService.getWellbeingStats(),
                assessmentService.getKeyChallenges(),
                assessmentService.getRecommendedContent()
            ]);
            setWellbeing(stats);
            setChallenges(challs);
            setRecommendations(recs);
        } catch (err) {
            console.log("Error fetching dashboard data", err);
        } finally {
            setRefreshing(false);
        }
    };

    const checkAssessments = useCallback(async () => {
        try {
            const today = new Date();
            const pendingWeekly = await AsyncStorage.getItem('pendingWeeklyAssessment');
            const lastWeekly = await AsyncStorage.getItem('lastWeeklyAssessmentDate');
            const lastWeeklyKey = await AsyncStorage.getItem('lastWeeklyAssessmentWeekKey');
            const lastDaily = await AsyncStorage.getItem('lastDailyCheckInDate');

            if (pendingWeekly === 'true') {
                setAssessmentType('weekly');
                setTimeout(() => setShowAssessment(true), 1500);
                return;
            }

            // Weekly resets on Monday (ISO week), consistent for everyone (fixed timezone).
            // Migration: if legacy lastWeeklyAssessmentDate exists, derive and store its week key once.
            let storedKey = lastWeeklyKey;
            if (!storedKey && lastWeekly) {
                const migratedKey = weeklyAssessment.getWeekKeyForIsoString(lastWeekly);
                if (migratedKey) {
                    await AsyncStorage.setItem('lastWeeklyAssessmentWeekKey', migratedKey);
                    storedKey = migratedKey;
                }
            }
            const currentKey = weeklyAssessment.getCurrentWeekKey(today);
            const weeklyDue = !storedKey || storedKey !== currentKey;

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
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchDashboardData();
        checkAssessments();
    }, [checkAssessments]);

    useFocusEffect(
        useCallback(() => {
            checkAssessments();
        }, [checkAssessments])
    );

    const handleTakeAssessment = async () => {
        try {
            const today = new Date();
            const todayStr = today.toDateString();
            setShowAssessment(false);

            if (assessmentType === 'weekly') {
                await AsyncStorage.setItem('pendingWeeklyAssessment', 'true');
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

    const loadMemberProfiles = async (circle) => {
        if (!circle.members || circle.members.length === 0) return;

        try {
            const profiles = {};
            // Load up to 5 member profiles for timeline visualization
            const memberIds = circle.members.slice(0, 5);
            console.log('[Dashboard] Loading member profiles for circle:', circle.id, 'memberIds:', memberIds);

            for (const memberId of memberIds) {
                const memberDoc = await getDoc(doc(db, 'users', memberId));
                if (memberDoc.exists()) {
                    const data = memberDoc.data();
                    const wellbeing = resolveMemberWellbeing(data);
                    profiles[memberId] = {
                        name: data.name || data.displayName || 'Member',
                        photoURL: data.photoURL || '',
                        wellbeingScore: wellbeing.score,
                        wellbeingLabel: wellbeing.label,
                        wellbeingStatus: data.wellbeingStatus || ''
                    };
                } else {
                    console.log('[Dashboard] Member doc does not exist:', memberId);
                }
            }
            console.log('[Dashboard] Loaded profiles:', Object.keys(profiles).length, 'of', memberIds.length);
            setMemberProfiles(profiles);
        } catch (error) {
            console.error('Error loading member profiles:', error);
        }
    };



    const currentDate = new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
                    {hasUnreadNotifications && <View style={styles.notificationDot} />}
                </TouchableOpacity>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                }
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
                        <Text style={styles.greeting}>Hi, {(userData?.name || user?.displayName || 'Friend').split(' ')[0]}!</Text>
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
                            onPress={() => {
                                if (wellbeing.score > 0) {
                                    navigation.navigate('Stats');
                                } else {
                                    navigation.navigate('Assessment');
                                }
                            }}
                        >
                            <Text style={styles.checkDetailsText}>
                                {wellbeing.score > 0 ? "Check Details" : "Take Assessment"}
                            </Text>
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
                            disabled={true} // Disable card click, using buttons instead
                        >
                            <View style={styles.circleHeader}>
                                <View>
                                    <Text style={styles.circleTitle}>{circle.name}</Text>
                                    <Text style={styles.circleMembers}>{circle.members?.length || 0} Members • High Activity</Text>
                                </View>
                                {/* Rating Badge */}
                                <View style={styles.scoreBadge}>
                                    <Ionicons name="star" size={12} color="#00C853" style={{ marginRight: 4 }} />
                                    <Text style={styles.scoreBadgeText}>{calculateCircleRating(circle)}</Text>
                                </View>
                            </View>

                            {/* Premium Member Stack */}
                            {circle.members && circle.members.length > 0 && Object.keys(memberProfiles).length > 0 ? (
                                <View style={styles.memberStackContainer}>
                                    <View style={styles.avatarStack}>
                                        {circle.members.slice(0, 5).map((memberId, index) => {
                                            const profile = memberProfiles[memberId];
                                            if (!profile) return null;

                                            return (
                                                <View
                                                    key={memberId}
                                                    style={[
                                                        styles.memberAvatarContainer,
                                                        {
                                                            zIndex: 10 - index,
                                                            marginLeft: index === 0 ? 0 : -18,
                                                            borderColor: getWellbeingRingColor(profile)
                                                        }
                                                    ]}
                                                >
                                                    <Avatar
                                                        uri={profile.photoURL}
                                                        name={profile.name}
                                                        size={40}
                                                    />
                                                </View>
                                            );
                                        })}
                                        {circle.members.length > 5 && (
                                            <View style={[styles.moreMembersBadge, { zIndex: 0, marginLeft: -18 }]}>
                                                <Text style={styles.moreMembersText}>+{circle.members.length - 5}</Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.stackInfoContainer}>
                                        <Text style={styles.stackInfoText}>
                                            <Text style={styles.highlightText}>{circle.members.length} members</Text> are active
                                        </Text>
                                        <View style={styles.activeIndicator} />
                                    </View>
                                </View>
                            ) : (
                                <Text style={styles.timelineEmptyText}>
                                    Join the conversation with your circle members.
                                </Text>
                            )}

                            <TouchableOpacity
                                style={styles.viewCircleButton}
                                onPress={() => navigation.navigate('CircleAnalysis', { circle })}
                            >
                                <Text style={styles.viewCircleButtonText}>View Circle Analysis</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    ))
                )}

                {/* Key Challenges */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Key Challenges</Text>

                <View style={styles.challengeRow}>
                    {challenges.length > 0 ? challenges.slice(0, 2).map((challenge, index) => {
                        const iconName = challenge.icon || 'alert-circle-outline';
                        const safeIconName = MaterialCommunityIcons?.glyphMap?.[iconName] ? iconName : 'alert-circle-outline';
                        return (
                            <View key={index} style={[styles.challengeCard, { marginRight: index === 0 ? 10 : 0, marginLeft: index === 1 ? 10 : 0, flex: 1 }]}>
                                <View style={[styles.challengeIcon, { backgroundColor: challenge.bg || '#FFF3E0' }]}>
                                    <MaterialCommunityIcons name={safeIconName} size={28} color={challenge.color || '#FF9800'} />
                                </View>
                                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                                <Text style={styles.challengeLevel}>Level: {challenge.level}</Text>
                            </View>
                        );
                    }) : (
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

                {/* Recommended Activities */}
                <View style={[styles.sectionHeader, { marginTop: 10 }]}>
                    <Text style={styles.sectionTitle}>Recommended For You</Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 20, marginHorizontal: -SPACING.lg }}
                    contentContainerStyle={{
                        paddingHorizontal: SPACING.lg,
                        paddingVertical: 10 // Space for shadows
                    }}
                >
                    {recommendations.length > 0 ? (
                        recommendations.map((item, index) => (
                            <TouchableOpacity
                                key={item.id || index}
                                style={styles.recommendationCard}
                                onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
                            >
                                <View style={[styles.recommendationImageContainer, { backgroundColor: item.color || '#E0F7FA' }]}>
                                    {item.image ? (
                                        <Image source={{ uri: item.image }} style={styles.recommendationImage} resizeMode="contain" />
                                    ) : (
                                        <MaterialCommunityIcons name="feather" size={32} color={COLORS.primary} />
                                    )}
                                </View>
                                <View style={styles.recommendationContent}>
                                    <Text style={styles.recommendationTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text style={styles.recommendationTag}>{item.tag || item.category || 'Activity'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={styles.emptyRecommendation}>
                            <Text style={styles.emptyText}>Complete a check-in to get recommendations!</Text>
                        </View>
                    )}
                </ScrollView>

            </ScrollView>

            <AssessmentModal
                visible={showAssessment}
                type={assessmentType}
                onClose={handleLater}
                onTakeNow={handleTakeAssessment}
            />


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
    circleLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#9E9E9E',
        fontWeight: '700',
        letterSpacing: 2.5,
        marginBottom: 16,
    },
    timelineEmptyText: {
        fontSize: 13,
        color: '#9E9E9E',
        fontWeight: '500',
        marginBottom: 16,
        fontStyle: 'italic',
    },
    memberStackContainer: {
        marginBottom: 20,
        marginTop: 12,
        alignItems: 'center', // Center vertically within container (if row) or horizontally (if col)
        width: '100%',     // Ensure full width for centering
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content horizontally
        marginBottom: 12,
        // Removed paddingLeft to ensure true center
    },
    memberAvatarContainer: {
        width: 48,
        height: 48,
        borderWidth: 3,
        borderColor: '#BDBDBD',
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
    },
    moreMembersBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    moreMembersText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#757575',
    },
    stackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center the text row
    },
    stackInfoText: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
        marginRight: 6,
    },
    highlightText: {
        color: '#212121',
        fontWeight: '700',
    },
    activeIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00E676',
    },
    viewCircleButton: {
        backgroundColor: COLORS.primary,
        alignSelf: 'center',
        width: '100%',
        borderRadius: 20,
        paddingVertical: 12,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        marginTop: 4,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    scoreBadgeText: {
        color: '#2E7D32',
        fontWeight: '800',
        fontSize: 14,
    },
    viewCircleButtonText: {
        color: COLORS.white,
        fontSize: 15,
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
        // paddingBottom removed - using insets.bottom from inline style
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
    recommendationCard: {
        width: 200,
        backgroundColor: '#FFF',
        borderRadius: 24,
        marginRight: 16,
        padding: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#FAFAFA',
    },
    recommendationImageContainer: {
        height: 100,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        overflow: 'hidden',
    },
    recommendationImage: {
        width: '100%',
        height: '100%',
    },
    recommendationContent: {
        paddingHorizontal: 4,
        paddingBottom: 4,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 4,
        height: 40, // Fixed height for 2 lines
    },
    recommendationTag: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
        textTransform: 'uppercase',
    },
    emptyRecommendation: {
        padding: 20,
        width: width - 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
    }
});

export default DashboardScreen;
