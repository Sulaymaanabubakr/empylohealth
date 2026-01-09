import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, Image, TouchableOpacity, ScrollView, StatusBar, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';

import { circleService } from '../services/api/circleService';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Connect', 'Culture', 'Enablement', 'Green Activities', 'Mental health', 'Physical health'];

const SupportGroupsScreen = ({ navigation }) => {
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const loadGroups = async () => {
            try {
                const circles = await circleService.getAllCircles();
                setGroups(circles);
            } catch (error) {
                console.error('Failed to load support groups', error);
                setGroups([]);
            }
        };
        loadGroups();
    }, []);

    const filteredGroups = groups.filter(group => {
        const matchesSearch = (group.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const tags = group.tags || (group.category ? [group.category] : []);
        const matchesFilter = activeFilter === 'All' || tags.includes(activeFilter);
        return matchesSearch && matchesFilter;
    });

    const renderGroupCard = ({ item }) => (
        <View style={styles.groupCard}>
            <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.groupImage} />
            <View style={styles.groupInfo}>
                <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{item.name}</Text>
                    {item.verified && <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} style={{ marginLeft: 4 }} />}
                </View>
                <View style={styles.groupMeta}>
                    <Ionicons name="people" size={14} color="#757575" />
                    <Text style={styles.memberCount}>{item.members} members</Text>
                </View>
                <View style={styles.tagsContainer}>
                    {(item.tags || (item.category ? [item.category] : [])).map(tag => (
                        <View key={tag} style={styles.tagBadge}>
                            <Text style={styles.tagText}>{tag}</Text>
                        </View>
                    ))}
                </View>
            </View>
            <TouchableOpacity
                style={styles.viewButton}
                onPress={() => navigation.navigate('SupportGroupDetail', { group: item })}
            >
                <Text style={styles.viewButtonText}>VIEW</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Support Groups</Text>
                <View style={{ width: 44 }} />
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9E9E9E" style={styles.searchIcon} />
                <TextInput
                    placeholder="Search..."
                    placeholderTextColor="#9E9E9E"
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            {/* Subheader */}
            <View style={styles.subHeader}>
                <Text style={styles.showingText}>Showing support groups near you</Text>
            </View>

            {/* Filter Chips */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>{filter}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Groups List */}
            <FlatList
                data={filteredGroups}
                renderItem={renderGroupCard}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={() => (
                    <Text style={styles.emptyStateText}>No support groups found.</Text>
                )}
                ListFooterComponent={() => (
                    filteredGroups.length > 0 ? <Text style={styles.loadMoreText}>load more...</Text> : null
                )}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB', // Light grey background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm, // Added padding
        // marginTop: -12, // Removed negative margin
        paddingBottom: SPACING.sm,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        marginHorizontal: SPACING.lg,
        marginTop: SPACING.xs,
        marginBottom: SPACING.sm,
        paddingHorizontal: SPACING.md,
        height: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    searchIcon: {
        marginRight: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#1A1A1A',
        height: '100%',
    },
    subHeader: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.xs,
    },
    showingText: {
        fontSize: 13,
        color: '#757575',
    },
    filtersContainer: {
        marginTop: SPACING.sm,
        marginBottom: SPACING.sm,
        height: 40,
    },
    filterScroll: {
        paddingHorizontal: SPACING.lg,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        marginRight: 10,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    activeFilterChip: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#757575',
    },
    activeFilterText: {
        color: '#FFFFFF',
    },
    listContent: {
        paddingHorizontal: SPACING.lg,
    },
    groupCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    groupImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
    },
    groupInfo: {
        flex: 1,
    },
    groupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    groupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A1A1A',
    },
    groupMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    memberCount: {
        fontSize: 12,
        color: '#757575',
        marginLeft: 4,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tagBadge: {
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
        marginRight: 6,
    },
    tagText: {
        fontSize: 10,
        color: '#616161',
    },
    viewButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginLeft: 8,
    },
    viewButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    loadMoreText: {
        textAlign: 'center',
        color: '#9E9E9E',
        marginVertical: 20,
        fontSize: 12,
    },
    emptyStateText: {
        textAlign: 'center',
        color: '#9E9E9E',
        marginTop: 24,
        fontSize: 13,
    },
});

export default SupportGroupsScreen;
