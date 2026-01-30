import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, ScrollView, StatusBar, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import Avatar from '../components/Avatar';
import { circleService } from '../services/api/circleService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const FILTERS = ['All', 'Connect', 'Culture', 'Enablement', 'Green Activities', 'Mental health', 'Physical health'];

const SupportGroupsScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const [activeFilter, setActiveFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        React.useCallback(() => {
            const loadGroups = async () => {
                try {
                    // Only show loading on initial load or if empty
                    if (groups.length === 0) setLoading(true);
                    const circles = await circleService.getAllCircles();
                    setGroups(circles);
                } catch (error) {
                    console.error('Failed to load support groups', error);
                    setGroups([]);
                } finally {
                    setLoading(false);
                }
            };
            loadGroups();
        }, [])
    );

    const filteredGroups = groups.filter(group => {
        const matchesSearch = (group.name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const tags = group.tags || (group.category ? [group.category] : []);
        const matchesFilter = activeFilter === 'All' || tags.includes(activeFilter);
        return matchesSearch && matchesFilter;
    });

    const renderGroupCard = ({ item }) => (
        <TouchableOpacity
            style={styles.groupCard}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('CircleDetail', { circle: item })}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: item.color || '#E0F2F1' }]}>
                    <Text style={{ fontSize: 24 }}>{item.icon || '👥'}</Text>
                </View>
                <View style={styles.cardHeaderText}>
                    <Text style={styles.groupName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.groupCategory}>{item.category || 'General'}</Text>
                </View>
                {item.verified && (
                    <MaterialIcons name="verified" size={20} color={COLORS.primary} />
                )}
            </View>

            <Text style={styles.groupDescription} numberOfLines={2}>
                {item.description || "Join this circle to connect with others and share experiences."}
            </Text>

            <View style={styles.cardFooter}>
                <View style={styles.memberInfo}>
                    <View style={styles.avatarPile}>
                        {/* Placeholder avatars since we don't have member images easily here */}
                        <View style={[styles.miniAvatar, { backgroundColor: '#FFCC80', zIndex: 3 }]} />
                        <View style={[styles.miniAvatar, { backgroundColor: '#90CAF9', zIndex: 2, marginLeft: -10 }]} />
                        <View style={[styles.miniAvatar, { backgroundColor: '#A5D6A7', zIndex: 1, marginLeft: -10 }]} />
                    </View>
                    <Text style={styles.memberCountText}>
                        {Array.isArray(item.members) ? item.members.length : (item.members || 0)} members
                    </Text>
                </View>

                <View style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>View</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F9FA" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Circles</Text>
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

            {/* Groups List */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <FlatList
                    data={filteredGroups}
                    renderItem={renderGroupCard}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
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
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F5F5F5',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardHeaderText: {
        flex: 1,
    },
    groupName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 2,
    },
    groupCategory: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    groupDescription: {
        fontSize: 14,
        color: '#616161',
        lineHeight: 20,
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F5F5F5',
    },
    memberInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarPile: {
        flexDirection: 'row',
        marginRight: 8,
    },
    miniAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    memberCountText: {
        fontSize: 13,
        color: '#757575',
        fontWeight: '500',
        marginLeft: 6,
    },
    joinButton: {
        backgroundColor: '#F0F2F5',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    joinButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#1A1A1A',
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
    }
});

export default SupportGroupsScreen;
