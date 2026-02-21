import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Dimensions, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Avatar from '../components/Avatar';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const CircleAnalysisScreen = ({ route, navigation }) => {
    const insets = useSafeAreaInsets();
    const initialCircle = route.params?.circle;
    const circleId = initialCircle?.id;
    const [circle, setCircle] = useState(initialCircle || null);
    const [memberStats, setMemberStats] = useState([]);
    const [circleStreak, setCircleStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState({
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
    });

    useEffect(() => {
        if (!circleId) return undefined;
        const circleRef = doc(db, 'circles', circleId);
        const unsubscribe = onSnapshot(circleRef, (snap) => {
            if (snap.exists()) {
                setCircle({ id: snap.id, ...snap.data() });
            }
        }, (error) => {
            console.error('Failed to subscribe to circle analysis updates', error);
        });

        return () => unsubscribe();
    }, [circleId]);

    useEffect(() => {
        if (circle?.id) {
            fetchRealTimeData(circle);
        }
    }, [circle]);

    const calculateStreak = (allMessages) => {
        // Only count real member messages for streak; ignore system-only noise.
        const realMessages = (allMessages || []).filter((msg) => {
            const type = String(msg?.type || '').toLowerCase();
            return type !== 'system' && type !== 'private_system';
        });
        if (!realMessages.length) return 0;

        const dayMsSet = new Set();
        realMessages.forEach((msg) => {
            let d = null;
            if (msg.createdAt?.toDate) d = msg.createdAt.toDate();
            else if (msg.createdAt?.toMillis) d = new Date(msg.createdAt.toMillis());
            else if (msg.createdAt) d = new Date(msg.createdAt);
            if (!d || Number.isNaN(d.getTime())) return;
            const dayStartMs = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
            dayMsSet.add(dayStartMs);
        });

        const sortedDaysDesc = [...dayMsSet].sort((a, b) => b - a);
        if (!sortedDaysDesc.length) return 0;

        // Streak should be based on consecutive active days ending at latest active day,
        // not forced to include today.
        let streak = 1;
        let cursor = sortedDaysDesc[0];
        const oneDayMs = 24 * 60 * 60 * 1000;
        for (let i = 1; i < sortedDaysDesc.length; i += 1) {
            if ((cursor - sortedDaysDesc[i]) === oneDayMs) {
                streak += 1;
                cursor = sortedDaysDesc[i];
            } else {
                break;
            }
        }
        return streak;
    };

    const fetchRealTimeData = async (sourceCircle = circle) => {
        try {
            setLoading(true);
            const currentCircle = sourceCircle;

            const chatId = currentCircle?.chatId || currentCircle?.id;
            if (!chatId) {
                setLoading(false);
                return;
            }

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(200));
            let messageSnap = await getDocs(q);

            if (messageSnap.empty && currentCircle.id !== chatId) {
                const legacyRef = collection(db, 'circles', currentCircle.id, 'messages');
                const legacyQ = query(legacyRef, orderBy('createdAt', 'desc'), limit(200));
                messageSnap = await getDocs(legacyQ);
            }

            const messages = messageSnap.docs.map(doc => doc.data());
            const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const today = new Date();
            today.setHours(23, 59, 59, 999);

            const last7DaysLabels = [];
            const last7DaysCounts = [0, 0, 0, 0, 0, 0, 0];

            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                last7DaysLabels.push(daysShort[d.getDay()]);
            }

            const memberMessageCounts = {};
            messages.forEach(msg => {
                let msgDate = null;
                if (msg.createdAt?.toDate) msgDate = msg.createdAt.toDate();
                else if (msg.createdAt?.toMillis) msgDate = new Date(msg.createdAt.toMillis());

                if (msgDate) {
                    const diffTime = today.getTime() - msgDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays < 7) {
                        const index = 6 - diffDays;
                        if (index >= 0 && index < 7) {
                            last7DaysCounts[index]++;
                        }
                    }

                    const uid = msg.senderId || msg.userId;
                    if (uid) {
                        memberMessageCounts[uid] = (memberMessageCounts[uid] || 0) + 1;
                    }
                }
            });

            setActivityData({
                labels: last7DaysLabels,
                datasets: [{
                    data: last7DaysCounts,
                    color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
                    strokeWidth: 2
                }]
            });

            setCircleStreak(calculateStreak(messages));

            const stats = [];
            if (currentCircle.members) {
                for (const memberId of currentCircle.members) {
                    const docRef = doc(db, 'users', memberId);
                    const snap = await getDoc(docRef);
                    if (snap.exists()) {
                        const data = snap.data();
                        const msgCount = memberMessageCounts[memberId] || 0;
                        const points = 100 + (msgCount * 15);
                        const level = Math.floor(points / 60);

                        stats.push({
                            id: memberId,
                            name: data.name || data.displayName || 'Member',
                            photoURL: data.photoURL,
                            wellbeingScore: data?.wellbeingScore ?? data?.stats?.overallScore ?? null,
                            wellbeingLabel: data?.wellbeingLabel || data?.wellbeingStatus || '',
                            level: level,
                            contributionPoints: points,
                        });
                    }
                }
            }

            stats.sort((a, b) => b.contributionPoints - a.contributionPoints);
            setMemberStats(stats);

        } catch (error) {
            console.error("Error fetching real-time data:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateCircleRating = (circleObj) => {
        if (!circleObj) return "0.0";
        if (circleObj.score) return circleObj.score.toFixed(1);
        let score = 4.2;
        const memberCount = circleObj.members?.length || 0;
        if (memberCount > 50) score += 0.4;
        else if (memberCount > 20) score += 0.3;
        const lastUpdate = circleObj.updatedAt?.toMillis?.() || circleObj.lastMessageAt?.toMillis?.() || 0;
        if (lastUpdate > 0) {
            const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) score += 0.4;
        }
        return Math.min(score, 5.0).toFixed(1);
    };

    const chartConfig = {
        backgroundGradientFrom: "#FFF",
        backgroundGradientTo: "#FFF",
        color: (opacity = 1) => `rgba(0, 150, 136, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(160, 174, 192, ${opacity})`,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: COLORS.primary
        }
    };

    const getRankIcon = (index) => {
        if (index === 0) return { icon: "trophy", color: "#FFD700" };
        if (index === 1) return { icon: "medal", color: "#C0C0C0" };
        if (index === 2) return { icon: "medal", color: "#CD7F32" };
        return { icon: "shield-outline", color: "#A0AEC0" };
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Premium Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Circle Insights</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

                {/* Circle Health Card */}
                <View style={styles.healthCard}>
                    <View style={styles.healthHeader}>
                        <View>
                            <Text style={styles.healthTitle}>{circle?.name}</Text>
                            <Text style={styles.healthSubtitle}>{circle?.members?.length || 0} Members</Text>
                        </View>
                        <View style={styles.ratingBadge}>
                            <Ionicons name="star" size={16} color="#00C853" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingText}>{calculateCircleRating(circle)}</Text>
                        </View>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>98%</Text>
                            <Text style={styles.statLabel}>Activity</Text>
                        </View>
                        <View style={styles.statVerticalLine} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{circleStreak}d</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                        <View style={styles.statVerticalLine} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>Trust</Text>
                        </View>
                    </View>
                </View>

                {/* Activity Chart Section */}
                <View style={[styles.section, { paddingRight: 0 }]}>
                    <Text style={styles.sectionLabel}>WEEKLY ACTIVITY</Text>
                    <View style={styles.chartContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={activityData}
                                width={width - 40}
                                height={200}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chart}
                                withDots={true}
                                withInnerLines={false}
                                withOuterLines={false}
                            />
                        </ScrollView>
                    </View>
                </View>

                {/* Leaderboard Section */}
                <View style={[styles.section, { marginTop: 10 }]}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>LEADERBOARD</Text>
                        <MaterialCommunityIcons name="podium" size={20} color={COLORS.primary} />
                    </View>

                    <View style={styles.leaderboardCard}>
                        {loading ? (
                            <View style={{ padding: 40, alignItems: 'center' }}>
                                <ActivityIndicator color={COLORS.primary} />
                                <Text style={styles.loadingText}>Syncing ranks...</Text>
                            </View>
                        ) : memberStats.length === 0 ? (
                            <Text style={styles.emptyText}>No activity recorded yet.</Text>
                        ) : (
                            memberStats.map((member, index) => {
                                const rank = getRankIcon(index);
                                return (
                                    <View key={member.id} style={[styles.rankRow, index === memberStats.length - 1 && { borderBottomWidth: 0 }]}>
                                        <View style={styles.rankPosition}>
                                            <MaterialCommunityIcons name={rank.icon} size={24} color={rank.color} />
                                            <Text style={[styles.rankNumber, { color: rank.color }]}>#{index + 1}</Text>
                                        </View>

                                        <View style={styles.rankUser}>
                                            <Avatar
                                                uri={member.photoURL}
                                                name={member.name}
                                                size={44}
                                                showWellbeingRing
                                                wellbeingScore={member?.wellbeingScore}
                                                wellbeingLabel={member?.wellbeingLabel}
                                            />
                                            <View style={styles.rankInfo}>
                                                <Text style={styles.rankName} numberOfLines={1}>{member.name}</Text>
                                                <Text style={styles.rankLevel}>Level {member.level} • {member.contributionPoints} pts</Text>
                                            </View>
                                        </View>

                                        {index < 3 && (
                                            <View style={[styles.topBadge, { backgroundColor: rank.color + '15' }]}>
                                                <Text style={[styles.topBadgeText, { color: rank.color }]}>TOP {index + 1}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })
                        )}
                    </View>
                </View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F9FB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        backgroundColor: '#FFFFFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F7F9FB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    },
    content: {
        padding: 20,
    },
    healthCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
    },
    healthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    healthTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: '#1A1A1A',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    healthSubtitle: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    ratingText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#2E7D32',
    },
    separator: {
        height: 1,
        backgroundColor: '#F3F4F6',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#A0AEC0',
        textTransform: 'uppercase',
        fontWeight: '800',
        letterSpacing: 1,
    },
    statVerticalLine: {
        width: 1,
        height: 30,
        backgroundColor: '#F3F4F6',
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 1.5,
    },
    chartContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 20,
    },
    leaderboardCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F7F9FB',
    },
    rankPosition: {
        alignItems: 'center',
        width: 45,
        marginRight: 10,
    },
    rankNumber: {
        fontSize: 12,
        fontWeight: '900',
        marginTop: 2,
    },
    rankUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankInfo: {
        marginLeft: 12,
        flex: 1,
    },
    rankName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    rankLevel: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '700',
        marginTop: 2,
    },
    topBadge: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 12,
    },
    topBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
    loadingText: {
        marginTop: 10,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    emptyText: {
        padding: 30,
        textAlign: 'center',
        color: '#718096',
        fontWeight: '500',
    }
});

export default CircleAnalysisScreen;
