import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, StatusBar, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING } from '../theme/theme';
import Avatar from '../components/Avatar';
import { circleService } from '../services/api/circleService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { MAX_CIRCLE_MEMBERS, getCircleMemberCount } from '../services/circles/circleLimits';
import { db } from '../services/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { screenCacheService } from '../services/bootstrap/screenCacheService';
import { useModal } from '../context/ModalContext';

const FILTERS = ['All', 'Connect', 'Culture', 'Enablement', 'Green Activities', 'Mental health', 'Physical health'];

const calculateCircleRating = (circle) => {
    if (!circle) return '4.2';
    if (circle.score) return String(circle.score);

    let score = 4.2;
    const memberCount = Array.isArray(circle.members) ? circle.members.length : 0;
    if (memberCount > 50) score += 0.4;
    else if (memberCount > 20) score += 0.3;
    else if (memberCount > 10) score += 0.2;
    else if (memberCount > 2) score += 0.1;

    const lastUpdate = circle.updatedAt?.toMillis?.() || circle.lastMessageAt?.toMillis?.() || 0;
    if (lastUpdate > 0) {
        const hoursSinceUpdate = (Date.now() - lastUpdate) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) score += 0.4;
        else if (hoursSinceUpdate < 72) score += 0.2;
        else if (hoursSinceUpdate < 168) score += 0.1;
    }

    return Math.min(score, 5.0).toFixed(1);
};

const SupportGroupsScreen = ({ route }) => {
    const navigation = useNavigation();
    const { user } = useAuth();
    const { showModal } = useModal();
    const scope = route?.params?.scope || 'public';
    const showJoinedOnly = scope === 'joined';
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);
    const [memberPreviewMap, setMemberPreviewMap] = useState({});
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [deletingCircleId, setDeletingCircleId] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            const cacheKey = `${showJoinedOnly ? 'support_groups_joined' : 'support_groups_public'}:${user?.uid || 'guest'}`;
            const loadGroups = async () => {
                try {
                    const cached = await screenCacheService.get(cacheKey);
                    if (Array.isArray(cached) && cached.length > 0) {
                        setGroups(cached);
                    }
                    const circles = await circleService.getAllCircles();
                    const visible = (circles || []).filter((c) => {
                        const isMember = !!user?.uid && Array.isArray(c.members) && c.members.includes(user.uid);
                        if (showJoinedOnly) return isMember;

                        const isPublic = (c?.type || 'public') === 'public';
                        const isFull = !isMember && getCircleMemberCount(c) >= MAX_CIRCLE_MEMBERS;
                        // Public search screen should not include private circles.
                        return isPublic && !isFull;
                    });
                    setGroups(visible);
                    screenCacheService.set(cacheKey, visible);
                } catch (error) {
                    console.error('Failed to load support groups', error);
                    setGroups([]);
                }
            };
            loadGroups();
        }, [showJoinedOnly, user?.uid])
    );

    const filteredGroups = groups.filter(group => {
        const matchesSearch = (group.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const tags = group.tags || (group.category ? [group.category] : []);
        const matchesFilter = activeFilter === 'All' || tags.includes(activeFilter);
        const isMember = !!user?.uid && Array.isArray(group.members) && group.members.includes(user.uid);
        if (showJoinedOnly) {
            return matchesSearch && matchesFilter && isMember;
        }

        const isPublic = (group?.type || 'public') === 'public';
        const isFull = !isMember && getCircleMemberCount(group) >= MAX_CIRCLE_MEMBERS;
        return matchesSearch && matchesFilter && isPublic && !isFull;
    });

    useEffect(() => {
        let cancelled = false;
        const loadMemberPreviews = async () => {
            const previewEntries = await Promise.all(
                (groups || []).map(async (group) => {
                    const ids = Array.isArray(group?.members) ? group.members.slice(0, 3) : [];
                    const members = await Promise.all(ids.map(async (uid) => {
                        try {
                            const snap = await getDoc(doc(db, 'users', uid));
                            const data = snap.exists() ? snap.data() : {};
                            return {
                                uid,
                                name: data?.name || data?.displayName || 'Member',
                                photoURL: data?.photoURL || '',
                                wellbeingScore: data?.wellbeingScore ?? data?.stats?.overallScore ?? null,
                                wellbeingLabel: data?.wellbeingLabel || data?.wellbeingStatus || ''
                            };
                        } catch {
                            return { uid, name: 'Member', photoURL: '' };
                        }
                    }));
                    return [group.id, members];
                })
            );
            if (cancelled) return;
            setMemberPreviewMap(Object.fromEntries(previewEntries));
        };
        loadMemberPreviews();
        return () => { cancelled = true; };
    }, [groups]);

    useEffect(() => {
        if (!deleteInProgress || !deletingCircleId) return;
        const stillVisible = groups.some((g) => g.id === deletingCircleId);
        if (!stillVisible) {
            setDeleteInProgress(false);
            setDeletingCircleId(null);
        }
    }, [deleteInProgress, deletingCircleId, groups]);

    const renderGroupCard = ({ item, insideSwipe = false }) => (
        <TouchableOpacity
            style={[styles.groupCard, insideSwipe && styles.groupCardNoMargin]}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CircleDetail', { circle: item })}
        >
            <View style={styles.circleHeader}>
                <View>
                    <Text style={styles.circleTitle}>{item.name}</Text>
                    <Text style={styles.circleMembers}>{Array.isArray(item.members) ? item.members.length : 0} Members • High Activity</Text>
                </View>
                <View style={styles.scoreBadge}>
                    <Ionicons name="star" size={12} color="#00C853" style={{ marginRight: 4 }} />
                    <Text style={styles.scoreBadgeText}>{calculateCircleRating(item)}</Text>
                </View>
            </View>

            {(Array.isArray(item.members) && item.members.length > 0) ? (
                <View style={styles.memberStackContainer}>
                    <View style={styles.avatarStack}>
                        {(memberPreviewMap[item.id] || []).map((member, index) => (
                            <View
                                key={`${item.id}_${member.uid}`}
                                style={{
                                    marginLeft: index === 0 ? 0 : -14,
                                    zIndex: 10 - index
                                }}
                            >
                                <Avatar
                                    uri={member.photoURL}
                                    name={member.name}
                                    size={40}
                                    showWellbeingRing
                                    wellbeingScore={member?.wellbeingScore}
                                    wellbeingLabel={member?.wellbeingLabel}
                                />
                            </View>
                        ))}
                        {Array.isArray(item.members) && item.members.length > 3 && (
                            <View style={[styles.moreMembersBadge, { zIndex: 0, marginLeft: -14 }]}>
                                <Text style={styles.moreMembersText}>+{item.members.length - 3}</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.stackInfoContainer}>
                        <Text style={styles.stackInfoText}>
                            <Text style={styles.highlightText}>{Array.isArray(item.members) ? item.members.length : 0} members</Text> are active
                        </Text>
                        <View style={styles.activeIndicator} />
                    </View>
                </View>
            ) : (
                <Text style={styles.timelineEmptyText}>
                    Join the conversation with this circle.
                </Text>
            )}
            <TouchableOpacity
                style={styles.viewCircleButton}
                onPress={() => navigation.navigate('CircleDetail', { circle: item })}
            >
                <Text style={styles.viewCircleButtonText}>View Circle</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const handleDeleteCircle = (circle) => {
        showModal({
            type: 'confirmation',
            title: 'Delete Circle',
            message: 'Are you sure you want to continue? This action is permanent for admins/creators.',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            onConfirm: async () => {
                try {
                    setDeletingCircleId(circle.id);
                    setDeleteInProgress(true);
                    const result = await circleService.deleteCircle(circle.id);
                    const action = result?.action || 'left_circle';
                    setGroups((prev) => prev.filter((g) => g.id !== circle.id));
                    showModal({
                        type: 'success',
                        title: action === 'deleted_circle' ? 'Circle Deleted' : 'Removed',
                        message: action === 'deleted_circle'
                            ? 'The circle and its chat were deleted everywhere.'
                            : 'You were removed from this circle.'
                    });
                } catch (error) {
                    setDeleteInProgress(false);
                    setDeletingCircleId(null);
                    showModal({
                        type: 'error',
                        title: 'Action Failed',
                        message: error?.message || 'Could not process this action.'
                    });
                }
            }
        });
    };

    const renderRightActions = (item) => (
        <TouchableOpacity
            style={styles.swipeDeleteAction}
            activeOpacity={0.9}
            onPress={() => handleDeleteCircle(item)}
        >
            <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            <Text style={styles.swipeDeleteText}>Delete</Text>
        </TouchableOpacity>
    );

    const renderRow = ({ item }) => {
        const isMember = !!user?.uid && Array.isArray(item.members) && item.members.includes(user.uid);
        if (!showJoinedOnly || !isMember) {
            return renderGroupCard({ item });
        }
        return (
            <View style={styles.swipeRowWrap}>
                <Swipeable
                    renderRightActions={() => renderRightActions(item)}
                    overshootRight={false}
                    containerStyle={styles.swipeContainer}
                >
                    {renderGroupCard({ item, insideSwipe: true })}
                </Swipeable>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{showJoinedOnly ? 'My Circles' : 'Circles'}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrapper}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color="#9E9E9E" />
                    <TextInput
                        placeholder="Search circles..."
                        placeholderTextColor="#9E9E9E"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterChip,
                                activeFilter === filter && styles.activeFilterChip
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[
                                styles.filterText,
                                activeFilter === filter && styles.activeFilterText
                            ]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {showJoinedOnly && (
                <View style={styles.deleteHintBanner}>
                    <Ionicons name="information-circle-outline" size={16} color="#1A1A1A" />
                    <Text style={styles.deleteHintText}>
                        Swipe left on a circle card to delete. Only circle admins can delete a circle.
                    </Text>
                </View>
            )}

            {/* Groups List */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={filteredGroups}
                    renderItem={renderRow}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={() => (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={64} color="#E0E0E0" />
                            <Text style={styles.emptyStateText}>No circles found.</Text>
                            <Text style={styles.emptyStateSubText}>Try adjusting your search or create a new one!</Text>
                        </View>
                    )}
                />
            </KeyboardAvoidingView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateCircle')}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>

            {deleteInProgress && (
                <View style={styles.deleteOverlay}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.deleteOverlayText}>Deleting...</Text>
                </View>
            )}

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
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    searchWrapper: {
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 50,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#1A1A1A',
    },
    filterContainer: {
        marginBottom: 16,
        height: 40,
    },
    filterContent: {
        paddingHorizontal: 20,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    activeFilterChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#757575',
    },
    activeFilterText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100, // Space for FAB
    },
    groupCard: {
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
    groupCardNoMargin: {
        marginBottom: 0
    },
    swipeRowWrap: {
        marginBottom: 32
    },
    swipeContainer: {
        borderRadius: 32,
        overflow: 'visible'
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
        alignItems: 'center',
        width: '100%',
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    moreMembersBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    moreMembersText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#757575',
    },
    stackInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
    viewCircleButtonText: {
        color: COLORS.white,
        fontSize: 15,
        fontWeight: '700',
    },
    swipeDeleteAction: {
        width: 96,
        marginLeft: 8,
        backgroundColor: '#D32F2F',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    swipeDeleteText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    deleteHintBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#E8EDF4'
    },
    deleteHintText: {
        flex: 1,
        marginLeft: 8,
        color: '#4A5568',
        fontSize: 12,
        fontWeight: '500'
    },
    fab: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 100,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#9E9E9E',
        marginTop: 16,
    },
    emptyStateSubText: {
        fontSize: 14,
        color: '#BDBDBD',
        marginTop: 8,
    },
    deleteOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.75)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200
    },
    deleteOverlayText: {
        marginTop: 10,
        color: '#1A1A1A',
        fontSize: 14,
        fontWeight: '600'
    }
});

export default SupportGroupsScreen;
