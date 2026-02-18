import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, Platform, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { COLORS, SPACING } from '../theme/theme';

const { width } = Dimensions.get('window');

const decodeSvgDataUri = (uri = '') => {
    if (!uri || typeof uri !== 'string') return null;
    if (!uri.startsWith('data:image/svg+xml')) return null;
    const commaIndex = uri.indexOf(',');
    if (commaIndex < 0) return null;
    const encoded = uri.slice(commaIndex + 1);
    try {
        return decodeURIComponent(encoded);
    } catch {
        return encoded;
    }
};

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
    const { headerColor = activity.color, isDarkText = false } = activity;
    const svgXml = decodeSvgDataUri(activity.image);
    const isGeneratedActivityArtwork = Boolean(svgXml);
    const tagLabel = String(activity?.tag || activity?.type || 'LEARN').toUpperCase();
    const durationLabel = String(activity?.time || '5 min');
    const categoryLabel = String(activity?.category || 'Self-development');
    const descriptionText = String(activity?.description || '').trim() || 'This guided activity helps you build healthy wellbeing habits in small, consistent steps.';
    const textColor = isDarkText ? '#1A1A1A' : '#FFFFFF';
    const badgeBg = isDarkText ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.25)';
    const badgeBorder = isDarkText ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.4)';

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDarkText ? "dark-content" : "light-content"} backgroundColor={headerColor} />

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Curved Header */}
                <View style={[styles.headerContainer, { paddingTop: insets.top, backgroundColor: headerColor }]}>
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
                    {activity.image && !isGeneratedActivityArtwork ? (
                        <View style={styles.imageContainer}>
                            {svgXml ? (
                                <SvgXml xml={svgXml} width="100%" height="100%" />
                            ) : (
                                <Image
                                    source={{ uri: activity.image }}
                                    style={styles.illustration}
                                    resizeMode="contain"
                                />
                            )}
                        </View>
                    ) : null}

                    <View style={styles.infoCard}>
                        <Text style={styles.infoTitle}>Overview</Text>
                        <Text style={styles.sectionText}>{descriptionText}</Text>
                        <Text style={styles.infoTitle}>Focus Area</Text>
                        <Text style={styles.sectionText}>{categoryLabel}</Text>
                        <Text style={styles.infoTitle}>How Long</Text>
                        <Text style={styles.sectionText}>{durationLabel}</Text>
                    </View>

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
                    style={[styles.completeButton, { backgroundColor: headerColor, shadowColor: headerColor }]}
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
        paddingTop: 30,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    illustration: {
        width: width - 80,
        height: 200,
    },
    sectionText: {
        fontSize: 16,
        lineHeight: 26,
        color: '#424242',
        marginBottom: 14,
        fontWeight: '400',
    },
    infoCard: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 18,
        padding: 16,
        marginBottom: 18,
    },
    infoTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#334155',
        marginBottom: 6,
        textTransform: 'uppercase',
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
