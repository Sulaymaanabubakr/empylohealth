import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/theme';
import { subscriptionGuardService } from '../services/subscription/subscriptionGuardService';
import { getChallengeLevelLabel, getChallengeSectionTitle } from '../utils/challengeLabels';

const getLevelPalette = (level = 'medium') => {
    const normalized = String(level || 'medium').toLowerCase();
    if (normalized === 'high') {
        return {
            bg: '#FFF1F2',
            border: '#FFE0E6',
            text: '#C62828',
            header: '#D84315',
            iconBg: '#FEE2E2',
            icon: 'alert-circle-outline',
        };
    }
    if (normalized === 'low') {
        return {
            bg: '#F1F8E9',
            border: '#DCECC6',
            text: '#558B2F',
            header: '#43A047',
            iconBg: '#E8F5E9',
            icon: 'leaf',
        };
    }
    return {
        bg: '#FFF8E1',
        border: '#FFE7B3',
        text: '#B26A00',
        header: '#FB8C00',
        iconBg: '#FFF3E0',
        icon: 'weather-sunset',
    };
};

const ChallengeDetailScreen = ({ navigation, route }) => {
    const insets = useSafeAreaInsets();
    const { challenge } = route.params || {};
    const [plan, setPlan] = useState('free');

    useEffect(() => {
        let active = true;
        subscriptionGuardService.getSubscriptionStatus()
            .then((status) => {
                if (active) setPlan(String(status?.entitlement?.plan || 'free').toLowerCase());
            })
            .catch(() => {
                if (active) setPlan('free');
            });
        return () => {
            active = false;
        };
    }, []);

    if (!challenge) {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Challenge details are unavailable.</Text>
            </SafeAreaView>
        );
    }

    if (plan === 'free') {
        return (
            <SafeAreaView style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{getChallengeSectionTitle()} is available on paid plans.</Text>
                <TouchableOpacity style={styles.lockedButton} onPress={() => navigation.replace('Subscription')}>
                    <Text style={styles.lockedButtonText}>View plans</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const normalizedLevel = String(challenge.level || 'medium').toLowerCase();
    const palette = getLevelPalette(normalizedLevel);
    const iconName = challenge.icon || palette.icon;
    const safeIconName = MaterialCommunityIcons?.glyphMap?.[iconName] ? iconName : palette.icon;
    const suggestions = Array.isArray(challenge.suggestions)
        ? challenge.suggestions.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
    const explanation = String(challenge.explanation || challenge.description || '').trim();

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={palette.header} />
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: palette.header }]}>
                    <View style={styles.navRow}>
                        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
                            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.headerBody}>
                        <View style={[styles.headerIcon, { backgroundColor: palette.iconBg }]}>
                            <MaterialCommunityIcons name={safeIconName} size={28} color={palette.text} />
                        </View>
                        <View style={styles.levelPill}>
                            <Text style={styles.levelPillText}>{getChallengeLevelLabel(normalizedLevel)}</Text>
                        </View>
                        <Text style={styles.title}>{challenge.title}</Text>
                        <Text style={styles.subtitle}>AI-generated daily focus based on your recent check-ins, activity, and app signals.</Text>
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={[styles.sectionCard, { backgroundColor: palette.bg, borderColor: palette.border }]}>
                        <Text style={styles.sectionLabel}>What stands out</Text>
                        <Text style={styles.sectionBody}>
                            {explanation || 'This focus area reflects something in today’s signals that may need a bit more care or attention right now.'}
                        </Text>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>Helpful next steps</Text>
                        {suggestions.length > 0 ? suggestions.map((item, index) => (
                            <View key={`${challenge.id || 'challenge'}_${index}`} style={styles.suggestionRow}>
                                <View style={[styles.suggestionDot, { backgroundColor: palette.text }]} />
                                <Text style={styles.suggestionText}>{item}</Text>
                            </View>
                        )) : (
                            <Text style={styles.sectionBody}>
                                Keep checking in regularly, lean on your circles for support, and take one small restorative action today.
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: palette.header }]}
                        onPress={() => navigation.navigate('ChallengeAiChat', { challenge })}
                    >
                        <MaterialCommunityIcons name="brain" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryButtonText}>Continue with AI</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.backButton, { backgroundColor: palette.header }]} onPress={() => navigation.goBack()}>
                        <Text style={styles.backButtonText}>Back to dashboard</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    emptyText: {
        color: '#757575',
        fontSize: 16,
        marginBottom: 16,
    },
    lockedButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    lockedButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 32,
        borderBottomLeftRadius: 34,
        borderBottomRightRadius: 34,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.16)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerBody: {
        alignItems: 'flex-start',
    },
    headerIcon: {
        width: 60,
        height: 60,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    levelPill: {
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 14,
    },
    levelPillText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 30,
        fontWeight: '800',
        marginBottom: 10,
    },
    subtitle: {
        color: 'rgba(255,255,255,0.88)',
        fontSize: 15,
        lineHeight: 22,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
    },
    sectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#EEEEEE',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: COLORS.primary,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: 12,
    },
    sectionBody: {
        fontSize: 15,
        color: '#424242',
        lineHeight: 22,
    },
    suggestionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    suggestionDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        marginTop: 7,
        marginRight: 10,
    },
    suggestionText: {
        flex: 1,
        fontSize: 15,
        color: '#424242',
        lineHeight: 22,
    },
    backButton: {
        borderRadius: 18,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
    },
    primaryButton: {
        borderRadius: 18,
        paddingVertical: 16,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
        marginLeft: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default ChallengeDetailScreen;
