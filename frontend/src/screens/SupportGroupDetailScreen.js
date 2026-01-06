import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';

const SupportGroupDetailScreen = ({ navigation, route }) => {
    const { group } = route.params;
    const insets = useSafeAreaInsets();
    const [isJoined, setIsJoined] = useState(false);

    const handleConnectToggle = () => {
        setIsJoined(!isJoined);
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
                        <Image source={group.image} style={styles.heroImage} />
                    </View>
                    <View style={styles.titleContainer}>
                        <Text style={styles.heroTitle}>{group.name}</Text>
                        {group.verified && (
                            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} style={{ marginLeft: 6 }} />
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <Ionicons name="people" size={16} color="#757575" />
                        <Text style={styles.statsText}>{group.members} members</Text>
                        <Text style={styles.statsDivider}>|</Text>
                        <Text style={styles.statsText}>{group.tags[0]}</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.connectButton, isJoined && styles.connectButtonJoined]}
                        onPress={handleConnectToggle}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.connectButtonText, isJoined && styles.connectButtonTextJoined]}>
                            {isJoined ? 'Joined!' : 'Connect me'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About this group</Text>
                    <Text style={styles.sectionText}>
                        {group.description || "Lorem ipsum dolor sit amet, consectetur adipiscing elit."}
                    </Text>
                </View>

                {/* Activity Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Activity</Text>
                    <View style={styles.activityRow}>
                        <Text style={styles.activityValue}>{group.activeMembers} active members</Text>
                    </View>
                    <View style={styles.activityRow}>
                        <Text style={styles.activityValue}>{group.meetingsPerWeek} meetings a week</Text>
                    </View>
                </View>

                {/* Contact Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Contact details</Text>

                    <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.address || 'Location not available'}</Text>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="call-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.phone || '+00 000 000 000'}</Text>
                    </View>

                    <View style={styles.contactRow}>
                        <Ionicons name="mail-outline" size={20} color="#757575" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{group.contact?.email || 'email@example.com'}</Text>
                    </View>
                </View>

                {/* Report Button */}
                <TouchableOpacity style={styles.reportButton}>
                    <Feather name="alert-circle" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.reportButtonText}>Report group</Text>
                </TouchableOpacity>

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
    reportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 8,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
        borderRadius: 30, // Pill shape like in screenshot? Or just plain text? Screenshot has a pill shape/card.
        // Let's match the screenshot's 'Report group' look which is a white pill with text.
        // Actually, screenshot shows "Report group" inside a white card/pill at the bottom.
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 1,
    },
    reportButtonText: {
        fontSize: 14,
        color: COLORS.primary, // Using primary color for the text based on standard patterns, or red if danger. 
        // Screenshot has it looking cyan/primary color.
        fontWeight: '500',
    }
});

export default SupportGroupDetailScreen;
