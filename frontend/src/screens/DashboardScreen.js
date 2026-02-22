import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Dimensions, RefreshControl, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, RADIUS } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, { Circle, G, Defs, LinearGradient, Stop, SvgXml } from 'react-native-svg';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AssessmentModal from '../components/AssessmentModal';
import { weeklyAssessment } from '../services/assessments/weeklyAssessment';
import { useAuth } from '../context/AuthContext';
import { circleService } from '../services/api/circleService';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import Avatar from '../components/Avatar';
import CircleMemberLane from '../components/CircleMemberLane';
import { screenCacheService } from '../services/bootstrap/screenCacheService';
import { formatDateUK, formatTimeUK } from '../utils/dateFormat';
import { fetchActiveMemberIdsMap, getActiveMemberCount, getDisplayMemberIds } from '../services/circles/activeMembers';

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

const getWellbeingScoreMessage = (score, label = '') => {
    if (Number.isFinite(score)) {
        if (score <= 34) {
            return "Things feel heavy right now. You're not alone, take one small step today.";
        }
        if (score <= 64) {
            return "You're making progress. Keep going with steady habits and check-ins.";
        }
        return "You're doing well. Keep up the strong momentum and consistency.";
    }

    const normalizedLabel = String(label || '').toLowerCase();
    if (normalizedLabel.includes('struggl') || normalizedLabel.includes('low') || normalizedLabel.includes('critical')) {
        return "Things feel heavy right now. You're not alone, take one small step today.";
    }
    if (normalizedLabel.includes('moderate') || normalizedLabel.includes('fair') || normalizedLabel.includes('amber')) {
        return "You're making progress. Keep going with steady habits and check-ins.";
    }
    if (normalizedLabel.includes('well') || normalizedLabel.includes('good') || normalizedLabel.includes('stable') || normalizedLabel.includes('high')) {
        return "You're doing well. Keep up the strong momentum and consistency.";
    }

    return 'Complete your check-in to get personalized wellbeing guidance.';
};

const decodeSvgDataUri = (uri = '') => {
    if (!uri || typeof uri !== 'string') return null;
    if (!uri.startsWith('data:image/svg+xml')) return null;
    const commaIndex = uri.indexOf(',');
    if (commaIndex < 0) return null;
    const encoded = uri.slice(commaIndex + 1);
    try {
        return decodeURIComponent(encoded);
    } catch {
        return encoded;
    }
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
    const [allCircles, setAllCircles] = useState([]);
    const [selectedCircleId, setSelectedCircleId] = useState('');
    const [wellbeing, setWellbeing] = useState({ score: null, label: '' });
    const [challenges, setChallenges] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [showAssessment, setShowAssessment] = useState(false);
    const [assessmentType, setAssessmentType] = useState('daily'); // 'daily' or 'weekly'
    const [memberProfiles, setMemberProfiles] = useState({});
    const [activeMemberIdsMap, setActiveMemberIdsMap] = useState({});
    const [refreshing, setRefreshing] = useState(false);
    const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
    const [lastUpdatedAt, setLastUpdatedAt] = useState(0);
    const primaryCircleStorageKey = user?.uid ? `dashboard_primary_circle:${user.uid}` : '';

    const localWellbeingFallback = useCallback(() => {
        const resolved = resolveMemberWellbeing(userData || {});
        return {
            score: typeof resolved.score === 'number' ? resolved.score : 0,
            label: resolved.label || 'No data',
            streak: Number(userData?.streak || 0)
        };
    }, [userData]);

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
        if (!primaryCircleStorageKey) return;
        AsyncStorage.getItem(primaryCircleStorageKey)
            .then((saved) => {
                if (saved) setSelectedCircleId(saved);
            })
            .catch(() => {});
    }, [primaryCircleStorageKey]);

    useEffect(() => {
        console.log('DashboardScreen mounted. User:', user?.email);
        const hydrate = async () => {
            if (!user?.uid) return;
            const cached = await screenCacheService.get(`dashboard:${user.uid}`);
            if (!cached) return;
            if (cached?.wellbeing && typeof cached.wellbeing === 'object') {
                const score = typeof cached.wellbeing?.score === 'number' ? cached.wellbeing.score : null;
                const label = cached.wellbeing?.label || 'No data';
                if (score != null) {
                    setWellbeing({
                        score,
                        label,
                        streak: Number(cached.wellbeing?.streak || 0)
                    });
                }
            }
            if (Array.isArray(cached?.challenges)) setChallenges(cached.challenges);
            if (Array.isArray(cached?.recommendations)) setRecommendations(cached.recommendations);
        };
        hydrate();
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
                setAllCircles(sorted);
                setLastUpdatedAt(Date.now());
                setSelectedCircleId((previous) => {
                    if (!sorted.length) return '';
                    const selectedStillExists = previous && sorted.some((item) => item.id === previous);
                    if (selectedStillExists) return previous;
                    const fallbackId = sorted[0].id;
                    if (primaryCircleStorageKey) {
                        AsyncStorage.setItem(primaryCircleStorageKey, fallbackId).catch(() => {});
                    }
                    return fallbackId;
                });
            });
            return () => unsubscribe();
        }
    }, [user, primaryCircleStorageKey]);

    const selectedCircle = useMemo(() => {
        if (!allCircles.length) return null;
        const found = allCircles.find((item) => item.id === selectedCircleId);
        return found || allCircles[0] || null;
    }, [allCircles, selectedCircleId]);

    useEffect(() => {
        let cancelled = false;
        const loadActiveMembers = async () => {
            const ids = (allCircles || []).map((circle) => circle?.id).filter(Boolean);
            if (!ids.length) {
                if (!cancelled) setActiveMemberIdsMap({});
                return;
            }
            const map = await fetchActiveMemberIdsMap(ids);
            if (!cancelled) setActiveMemberIdsMap(map);
        };
        loadActiveMembers();
        return () => { cancelled = true; };
    }, [allCircles]);

    useEffect(() => {
        if (getDisplayMemberIds(selectedCircle?.id, selectedCircle?.members || [], activeMemberIdsMap).length) {
            loadMemberProfiles(selectedCircle);
        } else {
            setMemberProfiles({});
        }
    }, [selectedCircle?.id, activeMemberIdsMap, user?.uid]);

    useEffect(() => {
        if (!user?.uid) return undefined;
        return assessmentService.subscribeToWellbeingStats(user.uid, (stats) => {
            if (!stats) return;
            setWellbeing({
                score: typeof stats.score === 'number' ? stats.score : 0,
                label: stats.label || 'No data',
                streak: Number(stats.streak || 0)
            });
        });
    }, [user?.uid]);

    const fetchDashboardData = async () => {
        try {
            const [stats, challs, recs] = await Promise.all([
                assessmentService.getWellbeingStats(),
                assessmentService.getKeyChallenges(),
                assessmentService.getRecommendedContent()
            ]);
            const hasScore = typeof stats?.score === 'number';
            setWellbeing(hasScore ? stats : localWellbeingFallback());
            setChallenges(challs);
            setRecommendations(recs);
            if (user?.uid) {
                screenCacheService.set(`dashboard:${user.uid}`, {
                    wellbeing: hasScore ? stats : localWellbeingFallback(),
                    challenges: challs || [],
                    recommendations: recs || []
                });
            }
        } catch (err) {
            console.log("Error fetching dashboard data", err);
            setWellbeing(localWellbeingFallback());
        } finally {
            setLastUpdatedAt(Date.now());
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
        const activeIds = getDisplayMemberIds(circle?.id, circle?.members || [], activeMemberIdsMap);
        if (!activeIds.length) return;

        try {
            const profiles = {};
            const memberIds = activeIds.slice(0, 5);

            await Promise.all(memberIds.map(async (memberId) => {
                if (memberId === user?.uid) return;
                try {
                    const memberDoc = await getDoc(doc(db, 'users', memberId));
                    if (!memberDoc.exists()) return;
                    const data = memberDoc.data();
                    const wellbeing = resolveMemberWellbeing(data);
                    profiles[memberId] = {
                        name: data.name || data.displayName || 'Member',
                        photoURL: data.photoURL || '',
                        wellbeingScore: wellbeing.score,
                        wellbeingLabel: wellbeing.label,
                        wellbeingStatus: data.wellbeingStatus || ''
                    };
                } catch {
                    // Keep dashboard rendering resilient even if one profile fetch fails.
                }
            }));

            setMemberProfiles(profiles);
        } catch (error) {
            console.error('Error loading member profiles:', error);
        }
    };



    const currentDate = formatDateUK(new Date());
    const lastSyncLabel = lastUpdatedAt ? formatTimeUK(new Date(lastUpdatedAt)) : 'now';
    const selfResolvedWellbeing = resolveMemberWellbeing(userData || {});
    const selfRingFallbackScore = typeof selfResolvedWellbeing.score === 'number'
        ? selfResolvedWellbeing.score
        : (typeof wellbeing?.score === 'number' ? wellbeing.score : null);
    const selfRingFallbackLabel = selfResolvedWellbeing.label || wellbeing?.label || '';
    const effectiveWellbeingScore = typeof wellbeing?.score === 'number' ? wellbeing.score : selfResolvedWellbeing.score;
    const effectiveWellbeingLabel = wellbeing?.label || selfResolvedWellbeing.label || '';
    const wellbeingDescription = getWellbeingScoreMessage(effectiveWellbeingScore, effectiveWellbeingLabel);
    const selfProfile = {
        name: userData?.name || user?.displayName || 'You',
        photoURL: userData?.photoURL || user?.photoURL || '',
        wellbeingScore: selfRingFallbackScore,
        wellbeingLabel: selfRingFallbackLabel,
        wellbeingStatus: userData?.wellbeingStatus || ''
    };
    const selectedCircleMemberIds = useMemo(
        () => getDisplayMemberIds(selectedCircle?.id, selectedCircle?.members || [], activeMemberIdsMap),
        [selectedCircle?.id, selectedCircle?.members, activeMemberIdsMap]
    );
    const prioritizedSelectedMemberIds = useMemo(() => {
        if (!selectedCircleMemberIds.length) return [];
        if (!user?.uid || !selectedCircleMemberIds.includes(user.uid)) return selectedCircleMemberIds;
        return [user.uid, ...selectedCircleMemberIds.filter((id) => id !== user.uid)];
    }, [selectedCircleMemberIds, user?.uid]);
    const handleSelectPrimaryCircle = async (circleId) => {
        setSelectedCircleId(circleId);
        if (primaryCircleStorageKey) {
            await AsyncStorage.setItem(primaryCircleStorageKey, circleId).catch(() => {});
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

            {/* Header */}
            <View style={[
                styles.header,
                Platform.OS === 'ios'
                    ? { marginTop: 0, paddingTop: Math.max(2, insets.top * 0.15) }
                    : null
            ]}>
                <View style={styles.dateContainer}>
                    <View style={styles.calendarIconContainer}>
                        <Ionicons name="calendar" size={18} color={COLORS.primary} />
                    </View>
                    <Text style={styles.dateText}>{currentDate}</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                        <Feather name="refresh-cw" size={18} color="#333" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.notificationButton}
                        onPress={() => navigation.navigate('Notifications')}
                    >
                        <Ionicons name="notifications" size={24} color="#333" />
                        {hasUnreadNotifications && <View style={styles.notificationDot} />}
                    </TouchableOpacity>
                </View>
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
                            name={userData?.name || user?.displayName || user?.email?.split('@')?.[0] || 'User'}
                            size={60}
                            showWellbeingRing
                            wellbeingScore={effectiveWellbeingScore}
                            wellbeingLabel={effectiveWellbeingLabel || userData?.wellbeingStatus}
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
                            {wellbeingDescription}
                        </Text>
                        <TouchableOpacity
                            style={styles.checkDetailsButton}
                            onPress={() => {
                                if (typeof effectiveWellbeingScore === 'number' && effectiveWellbeingScore > 0) {
                                    navigation.navigate('Stats');
                                } else {
                                    navigation.navigate('Assessment');
                                }
                            }}
                        >
                            <Text style={styles.checkDetailsText}>
                                {(typeof effectiveWellbeingScore === 'number' && effectiveWellbeingScore > 0) ? "Check Details" : "Take Assessment"}
                            </Text>
                            <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                    <CircularProgress score={effectiveWellbeingScore} label={effectiveWellbeingLabel} />
                </View>

                {/* Circles Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Circles</Text>
                    <TouchableOpacity style={styles.seeAllButton} onPress={() => navigation.navigate('SupportGroups', { scope: 'joined' })}>
                        <Text style={styles.seeAllText}>See All</Text>
                        <Ionicons name="chevron-forward" size={14} color="#FFA726" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.refreshHintText}>Live circle updates. Pull down or tap refresh. Last synced {lastSyncLabel}.</Text>

                {allCircles.length > 1 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.primaryChipsRow}>
                        {allCircles.map((item) => {
                            const selected = selectedCircle?.id === item.id;
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.primaryChip, selected && styles.primaryChipActive]}
                                    onPress={() => handleSelectPrimaryCircle(item.id)}
                                >
                                    <Text style={[styles.primaryChipText, selected && styles.primaryChipTextActive]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                )}

                {/* User-selected primary circle card */}
                {!selectedCircle ? (
                    <View style={styles.circleCard}>
                        <Text style={{ textAlign: 'center', color: '#757575', padding: 20 }}>
                            You haven't joined any circles yet.
                            {'\n'}Go to Explore to find one!
                        </Text>
                    </View>
                ) : (
                        <TouchableOpacity
                            key={selectedCircle.id}
                            style={styles.circleCard}
                            disabled={true} // Disable card click, using buttons instead
                        >
                            <View style={styles.circleHeader}>
                                <View>
                                    <Text style={styles.circleTitle}>{selectedCircle.name}</Text>
                                    <Text style={styles.circleMembers}>{getActiveMemberCount(selectedCircle.id, selectedCircle.members, activeMemberIdsMap)} Members • High Activity</Text>
                                </View>
                                {/* Rating Badge */}
                                <View style={styles.scoreBadge}>
                                    <Ionicons name="star" size={12} color="#00C853" style={{ marginRight: 4 }} />
                                    <Text style={styles.scoreBadgeText}>{calculateCircleRating(selectedCircle)}</Text>
                                </View>
                            </View>

                            {/* Premium Member Stack */}
                            {selectedCircleMemberIds.length > 0 ? (
                                <View style={styles.memberStackContainer}>
                                    <CircleMemberLane
                                        members={
                                            [...prioritizedSelectedMemberIds]
                                                .slice(0, 6)
                                                .map((memberId) => {
                                                    const profile = memberId === user?.uid ? selfProfile : memberProfiles[memberId];
                                                    if (!profile) return null;
                                                    return {
                                                        uid: memberId,
                                                        name: profile?.name,
                                                        photoURL: profile?.photoURL,
                                                        wellbeingScore: profile?.wellbeingScore,
                                                        wellbeingLabel: profile?.wellbeingLabel,
                                                        wellbeingStatus: profile?.wellbeingStatus,
                                                    };
                                                })
                                                .filter(Boolean)
                                        }
                                        prioritizeUid={user?.uid || null}
                                        maxVisible={6}
                                        avatarSize={34}
                                    />
                                    <View style={styles.stackInfoContainer}>
                                        <Text style={styles.stackInfoText}>
                                            <Text style={styles.highlightText}>{getActiveMemberCount(selectedCircle.id, selectedCircle.members, activeMemberIdsMap)} members</Text> are active
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
                                onPress={() => navigation.navigate('CircleAnalysis', { circle: selectedCircle })}
                            >
                                <Text style={styles.viewCircleButtonText}>View Circle Analysis</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                )}

                {allCircles.length > 1 && (
                    <View style={styles.analysisQuickList}>
                        <Text style={styles.analysisQuickListTitle}>Analyze Other Joined Circles</Text>
                        <View style={styles.analysisQuickButtonsRow}>
                            {allCircles
                                .filter((item) => item.id !== selectedCircle?.id)
                                .map((item) => (
                                    <TouchableOpacity
                                        key={`analysis_${item.id}`}
                                        style={styles.analysisQuickButton}
                                        onPress={() => navigation.navigate('CircleAnalysis', { circle: item })}
                                    >
                                        <Text style={styles.analysisQuickButtonText} numberOfLines={1}>{item.name}</Text>
                                    </TouchableOpacity>
                                ))}
                        </View>
                    </View>
                )}

                {/* Key Challenges */}
                <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Key Challenges</Text>
                <Text style={styles.keyChallengesHint}>Insights only</Text>

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
                            (() => {
                                const svgXml = decodeSvgDataUri(item.image);
                                return (
                                    <TouchableOpacity
                                        key={item.id || index}
                                        style={styles.recommendationCard}
                                        onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
                                    >
                                        <View style={[styles.recommendationImageContainer, { backgroundColor: item.color || '#E0F7FA' }]}>
                                            {svgXml ? (
                                                <SvgXml xml={svgXml} width="100%" height="100%" style={styles.recommendationSvg} />
                                            ) : item.image ? (
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
                                );
                            })()
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
        marginTop: -24,
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    refreshButton: {
        backgroundColor: '#FFF',
        padding: 10,
        borderRadius: 50,
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
    refreshHintText: {
        marginTop: -8,
        marginBottom: 10,
        fontSize: 12,
        color: '#667085',
        fontWeight: '500',
    },
    primaryChipsRow: {
        marginBottom: 10,
    },
    primaryChip: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginRight: 8,
        maxWidth: 170,
    },
    primaryChipActive: {
        backgroundColor: '#E0F2F1',
        borderColor: COLORS.primary,
    },
    primaryChipText: {
        color: '#4B5563',
        fontSize: 13,
        fontWeight: '600',
    },
    primaryChipTextActive: {
        color: COLORS.primary,
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
    analysisQuickList: {
        marginTop: -12,
        marginBottom: 18,
    },
    analysisQuickListTitle: {
        fontSize: 13,
        color: '#4B5563',
        marginBottom: 8,
        fontWeight: '600',
    },
    analysisQuickButtonsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    analysisQuickButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        paddingVertical: 8,
        paddingHorizontal: 10,
        maxWidth: '48%',
    },
    analysisQuickButtonText: {
        color: '#1F2937',
        fontWeight: '600',
        fontSize: 12,
    },
    keyChallengesHint: {
        marginTop: -8,
        marginBottom: 10,
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
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
        marginBottom: 12,
        marginTop: 8,
        alignItems: 'center', // Center vertically within container (if row) or horizontally (if col)
        width: '100%',     // Ensure full width for centering
    },
    avatarStack: {
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        marginBottom: 12,
        position: 'relative',
        width: '100%',
        minHeight: 78,
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
    recommendationSvg: {
        borderRadius: 20,
        overflow: 'hidden',
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
