import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../theme/theme';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Avatar from '../components/Avatar';
import { db } from '../services/firebaseConfig';
import { doc, getDoc, collection, query, getDocs, orderBy, limit } from 'firebase/firestore';

const { width } = Dimensions.get('window');

const CircleAnalysisScreen = ({ route, navigation }) => {
    const { circle } = route.params || {};
    const [memberStats, setMemberStats] = useState([]);
    const [circleStreak, setCircleStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activityData, setActivityData] = useState({
        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        datasets: [{ data: [0, 0, 0, 0, 0, 0, 0] }]
    });

    useEffect(() => {
        if (circle?.id) {
            fetchRealTimeData();
        }
    }, [circle]);

    const calculateStreak = (allMessages) => {
        const activeDays = new Set();
        allMessages.forEach(msg => {
            let d = null;
            if (msg.createdAt?.toDate) d = msg.createdAt.toDate();
            else if (msg.createdAt?.toMillis) d = new Date(msg.createdAt.toMillis());
            if (d) activeDays.add(d.toDateString());
        });

        let streak = 0;
        let checkDate = new Date();
        // Check if there was activity today or yesterday to continue/start a streak
        if (!activeDays.has(checkDate.toDateString())) {
            checkDate.setDate(checkDate.getDate() - 1);
        }

        while (activeDays.has(checkDate.toDateString())) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        return streak;
    };

    const fetchRealTimeData = async () => {
        try {
            setLoading(true);

            // 1. Ensure we have the full circle object with chatId
            let currentCircle = circle;
            if (!currentCircle?.chatId && currentCircle?.id) {
                const circleDoc = await getDoc(doc(db, 'circles', currentCircle.id));
                if (circleDoc.exists()) {
                    currentCircle = { id: circleDoc.id, ...circleDoc.data() };
                }
            }

            // 2. Determine where messages are stored
            const chatId = currentCircle?.chatId || currentCircle?.id;
            if (!chatId) {
                setLoading(false);
                return;
            }

            const messagesRef = collection(db, 'chats', chatId, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(200));

            let messageSnap = await getDocs(q);

            // Fallback: Check if they are in circles subcollection
            if (messageSnap.empty && currentCircle.id !== chatId) {
                const legacyRef = collection(db, 'circles', currentCircle.id, 'messages');
                const legacyQ = query(legacyRef, orderBy('createdAt', 'desc'), limit(200));
                messageSnap = await getDocs(legacyQ);
            }

            const messages = messageSnap.docs.map(doc => doc.data());

            // 3. Process Activity Chart Data (Last 7 Days)
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
                    // Update Chart Data
                    const diffTime = today.getTime() - msgDate.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays >= 0 && diffDays < 7) {
                        const index = 6 - diffDays;
                        if (index >= 0 && index < 7) {
                            last7DaysCounts[index]++;
                        }
                    }

                    // Update Leaderboard Data
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
                    color: (opacity = 1) => `rgba(0, 200, 83, ${opacity})`,
                    strokeWidth: 2
                }]
            });

            setCircleStreak(calculateStreak(messages));

            // 4. Fetch profiles for all members
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
        else if (memberCount > 10) score += 0.2;
        else if (memberCount > 2) score += 0.1;

        const lastUpdate = circleObj.updatedAt?.toMillis?.() || circleObj.lastMessageAt?.toMillis?.() || 0;
        if (lastUpdate > 0) {
            const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
            if (hoursSinceUpdate < 24) score += 0.4;
            else if (hoursSinceUpdate < 72) score += 0.2;
            else if (hoursSinceUpdate < 168) score += 0.1;
        }

        return Math.min(score, 5.0).toFixed(1);
    };

    const chartConfig = {
        backgroundGradientFrom: "#FFF",
        backgroundGradientTo: "#FFF",
        color: (opacity = 1) => `rgba(0, 200, 83, ${opacity})`,
        strokeWidth: 3,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    };

    const getRankIcon = (index) => {
        if (index === 0) return { icon: "trophy", color: "#FFD700" };
        if (index === 1) return { icon: "medal", color: "#C0C0C0" };
        if (index === 2) return { icon: "medal", color: "#CD7F32" };
        return { icon: "shield-outline", color: "#9E9E9E" };
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F7F6" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#212121" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Circle Insights</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Circle Health Card */}
                <View style={styles.healthCard}>
                    <View style={styles.healthHeader}>
                        <View>
                            <Text style={styles.healthTitle}>{circle?.name}</Text>
                            <Text style={styles.healthSubtitle}>{circle?.members?.length || 0} Members</Text>
                        </View>
                        <View style={styles.ratingBigContainer}>
                            <Ionicons name="star" size={20} color="#00C853" style={{ marginRight: 4 }} />
                            <Text style={styles.ratingBigText}>{calculateCircleRating(circle)}</Text>
                        </View>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>98%</Text>
                            <Text style={styles.statLabel}>Engagement</Text>
                        </View>
                        <View style={styles.statVerticalLine} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{circleStreak}d</Text>
                            <Text style={styles.statLabel}>Streak</Text>
                        </View>
                        <View style={styles.statVerticalLine} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>4.8</Text>
                            <Text style={styles.statLabel}>Trust Score</Text>
                        </View>
                    </View>
                </View>

                {/* Activity Chart */}
                <View style={[styles.section, { paddingRight: 0 }]}>
                    <Text style={styles.sectionTitle}>Weekly Activity</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                            data={activityData}
                            width={width - 20}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={styles.chart}
                            withDots={true}
                            withInnerLines={false}
                            withOuterLines={false}
                        />
                    </ScrollView>
                </View>

                {/* Leaderboard Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons name="podium-gold" size={24} color="#FFA000" />
                        </View>
                        <Text style={styles.sectionTitle}>Leaderboard</Text>
                    </View>
                    <Text style={styles.sectionDescription}>
                        Recognizing our top contributors based on real contributions.
                    </Text>

                    {loading ? (
                        <Text style={{ padding: 20, textAlign: 'center', color: '#999' }}>Loading real-time rankings...</Text>
                    ) : (
                        <View style={styles.leaderboardList}>
                            {memberStats.map((member, index) => {
                                const rank = getRankIcon(index);
                                return (
                                    <View key={member.id} style={styles.rankRow}>
                                        <View style={styles.rankPosition}>
                                            <MaterialCommunityIcons name={rank.icon} size={24} color={rank.color} />
                                            <Text style={[styles.rankNumber, { color: rank.color }]}>#{index + 1}</Text>
                                        </View>

                                        <View style={styles.rankUser}>
                                            <Avatar uri={member.photoURL} name={member.name} size={40} />
                                            <View style={styles.rankInfo}>
                                                <Text style={styles.rankName}>{member.name}</Text>
                                                <Text style={styles.rankLevel}>Level {member.level} • {member.contributionPoints} pts</Text>
                                            </View>
                                        </View>

                                        {index < 3 && (
                                            <View style={[styles.topBadge, { backgroundColor: rank.color + '20' }]}>
                                                <Text style={[styles.topBadgeText, { color: rank.color }]}>TOP {index + 1}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7F6',
    },
    content: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 16,
        backgroundColor: '#F4F7F6',
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#212121',
    },
    healthCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    healthHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    healthTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#212121',
        marginBottom: 4,
    },
    healthSubtitle: {
        fontSize: 14,
        color: '#757575',
        fontWeight: '500',
    },
    ratingBigContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    ratingBigText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#2E7D32',
    },
    separator: {
        height: 1,
        backgroundColor: '#F0F0F0',
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
        color: '#212121',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: '#9E9E9E',
        textTransform: 'uppercase',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    statVerticalLine: {
        width: 1,
        height: 30,
        backgroundColor: '#F0F0F0',
    },
    section: {
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFF8E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#212121',
    },
    sectionDescription: {
        fontSize: 14,
        color: '#757575',
        marginBottom: 20,
        lineHeight: 20,
    },
    chart: {
        marginVertical: 8,
        borderRadius: 24,
        paddingRight: 40,
    },
    leaderboardList: {
        backgroundColor: '#FFF',
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F5F5F5',
    },
    rankPosition: {
        alignItems: 'center',
        width: 40,
        marginRight: 8,
    },
    rankNumber: {
        fontSize: 12,
        fontWeight: '800',
        marginTop: 2,
    },
    rankUser: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    rankInfo: {
        marginLeft: 12,
    },
    rankName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
    },
    rankLevel: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    topBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    topBadgeText: {
        fontSize: 10,
        fontWeight: '800',
    },
});

export default CircleAnalysisScreen;
