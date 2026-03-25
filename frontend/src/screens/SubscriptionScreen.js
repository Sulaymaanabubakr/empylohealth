import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useModal } from '../context/ModalContext';
import { LEGAL_LINKS } from '../constants/legalLinks';
import { subscriptionService } from '../services/api/subscriptionService';
import { subscriptionGuardService } from '../services/subscription/subscriptionGuardService';
import { getPlanRules } from '../services/subscription/subscriptionConfig';

const FEATURE_ROWS = [
    { label: 'Private circles', free: '3 max', premium: 'Unlimited' },
    { label: 'Public circles', free: '3 max', premium: 'Unlimited' },
    { label: 'Huddles per day', free: '2', premium: '3' },
    { label: 'Minutes per huddle', free: '10', premium: '40' },
    { label: 'Group activities', free: 'Locked', premium: 'Included' },
    { label: 'Schedule huddles', free: 'Locked', premium: 'Included' },
    { label: 'Share activities', free: 'Locked', premium: 'Included' }
];

const PREMIUM_HIGHLIGHTS = [
    {
        icon: 'infinite',
        title: 'Unlimited circles',
        text: 'Expand beyond free-tier public and private circle caps.'
    },
    {
        icon: 'timer-outline',
        title: 'Longer huddles',
        text: 'Get more time per session and more room in your daily allowance.'
    },
    {
        icon: 'sparkles-outline',
        title: 'Full access',
        text: 'Unlock premium activities, scheduling, and activity sharing.'
    }
];

const formatExpiry = (expiresAt) => {
    const date = expiresAt?.toDate ? expiresAt.toDate() : (expiresAt ? new Date(expiresAt) : null);
    if (!date || Number.isNaN(date.getTime())) return 'No active renewal';
    return `Renews ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
};

const SubscriptionScreen = ({ navigation, route }) => {
    const { showModal } = useModal();
    const [status, setStatus] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyProductId, setBusyProductId] = useState('');
    const [restoring, setRestoring] = useState(false);

    const refresh = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const [catalog, nextStatus] = await Promise.all([
                subscriptionService.getCatalog(),
                subscriptionService.getStatus(forceRefresh)
            ]);
            setPlans(Array.isArray(catalog?.plans) ? catalog.plans : []);
            setStatus(nextStatus || null);
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Subscription unavailable',
                message: error?.message || 'Unable to load subscription details.'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        subscriptionService.startPurchaseListeners({
            onSuccess: async () => {
                subscriptionGuardService.invalidateCache();
                await refresh(true);
                showModal({
                    type: 'success',
                    title: 'Premium active',
                    message: 'Your subscription is now active across your account.'
                });
                setBusyProductId('');
            },
            onError: (error) => {
                setBusyProductId('');
                if (String(error?.message || '').toLowerCase().includes('cancel')) return;
                showModal({
                    type: 'error',
                    title: 'Purchase failed',
                    message: error?.message || 'Unable to complete the purchase.'
                });
            }
        });
        refresh().catch(() => {});
        return () => {
            subscriptionService.stopPurchaseListeners();
        };
    }, []);

    const entitlement = status?.entitlement || { plan: 'free', status: 'expired' };
    const usage = status?.usage || {};
    const currentPlan = entitlement?.plan || 'free';
    const currentRules = getPlanRules(currentPlan);
    const premiumPlan = plans.find((plan) => String(plan?.id || '').toLowerCase().includes('premium'))
        || plans.find((plan) => String(plan?.productId || '').trim())
        || {
            id: 'premium',
            name: 'Premium Annual',
            description: 'Unlock full circles, activities, scheduling, and longer huddles.',
            priceLabel: 'Annual subscription',
            productId: ''
        };

    const usageRows = useMemo(() => ([
        {
            label: 'Plan',
            value: currentRules.label
        },
        {
            label: 'Huddles used today',
            value: `${usage?.huddlesStarted || 0}/${currentRules.huddlesPerDay}`
        },
        {
            label: 'Consumed minutes today',
            value: `${usage?.huddleMinutesConsumed || 0}/${currentRules.huddleMinutesPerDay}`
        },
        {
            label: 'Public circles created',
            value: currentRules.circleLimits.public == null
                ? 'Unlimited'
                : `${usage?.circleCreates?.public || 0}/${currentRules.circleLimits.public}`
        },
        {
            label: 'Private circles created',
            value: currentRules.circleLimits.private == null
                ? 'Unlimited'
                : `${usage?.circleCreates?.private || 0}/${currentRules.circleLimits.private}`
        }
    ]), [currentRules, usage]);

    const handleSubscribe = async () => {
        if (!premiumPlan?.productId) {
            showModal({
                type: 'info',
                title: 'Purchases unavailable',
                message: 'No product ID is configured for Premium yet.'
            });
            return;
        }
        try {
            setBusyProductId(String(premiumPlan.productId));
            await subscriptionService.requestPlanPurchase(premiumPlan);
        } catch (error) {
            setBusyProductId('');
            showModal({
                type: 'error',
                title: 'Unable to start purchase',
                message: error?.message || 'Unable to open the store purchase flow.'
            });
        }
    };

    const handleRestore = async () => {
        try {
            setRestoring(true);
            await subscriptionService.restore({ productId: premiumPlan?.productId || '' });
            await refresh(true);
            showModal({
                type: 'success',
                title: 'Restore complete',
                message: 'Your subscription status has been refreshed.'
            });
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Restore failed',
                message: error?.message || 'No eligible purchase could be restored.'
            });
        } finally {
            setRestoring(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#08263D', '#115269', '#1A8A7E']} style={styles.hero}>
                <View style={styles.heroGlowLarge} />
                <View style={styles.heroGlowSmall} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Subscription</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.heroCard}>
                    <View style={styles.heroTopRow}>
                        <View style={styles.heroPlanWrap}>
                            <Text style={styles.heroEyebrow}>Current plan</Text>
                            <Text style={styles.heroPlan}>{currentRules.label}</Text>
                            <Text style={styles.heroMeta}>{formatExpiry(entitlement?.expiresAt)}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <MaterialCommunityIcons name="crown-outline" size={18} color="#0B3B60" />
                            <Text style={styles.heroBadgeText}>{currentPlan === 'premium' ? 'Active' : 'Upgrade'}</Text>
                        </View>
                    </View>

                    <View style={styles.heroStatsRow}>
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>{usage?.huddlesStarted || 0}</Text>
                            <Text style={styles.heroStatLabel}>Huddles today</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>{usage?.huddleMinutesConsumed || 0}</Text>
                            <Text style={styles.heroStatLabel}>Minutes used</Text>
                        </View>
                        <View style={styles.heroStatDivider} />
                        <View style={styles.heroStat}>
                            <Text style={styles.heroStatValue}>{currentPlan === 'premium' ? 'Full' : 'Limited'}</Text>
                            <Text style={styles.heroStatLabel}>Access</Text>
                        </View>
                    </View>

                    {!!route?.params?.reasonCode && (
                        <View style={styles.reasonBanner}>
                            <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#0B3B60" />
                            <Text style={styles.reasonText}>Upgrade to unlock this feature.</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color="#0B7A75" />
                    </View>
                ) : (
                    <>
                        <View style={styles.premiumPanel}>
                            <View style={styles.premiumPanelHeader}>
                                <Text style={styles.premiumPanelEyebrow}>Premium annual</Text>
                                <Text style={styles.premiumPanelTitle}>More room, more time, full access</Text>
                                <Text style={styles.premiumPanelSubtitle}>
                                    Premium expands your circles, extends your huddles, and opens the full activity experience.
                                </Text>
                            </View>

                            <View style={styles.highlightGrid}>
                                {PREMIUM_HIGHLIGHTS.map((item) => (
                                    <View key={item.title} style={styles.highlightCard}>
                                        <View style={styles.highlightIcon}>
                                            <Ionicons name={item.icon} size={18} color="#0B3B60" />
                                        </View>
                                        <Text style={styles.highlightTitle}>{item.title}</Text>
                                        <Text style={styles.highlightText}>{item.text}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Usage today</Text>
                            <View style={styles.usageCard}>
                                {usageRows.map((row, index) => (
                                    <View
                                        key={row.label}
                                        style={[styles.usageRow, index === usageRows.length - 1 && styles.lastRow]}
                                    >
                                        <Text style={styles.usageLabel}>{row.label}</Text>
                                        <Text style={styles.usageValue}>{row.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Free vs Premium</Text>
                            <View style={styles.compareCard}>
                                <View style={styles.compareLegend}>
                                    <Text style={styles.compareLegendFree}>Free</Text>
                                    <Text style={styles.compareLegendPremium}>Premium</Text>
                                </View>
                                {FEATURE_ROWS.map((item, index) => (
                                    <View
                                        key={item.label}
                                        style={[styles.compareRow, index === FEATURE_ROWS.length - 1 && styles.lastRow]}
                                    >
                                        <Text style={styles.compareLabel}>{item.label}</Text>
                                        <View style={styles.compareValues}>
                                            <Text style={styles.compareFree}>{item.free}</Text>
                                            <Text style={styles.comparePremium}>{item.premium}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Premium annual</Text>
                            <View style={styles.planCard}>
                                <LinearGradient colors={['#FFF4D8', '#FFFDF7']} style={styles.planTop}>
                                    <View style={styles.planHeader}>
                                        <View style={styles.planIdentity}>
                                            <View style={styles.planPill}>
                                                <MaterialCommunityIcons name="star-four-points-outline" size={16} color="#8A5A00" />
                                                <Text style={styles.planPillText}>Annual plan</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.planName}>{premiumPlan?.name || 'Premium Annual'}</Text>
                                        <Text style={styles.planDesc}>
                                            {premiumPlan?.description || 'Full activities, longer huddles, scheduling, and sharing.'}
                                        </Text>
                                    </View>
                                    <View style={styles.planPriceWrap}>
                                        <Text style={styles.planPrice}>{premiumPlan?.priceLabel || premiumPlan?.price || 'Configured in store'}</Text>
                                        <Text style={styles.planPriceCaption}>Billed through the App Store or Google Play.</Text>
                                    </View>
                                </LinearGradient>

                                <TouchableOpacity
                                    style={[styles.primaryButton, currentPlan === 'premium' && styles.primaryButtonDisabled]}
                                    onPress={handleSubscribe}
                                    disabled={currentPlan === 'premium' || !!busyProductId}
                                >
                                    {busyProductId ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={styles.primaryButtonText}>
                                            {currentPlan === 'premium' ? 'Premium active' : 'Upgrade to Premium'}
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore} disabled={restoring}>
                                    {restoring ? <ActivityIndicator color="#0B3B60" /> : <Text style={styles.secondaryButtonText}>Restore purchases</Text>}
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.footerLinks}>
                            <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
                                <Text style={styles.footerLink}>Terms</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
                                <Text style={styles.footerLink}>Privacy</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7F4'
    },
    hero: {
        paddingBottom: 28,
        paddingHorizontal: 20,
        position: 'relative',
        overflow: 'hidden'
    },
    heroGlowLarge: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(255,255,255,0.10)',
        right: -60,
        top: 44
    },
    heroGlowSmall: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,214,102,0.15)',
        left: -24,
        bottom: 28
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        marginBottom: 24
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.16)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700'
    },
    headerSpacer: {
        width: 40
    },
    heroCard: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)'
    },
    heroTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12
    },
    heroPlanWrap: {
        flex: 1
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F4E3B2',
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    heroBadgeText: {
        color: '#0B3B60',
        fontSize: 12,
        fontWeight: '800'
    },
    heroEyebrow: {
        color: '#D5ECF4',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 6
    },
    heroPlan: {
        color: '#FFFFFF',
        fontSize: 34,
        fontWeight: '800'
    },
    heroMeta: {
        color: '#DDECEF',
        fontSize: 14,
        marginTop: 6
    },
    heroStatsRow: {
        marginTop: 18,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(4,18,30,0.18)',
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 10
    },
    heroStat: {
        flex: 1,
        alignItems: 'center'
    },
    heroStatValue: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800'
    },
    heroStatLabel: {
        color: '#D3E4EA',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
        textTransform: 'uppercase'
    },
    heroStatDivider: {
        width: 1,
        height: 30,
        backgroundColor: 'rgba(255,255,255,0.16)'
    },
    reasonBanner: {
        marginTop: 14,
        borderRadius: 16,
        backgroundColor: '#F4E3B2',
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    reasonText: {
        color: '#0B3B60',
        fontSize: 13,
        fontWeight: '600'
    },
    content: {
        padding: 20,
        paddingBottom: 40
    },
    premiumPanel: {
        marginTop: -22,
        marginBottom: 24,
        backgroundColor: '#FFFDF7',
        borderRadius: 28,
        padding: 18,
        borderWidth: 1,
        borderColor: '#EADFC7'
    },
    premiumPanelHeader: {
        marginBottom: 16
    },
    premiumPanelEyebrow: {
        color: '#9B6A18',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 6
    },
    premiumPanelTitle: {
        color: '#102027',
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 28
    },
    premiumPanelSubtitle: {
        marginTop: 8,
        color: '#596D75',
        fontSize: 14,
        lineHeight: 20
    },
    highlightGrid: {
        gap: 12
    },
    highlightCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EEE7D8'
    },
    highlightIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#F6E7C3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    highlightTitle: {
        color: '#102027',
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 4
    },
    highlightText: {
        color: '#5E7178',
        fontSize: 13,
        lineHeight: 18
    },
    loadingWrap: {
        paddingVertical: 80
    },
    section: {
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#102027',
        marginBottom: 12
    },
    usageCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2ECE7'
    },
    usageRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D9E4E0'
    },
    lastRow: {
        borderBottomWidth: 0
    },
    usageLabel: {
        fontSize: 14,
        color: '#49606A'
    },
    usageValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#102027'
    },
    compareCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2ECE7'
    },
    compareLegend: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    compareLegendFree: {
        color: '#6C757D',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    compareLegendPremium: {
        color: '#0B7A75',
        fontSize: 12,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    compareRow: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#D9E4E0'
    },
    compareLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#102027',
        marginBottom: 6
    },
    compareValues: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    compareFree: {
        color: '#6C757D',
        fontSize: 13
    },
    comparePremium: {
        color: '#0B7A75',
        fontSize: 13,
        fontWeight: '700'
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 18,
        borderWidth: 1,
        borderColor: '#E3E8E3',
        overflow: 'hidden'
    },
    planTop: {
        marginHorizontal: -18,
        marginTop: -18,
        marginBottom: 18,
        paddingHorizontal: 18,
        paddingTop: 18,
        paddingBottom: 18
    },
    planHeader: {
        marginBottom: 12
    },
    planIdentity: {
        flexDirection: 'row',
        marginBottom: 10
    },
    planPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#FFF0C2',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6
    },
    planPillText: {
        color: '#8A5A00',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase'
    },
    planName: {
        fontSize: 22,
        fontWeight: '800',
        color: '#102027'
    },
    planDesc: {
        marginTop: 6,
        color: '#5C7078',
        lineHeight: 20
    },
    planPriceWrap: {
        gap: 4
    },
    planPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0B7A75'
    },
    planPriceCaption: {
        color: '#6B7E85',
        fontSize: 12
    },
    primaryButton: {
        backgroundColor: '#0B7A75',
        borderRadius: 16,
        paddingVertical: 15,
        alignItems: 'center'
    },
    primaryButtonDisabled: {
        opacity: 0.65
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800'
    },
    secondaryButton: {
        marginTop: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BFD3CB',
        paddingVertical: 14,
        alignItems: 'center'
    },
    secondaryButtonText: {
        color: '#0B3B60',
        fontSize: 15,
        fontWeight: '700'
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginTop: 8
    },
    footerLink: {
        color: '#52727C',
        fontSize: 13,
        fontWeight: '700'
    }
});

export default SubscriptionScreen;
