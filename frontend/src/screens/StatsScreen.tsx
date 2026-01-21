import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { assessmentService } from '../services/api/assessmentService';
import { auth } from '../services/firebaseConfig'; // Ensure auth is imported if needed for checking user

const StatsScreen = ({ navigation }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ current: 0, average: 0, count: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // DEBUG: Log to see if this runs
            console.log("StatsScreen: Loading real data...");

            const data = await assessmentService.getAssessmentHistory(10);
            console.log("StatsScreen: Data fetched:", data);

            setHistory(data);

            if (data.length > 0) {
                const current = data[0].score || 0;
                const sum = data.reduce((acc, item) => acc + (item.score || 0), 0);
                const average = Math.round(sum / data.length);
                setStats({ current, average, count: data.length });
            }
        } catch (error) {
            console.error("StatsScreen: Failed to load stats", error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 80) return '#4CAF50'; // Green
        if (score >= 60) return '#FFA726'; // Orange
        return '#EF5350'; // Red
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Care';
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        // Handle Firestore Timestamp or Date object or ISO string
        let d;
        if (dateObj.toDate) d = dateObj.toDate();
        else d = new Date(dateObj);

        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Wellbeing</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {loading ? (
                    <View style={{ marginTop: 50 }}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="stats-chart-outline" size={64} color="#DDD" />
                        <Text style={styles.emptyText}>No check-ins yet.</Text>
                        <Text style={styles.emptySubtext}>Complete your first daily assessment to see your stats!</Text>

                        {/* DEBUG BUTTON */}
                        <TouchableOpacity style={{ marginTop: 20 }} onPress={loadData}>
                            <Text style={{ color: COLORS.primary }}>Reload Data</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Summary Cards Row */}
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                                <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.8)' }]}>Latest Score</Text>
                                <Text style={[styles.statValue, { color: '#FFF' }]}>{stats.current}</Text>
                                <Text style={[styles.statSubtext, { color: 'rgba(255,255,255,0.9)' }]}>
                                    {getScoreLabel(stats.current)}
                                </Text>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: '#FFFFFF' }]}>
                                <Text style={styles.statLabel}>Weekly Avg</Text>
                                <Text style={[styles.statValue, { color: '#1A1A1A' }]}>{stats.average}</Text>
                                <Text style={styles.statSubtext}>Based on {stats.count} logs</Text>
                            </View>
                        </View>

                        <Text style={styles.sectionTitle}>Recent History</Text>

                        {/* History List */}
                        {history.map((item, index) => (
                            <View key={item.id || index} style={styles.historyCard}>
                                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(item.score || 0) }]}>
                                    <Text style={styles.historyScore}>{item.score || 0}</Text>
                                </View>
                                <View style={styles.historyContent}>
                                    <View style={styles.historyHeader}>
                                        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                                        <Text style={styles.historyTime}>
                                            {item.createdAt ? new Date(item.createdAt.toDate ? item.createdAt.toDate() : item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.historyMood}>
                                        {item.mood ? `Feeling ${item.mood}` : getScoreLabel(item.score)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: 12,
        backgroundColor: '#F8F9FA',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    scrollContent: {
        padding: SPACING.lg,
        paddingBottom: 40,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 4,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#757575',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 4,
    },
    statSubtext: {
        fontSize: 13,
        fontWeight: '600',
        color: '#757575',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 16,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 20,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    scoreIndicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyScore: {
        fontSize: 18,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    historyContent: {
        flex: 1,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    historyTime: {
        fontSize: 12,
        color: '#9E9E9E',
        fontWeight: '500',
    },
    historyMood: {
        fontSize: 14,
        color: '#757575',
    },
    emptyState: {
        alignItems: 'center',
        paddingTop: 80,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#757575',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
        marginTop: 8,
        maxWidth: 240,
    },
});

export default StatsScreen;
