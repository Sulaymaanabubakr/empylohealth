import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from '../theme/theme';

const ActivityDetailScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();

    const { activity } = route.params || {};
    if (!activity) {
        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
                <View style={styles.contentContainer}>
                    <Text style={styles.sectionText}>Activity details are unavailable.</Text>
                </View>
            </View>
        );
    }
    const accentColor = COLORS.primary;
    const tagLabel = String(activity?.tag || activity?.type || 'LEARN').toUpperCase();
    const durationLabel = String(activity?.time || '5 min');
    const descriptionText = String(activity?.description || '').trim() || 'This guided activity helps you build healthy wellbeing habits in small, consistent steps.';
    const rawContent = String(activity?.content || '').trim();
    const parsedParagraphs = (rawContent || descriptionText)
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean);
    const contentParagraphs = parsedParagraphs.length > 0
        ? parsedParagraphs
        : [
            descriptionText,
            'Take your time with this activity and focus on steady progress. You can pause and return anytime.',
            'Consistency matters more than speed. Even short sessions can make a meaningful difference over time.'
        ];
    const useDarkText = accentColor === COLORS.lightBlue || accentColor === COLORS.secondary;
    const textColor = useDarkText ? COLORS.black : '#FFFFFF';
    const badgeBg = useDarkText ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.25)';
    const badgeBorder = useDarkText ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.4)';

    return (
        <View style={styles.container}>
            <StatusBar barStyle={useDarkText ? 'dark-content' : 'light-content'} backgroundColor={accentColor} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Curved Header */}
                <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: accentColor }]}>
                    <View style={styles.navBar}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.iconButton}>
                            <Ionicons name="share-social-outline" size={24} color={textColor} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerContent}>
                        <Text style={[styles.title, { color: textColor }]}>{activity.title}</Text>
                        <View style={styles.badgesContainer}>
                            <View style={[styles.badge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                                <Text style={[styles.badgeText, { color: textColor }]}>{tagLabel}</Text>
                            </View>
                            <View style={[styles.badge, styles.timeBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                                <Text style={[styles.badgeText, { color: textColor }]}>{durationLabel}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content Area */}
                <View style={styles.contentContainer}>
                    {contentParagraphs.map((paragraph, index) => (
                        <Text key={`${index}-${paragraph.slice(0, 20)}`} style={styles.sectionText}>
                            {paragraph}
                        </Text>
                    ))}

                    {activity.steps && activity.steps.map((step, index) => (
                        <Text key={index} style={styles.sectionText}>
                            <Text style={styles.boldText}>{index + 1}. {step.title}</Text> {step.body}
                        </Text>
                    ))}

                    {/* Spacer for bottom button */}
                    <View style={{ height: 80 }} />
                </View>
            </ScrollView>

            {/* Floating Bottom Button */}
            <View style={[styles.bottomContainer, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 24 }]}>
                <TouchableOpacity
                    style={[styles.completeButton, { backgroundColor: accentColor, shadowColor: accentColor }]}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.completeButtonText, { color: textColor }]}>Complete!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
    },
    headerContainer: {
        backgroundColor: '#26A69A', // Vibrant Teal
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',
    },
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        marginTop: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContent: {
        width: '100%',
        alignItems: 'center', // Centered
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    badgesContainer: {
        flexDirection: 'row',
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    timeBadge: {
        // Additional styles if needed
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    contentContainer: {
        paddingHorizontal: 24,
        paddingTop: 18,
    },
    sectionText: {
        fontSize: 16,
        lineHeight: 28,
        color: '#424242',
        marginBottom: 18,
        fontWeight: '400',
    },
    boldText: {
        fontWeight: '700',
        color: '#1A1A1A',
    },
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        backgroundColor: 'rgba(255,255,255,0.9)', // Slight transparency
    },
    completeButton: {
        backgroundColor: '#26A69A',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: "#26A69A",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 10,
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});

export default ActivityDetailScreen;
