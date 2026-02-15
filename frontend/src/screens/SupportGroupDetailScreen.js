import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';
import Avatar from '../components/Avatar';
import { circleService } from '../services/api/circleService';
import { useAuth } from '../context/AuthContext';
import { MAX_CIRCLE_MEMBERS, getCircleMemberCount } from '../services/circles/circleLimits';

const SupportGroupDetailScreen = ({ navigation, route }) => {
    const group = route.params?.group;
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [isJoining, setIsJoining] = useState(false);
    const [joinedOverride, setJoinedOverride] = useState(false);
    const isJoined = useMemo(() => {
        if (joinedOverride) return true;
        if (!user?.uid) return false;
        if (Array.isArray(group.members)) {
            return group.members.includes(user.uid);
        }
        return false;
    }, [group.members, joinedOverride, user?.uid]);
    const tags = group?.tags || (group?.category ? [group.category] : []);
    const memberCount = getCircleMemberCount(group);
    const isFull = !isJoined && memberCount >= MAX_CIRCLE_MEMBERS;

    if (!group) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>Support group details are unavailable.</Text>
                </View>
            </SafeAreaView>
        );
    }

    const handleConnect = async () => {
        if (isJoined || isFull || !group.id || !user?.uid) return;
        try {
            setIsJoining(true);
            await circleService.joinCircle(group.id);
            setJoinedOverride(true);
        } catch (error) {
            console.error('Failed to join support group', error);
        } finally {
            setIsJoining(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <View style={styles.imageContainer}>
                        <Avatar uri={group.image} name={group.name} size={80} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.heroTitle}>{group.name}</Text>
                        {group.verified && (
                            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} style={{ marginLeft: 6 }} />
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <Ionicons name="people" size={16} color="#757575" />
                        <Text style={styles.statsText}>{group.members?.length || group.members || 0} members</Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsText}>{tags[0] || 'General'}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.connectButton, isJoined && styles.connectButtonJoined]}
                        onPress={handleConnect}
                        activeOpacity={0.8}
                        disabled={isJoined || isJoining || isFull}
                    >
                        <Text style={[styles.connectButtonText, isJoined && styles.connectButtonTextJoined]}>
                            {isJoined ? 'Joined' : (isFull ? 'Full' : (isJoining ? 'Joining...' : 'Connect me'))}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About this group</Text>
                    <Text style={styles.sectionText}>
                        {group.description || "No description available yet."}
                    </Text>
                </View>

                {/* Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity</Text>
                    <View style={styles.activityRow}>
                        <Text style={styles.activityValue}>{group.activeMembers || 0} active members</Text>
                    </View>
                    <View style={styles.activityRow}>
                        <Text style={styles.activityValue}>{group.meetingsPerWeek || 0} meetings a week</Text>
                    </View>
                </View>

                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact details</Text>

                    <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.address || 'Not provided'}</Text>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.phone || 'Not provided'}</Text>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.email || 'Not provided'}</Text>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm, // Added padding
        // marginTop: -12, // Removed negative margin
        paddingBottom: SPACING.sm,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        padding: 24,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: '#757575',
    },
    scrollContent: {
        paddingHorizontal: SPACING.lg,
        paddingTop: 10,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    imageContainer: {
        marginBottom: 16,
        // Add a subtle shadow to the image container if desired, currently using transparent bg
    },
    heroImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    statsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    statsText: {
        fontSize: 14,
        color: '#757575',
        marginHorizontal: 4,
    },
    statsDivider: {
        fontSize: 14,
        color: '#E0E0E0',
        marginHorizontal: 4,
    },
    connectButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 48,
        borderRadius: 25,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        minWidth: 180,
        alignItems: 'center',
    },
    connectButtonJoined: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        shadowColor: 'transparent',
        elevation: 0,
    },
    connectButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    connectButtonTextJoined: {
        color: COLORS.primary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 8,
    },
    sectionText: {
        fontSize: 14,
        color: '#424242',
        lineHeight: 22,
    },
    activityRow: {
        marginBottom: 6,
    },
    activityValue: {
        fontSize: 14,
        color: '#424242',
        fontWeight: '500',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    contactIcon: {
        marginRight: 12,
        width: 24, // ensuring consistent alignment
        textAlign: 'center',
    },
    contactText: {
        fontSize: 14,
        color: '#424242',
        flex: 1,
    },
});

export default SupportGroupDetailScreen;
