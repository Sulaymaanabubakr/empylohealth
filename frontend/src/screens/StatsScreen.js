import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { assessmentService } from '../services/api/assessmentService';
import { formatDateUK, formatTimeUK } from '../utils/dateFormat';

const StatsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ current: 0, average: 0, count: 0 });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await assessmentService.getAssessmentHistory(10);
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
        if (score >= 80) return '#4CAF50';
        if (score >= 60) return '#FFA726';
        return '#EF5350';
    };

    const getScoreLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        return 'Needs Care';
    };

    const formatDate = (dateObj) => {
        if (!dateObj) return '';
        let d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
        return formatDateUK(d);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Minimalist Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Dashboard')}
                    style={styles.backButton}
                >
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Wellbeing</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    </View>
                ) : history.length === 0 ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIconContainer}>
                            <Ionicons name="stats-chart" size={64} color="#D1D9E6" />
                        </View>
                        <Text style={styles.emptyText}>No check-ins yet</Text>
                        <Text style={styles.emptySubtext}>Complete your first daily assessment to see your progress!</Text>

                        <TouchableOpacity style={styles.reloadButton} onPress={loadData}>
                            <Text style={styles.reloadButtonText}>Refresh Data</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <Text style={styles.sectionLabel}>OVERVIEW</Text>
                        <View style={styles.statsRow}>
                            <View style={[styles.statCard, { backgroundColor: COLORS.primary }]}>
                                <Text style={styles.statLabelLight}>Latest Score</Text>
                                <Text style={styles.statValueLight}>{stats.current}</Text>
                                <View style={styles.labelBadgeLight}>
                                    <Text style={styles.labelBadgeTextLight}>{getScoreLabel(stats.current)}</Text>
                                </View>
                            </View>

                            <View style={styles.statCardWhite}>
                                <Text style={styles.statLabelDark}>Weekly Avg</Text>
                                <Text style={styles.statValueDark}>{stats.average}</Text>
                                <Text style={styles.statSubtextDark}>{stats.count} Logs</Text>
                            </View>
                        </View>

                        <Text style={[styles.sectionLabel, { marginTop: 10 }]}>RECENT HISTORY</Text>
                        {history.map((item, index) => (
                            <View key={item.id || index} style={styles.historyCard}>
                                <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(item.score || 0) }]}>
                                    <Text style={styles.historyScore}>{item.score || 0}</Text>
                                </View>
                                <View style={styles.historyContent}>
                                    <View style={styles.historyHeader}>
                                        <Text style={styles.historyDate}>{formatDate(item.createdAt)}</Text>
                                        <Text style={styles.historyTime}>
                                            {item.createdAt ? formatTimeUK(item.createdAt) : ''}
                                        </Text>
                                    </View>
                                    <Text style={styles.historyMood}>
                                        {item.mood ? `Feeling ${item.mood}` : getScoreLabel(item.score)}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#D1D9E6" />
                            </View>
                        ))}
                    </>
                )}
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
    scrollContent: {
        padding: 20,
        paddingTop: 30,
    },
    loaderContainer: {
        marginTop: 100,
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#A0AEC0',
        letterSpacing: 1.5,
        marginBottom: 15,
        marginLeft: 5,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statCard: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    statCardWhite: {
        width: '48%',
        padding: 20,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 4,
    },
    statLabelLight: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 10,
    },
    statValueLight: {
        fontSize: 36,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 10,
    },
    labelBadgeLight: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    labelBadgeTextLight: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statLabelDark: {
        fontSize: 13,
        fontWeight: '600',
        color: '#718096',
        marginBottom: 10,
    },
    statValueDark: {
        fontSize: 36,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    statSubtextDark: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.primary,
    },
    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 24,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    scoreIndicator: {
        width: 50,
        height: 50,
        borderRadius: 18,
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
        alignItems: 'center',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    historyTime: {
        fontSize: 12,
        color: '#A0AEC0',
        fontWeight: '600',
    },
    historyMood: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 10,
    },
    emptySubtext: {
        fontSize: 15,
        color: '#718096',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 22,
        marginBottom: 30,
    },
    reloadButton: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 25,
        paddingVertical: 12,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    reloadButtonText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 14,
    },
});

export default StatsScreen;
