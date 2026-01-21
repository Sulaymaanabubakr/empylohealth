import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Image, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import { circleService } from '../services/api/circleService';
import { resourceService } from '../services/api/resourceService';
import BottomNavigation from '../components/BottomNavigation';

const { width } = Dimensions.get('window');

const ExploreScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets(); // Add hook
    const [activeTab, setActiveTab] = useState('Self-development');
    const [activeFilter, setActiveFilter] = useState('Love');
    const [activities, setActivities] = useState([]);
    const [supportGroups, setSupportGroups] = useState([]);
    const [affirmations, setAffirmations] = useState([]);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);

    useEffect(() => {
        const loadContent = async () => {
            try {
                setError(null);
                console.log('ExploreScreen: fetching content...');
                const [items, circles, affs] = await Promise.all([
                    resourceService.getExploreContent(),
                    circleService.getAllCircles(),
                    resourceService.getAffirmations()
                ]);
                console.log('ExploreScreen: fetched', items.length, 'resources,', circles.length, 'circles,', affs.length, 'affirmations');
                setActivities(items);
                setSupportGroups(circles);
                setAffirmations(affs);
            } catch (err) {
                console.error("ExploreScreen Error:", err);
                setError(err.message || "Failed to load content");
            } finally {
                setLoading(false);
            }
        };
        loadContent();
    }, []);

    const displayedActivities = activities.filter(item =>
        activeTab === 'Self-development' ? item.category === 'Self-development' : item.category === 'Group activities'
    );
    // If empty (e.g. first run before seed), maybe show static fallback or specific empty state.
    // For now, assuming backend seed is run or will be run.

    const filters = ['Love', 'Hard work', 'Career', 'Courage', 'Relationships'];
    const filteredAffirmations = affirmations.filter((item) => {
        if (!activeFilter) return true;
        const tags = item.tags || [];
        return tags.includes(activeFilter);
    });

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Explore</Text>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
                    <TextInput
                        placeholder="Search anything..."
                        placeholderTextColor="#9E9E9E"
                        style={styles.searchInput}
                    />
                </View>

                {/* Segmented Control */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Self-development' && styles.activeTab]}
                        onPress={() => setActiveTab('Self-development')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Self-development' && styles.activeTabText]}>Self-development</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'Group activities' && styles.activeTab]}
                        onPress={() => setActiveTab('Group activities')}
                    >
                        <Text style={[styles.tabText, activeTab === 'Group activities' && styles.activeTabText]}>Group activities</Text>
                    </TouchableOpacity>
                </View>

                {/* Recommended Activities */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recommended activities</Text>
                    <Text style={styles.seeAllText}>See all</Text>
                </View>

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color={COLORS.error || '#FF5252'} />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={() => {
                            setLoading(true);
                            setError(null);
                            // Re-trigger effect? For now just manual reload via navigation or we need to extract loadContent
                        }}>
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    </View>
                ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                        {displayedActivities.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={[styles.activityCard, { backgroundColor: item.color || '#F3F4F6' }]}
                                onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
                            >
                                <View style={styles.timeBadge}>
                                    <Text style={styles.timeText}>{item.time}</Text>
                                </View>
                                {item.image ? (
                                    <Image
                                        source={{ uri: item.image }}
                                        style={styles.activityImage}
                                        resizeMode="contain"
                                    />
                                ) : null}
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>{item.title}</Text>
                                    <Text style={[styles.activityTag, { color: item.tag === 'LEARN' ? '#EF6C00' : '#00695C' }]}>
                                        {item.tag}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}

                {!loading && displayedActivities.length === 0 && (
                    <Text style={styles.emptyStateText}>No activities yet.</Text>
                )}

                {/* Support Groups Preview (Only for Group activities tab) */}
                {activeTab === 'Group activities' && (
                    <View style={{ marginTop: 24 }}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Support Groups</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('SupportGroups')}>
                                <Text style={styles.seeAllText}>See all</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={{ paddingHorizontal: SPACING.lg }}>
                            <Text style={{ color: '#757575', marginBottom: 12 }}>Showing support groups near you</Text>
                            {supportGroups.slice(0, 3).map((group) => (
                                <View key={group.id} style={styles.groupCardPreview}>
                                    <Image
                                        source={group.image ? { uri: group.image } : require('../assets/images/icon_support_community.png')}
                                        style={styles.groupImagePreview}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Text style={styles.groupNamePreview}>{group.name}</Text>
                                            {/* {group.verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />} */}
                                        </View>
                                        <Text style={styles.groupMembersPreview}>{group.members?.length || 0} members</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.viewButtonPreview}
                                        onPress={() => navigation.navigate('SupportGroupDetail', { group })}
                                    >
                                        <Text style={styles.viewButtonTextPreview}>VIEW</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Daily Affirmations */}
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Daily Affirmations</Text>

                {/* Filters */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.affirmationRow}>
                    {filteredAffirmations.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.affirmationCard}
                            onPress={() => navigation.navigate('Affirmations')}
                        >
                            {item.image ? (
                                <Image source={{ uri: item.image }} style={styles.affirmationImage} />
                            ) : null}
                            <View style={styles.affirmationOverlay}>
                                <View style={styles.affirmationHeader}>
                                    <Text style={styles.affirmationDate}>{item.tag || item.date}</Text>
                                    <TouchableOpacity style={styles.expandButton}>
                                        <Ionicons name="resize" size={12} color="#FFF" />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.affirmationText}>{item.title}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {!loading && filteredAffirmations.length === 0 && (
                    <Text style={styles.emptyStateText}>No affirmations yet.</Text>
                )}

            </ScrollView>

            {/* Bottom Navigation */}
            <BottomNavigation navigation={navigation} activeTab="Explore" />
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
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: 0,
        marginTop: -24, // Matched to Dashboard spacing
        paddingBottom: SPACING.xs,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ECEFF1',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingBottom: 110,
    },
    headerTitle: {
        fontSize: 28, // Increased size
        fontWeight: '800',
        color: '#1A1A1A',
        flex: 1,
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        marginTop: 40, // Much more space from header
        marginBottom: SPACING.lg,
        borderWidth: 1,
        borderColor: '#F5F5F5',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1A1A1A',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#ECEFF1',
        borderRadius: 25,
        padding: 4,
        marginBottom: SPACING.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 22,
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#757575',
    },
    activeTabText: {
        color: '#1A1A1A',
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    loadingContainer: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    errorContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        color: '#FF5252',
        textAlign: 'center',
        marginVertical: 10,
        fontSize: 14,
    },
    retryButton: {
        padding: 10,
    },
    retryText: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    seeAllText: {
        fontSize: 14,
        color: '#FFA726',
        fontWeight: '700',
    },
    horizontalScroll: {
        marginBottom: SPACING.xl,
        marginHorizontal: -SPACING.lg, // Allow full bleed
        paddingHorizontal: SPACING.lg,
    },
    activityCard: {
        width: width * 0.42,
        height: 220,
        borderRadius: 24,
        padding: 16,
        marginRight: 16,
        justifyContent: 'space-between',
    },
    timeBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    activityImage: {
        width: '100%',
        height: 100,
        marginBottom: 10,
    },
    activityContent: {

    },
    activityTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 4,
        lineHeight: 22,
    },
    activityTag: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    filterScroll: {
        flexDirection: 'row',
        marginBottom: 24,
        marginTop: 16, // Added space between title and filters
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#009688',
        marginRight: 8,
        backgroundColor: '#FFFFFF',
    },
    activeFilterChip: {
        backgroundColor: '#E0F2F1',
    },
    filterText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    activeFilterText: {
        color: '#1A1A1A',
    },
    affirmationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    affirmationCard: {
        width: '48%',
        height: 220, // Taller card
        borderRadius: 24,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        backgroundColor: '#FFF',
    },
    affirmationImage: {
        width: '100%',
        height: '100%',
    },
    affirmationOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.2)', // Darken slightly
        padding: 16,
        justifyContent: 'space-between',
    },
    affirmationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    affirmationDate: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '600',
    },
    expandButton: {
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 12,
        padding: 6,
    },
    affirmationText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        lineHeight: 24,
    },
    emptyStateText: {
        color: '#757575',
        textAlign: 'center',
        marginTop: 8,
    },
    groupCardPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14, // Slightly larger padding
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    groupImagePreview: {
        width: 54, // Larger image (was 40/50)
        height: 54,
        borderRadius: 27,
        marginRight: 14,
    },
    groupNamePreview: {
        fontSize: 16, // Larger text (was 14)
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    groupMembersPreview: {
        fontSize: 13,
        color: '#757575',
    },
    viewButtonPreview: {
        paddingHorizontal: 18,
        paddingVertical: 8, // Larger button
        borderRadius: 8,
        borderWidth: 1.5, // Slightly thicker border
        borderColor: COLORS.primary,
    },
    viewButtonTextPreview: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.primary,
    },
    bottomNavContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 24 : 12,
        backgroundColor: 'transparent',
        zIndex: 100, // Ensure it sits on top
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

export default ExploreScreen;
