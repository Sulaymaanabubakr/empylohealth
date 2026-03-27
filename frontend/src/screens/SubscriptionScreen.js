import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useModal } from '../context/ModalContext';
import { LEGAL_LINKS } from '../constants/legalLinks';
import { subscriptionService } from '../services/api/subscriptionService';
import { subscriptionGuardService } from '../services/subscription/subscriptionGuardService';
import { getPlanRules } from '../services/subscription/subscriptionConfig';
import { COLORS, SPACING } from '../theme/theme';

const PLAN_COMPARISON = [
    { label: 'Create circles', free: true, pro: true },
    { label: 'Personal huddles', free: true, pro: true },
    { label: 'Pro circles', free: false, pro: true },
    { label: 'Circle huddles', free: false, pro: true },
    { label: 'Schedule huddles', free: false, pro: true },
    { label: 'Share activities', free: false, pro: true },
    { label: 'Full activities', free: false, pro: true },
];

const formatExpiry = (expiresAt) => {
    const date = expiresAt?.toDate ? expiresAt.toDate() : (expiresAt ? new Date(expiresAt) : null);
    if (!date || Number.isNaN(date.getTime())) return 'Auto-renews monthly. Cancel anytime.';
    return `Renews ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`;
};

const PlanCell = ({ enabled, accent = false, text }) => {
    if (typeof text === 'string') {
        return <Text style={[styles.planCellText, accent && styles.planCellTextAccent]}>{text}</Text>;
    }
    return (
        <Ionicons
            name={enabled ? 'checkmark' : 'remove'}
            size={18}
            color={enabled ? (accent ? COLORS.primary : COLORS.text) : '#B7BEC7'}
        />
    );
};

const SubscriptionScreen = ({ navigation, route }) => {
    const { showModal } = useModal();
    const [status, setStatus] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyProductId, setBusyProductId] = useState('');
    const [restoring, setRestoring] = useState(false);
    const [comparisonPlan, setComparisonPlan] = useState('pro');

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
                    title: 'Pro active',
                    message: 'Your Pro subscription is now active across your account.'
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
    const currentPlanIsPro = currentRules.id === 'pro';

    useEffect(() => {
        setComparisonPlan(currentPlanIsPro ? 'pro' : 'free');
    }, [currentPlanIsPro]);

    const proPlan = plans.find((plan) => {
        const id = String(plan?.id || '').toLowerCase();
        return id.includes('pro') || id.includes('premium');
    }) || plans.find((plan) => String(plan?.productId || '').trim()) || {
        id: 'pro',
        name: 'Pro Monthly',
        description: 'Unlock Pro circles, full activities, scheduling, and circle huddles.',
        priceLabel: '£10/month',
        productId: ''
    };

    const huddlesUsedToday = currentPlanIsPro
        ? Number(usage?.circleHuddlesStarted || 0)
        : Number(usage?.personalHuddlesStarted || 0);
    const minutesUsedToday = currentPlanIsPro
        ? Number(usage?.circleHuddleMinutesConsumed || 0)
        : Number(usage?.personalHuddleMinutesConsumed || 0);

    const summaryRows = useMemo(() => ([
        currentPlanIsPro
            ? `${huddlesUsedToday} circle huddles started today`
            : `${huddlesUsedToday}/${currentRules.huddlesPerDay} personal huddles today`,
        `${minutesUsedToday}/${currentRules.huddleMinutesPerDay} minutes used today`,
        currentPlanIsPro ? 'Pro circles enabled' : 'Upgrade for Pro circles and circle huddles'
    ]), [currentPlanIsPro, currentRules, huddlesUsedToday, minutesUsedToday]);

    const comparisonTitle = comparisonPlan === 'pro' ? 'Get Pro' : 'Start free';
    const comparisonSubtitle = comparisonPlan === 'pro'
        ? 'Unlock circle huddles, scheduling, and the full Pro circle experience.'
        : 'Keep chatting in circles for free, then upgrade when you need Pro huddles.';

    const handleSubscribe = async () => {
        if (!proPlan?.productId) {
            showModal({
                type: 'info',
                title: 'Purchases unavailable',
                message: 'No product ID is configured for Pro yet.'
            });
            return;
        }
        try {
            setBusyProductId(String(proPlan.productId));
            await subscriptionService.requestPlanPurchase(proPlan);
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
            await subscriptionService.restore({ productId: proPlan?.productId || '' });
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
            <StatusBar barStyle="dark-content" />

            <View style={styles.topBar}>
                <View style={styles.topBarSpacer} />
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator color={COLORS.primary} />
                    </View>
                ) : (
                    <>
                        <View style={styles.hero}>
                            <View style={styles.heroIcon}>
                                <Image source={require('../assets/images/logo_teal.png')} style={styles.heroLogo} resizeMode="contain" />
                            </View>
                            <Text style={styles.heroTitle}>{comparisonTitle}</Text>
                            <Text style={styles.heroSubtitle}>{comparisonSubtitle}</Text>

                            <View style={styles.toggleWrap}>
                                <View style={styles.toggleTrack}>
                                    <TouchableOpacity
                                        style={[styles.togglePill, comparisonPlan === 'free' && styles.togglePillActive]}
                                        onPress={() => setComparisonPlan('free')}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.toggleLabel, comparisonPlan === 'free' ? styles.toggleLabelActiveText : styles.toggleLabelMuted]}>Free</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.togglePill, comparisonPlan === 'pro' && styles.togglePillActive]}
                                        onPress={() => setComparisonPlan('pro')}
                                        activeOpacity={0.9}
                                    >
                                        <Text style={[styles.toggleLabel, comparisonPlan === 'pro' ? styles.toggleLabelActiveText : styles.toggleLabelMuted]}>Pro</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {!!route?.params?.reasonCode && (
                            <View style={styles.noticeCard}>
                                <MaterialCommunityIcons name="lock-outline" size={16} color={COLORS.primary} />
                                <Text style={styles.noticeText}>Upgrade to unlock this feature.</Text>
                            </View>
                        )}

                        <View style={styles.compareCard}>
                            <View style={styles.compareHeaderRow}>
                                <Text style={styles.compareHeaderTitle}>Features</Text>
                                <View style={styles.compareColumnsHeader}>
                                    <Text style={styles.compareFreeHeader}>Free</Text>
                                    <Text style={styles.compareProHeader}>Pro</Text>
                                </View>
                            </View>

                            {PLAN_COMPARISON.map((row, index) => (
                                <View key={row.label} style={[styles.compareRow, index === PLAN_COMPARISON.length - 1 && styles.compareRowLast]}>
                                    <Text style={styles.compareLabel}>{row.label}</Text>
                                    <View style={styles.compareColumns}>
                                        <View style={styles.compareColumnCell}>
                                            <PlanCell enabled={row.free} />
                                        </View>
                                        <View style={styles.compareColumnCell}>
                                            <PlanCell enabled={row.pro} accent />
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.statusCard}>
                            <View style={styles.statusCardHeader}>
                                <Text style={styles.statusTitle}>Current plan</Text>
                                <Text style={styles.statusValue}>{currentRules.label}</Text>
                            </View>
                            {summaryRows.map((row) => (
                                <Text key={row} style={styles.statusLine}>{row}</Text>
                            ))}
                            <Text style={styles.statusMeta}>{formatExpiry(entitlement?.expiresAt)}</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.upgradeButton, currentPlanIsPro && styles.upgradeButtonDisabled]}
                            onPress={handleSubscribe}
                            disabled={currentPlanIsPro || !!busyProductId}
                        >
                            {busyProductId ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.upgradeButtonText}>
                                    {currentPlanIsPro ? 'Pro active' : `Upgrade for ${proPlan?.priceLabel || '£10/month'}`}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
                            {restoring ? (
                                <ActivityIndicator color={COLORS.text} />
                            ) : (
                                <Text style={styles.restoreButtonText}>Restore purchases</Text>
                            )}
                        </TouchableOpacity>

                        <View style={styles.footerBlock}>
                            <View style={styles.footerLinks}>
                                <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
                                    <Text style={styles.footerLink}>Terms</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
                                    <Text style={styles.footerLink}>Privacy</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.footerMeta}>Auto-renews monthly. Cancel anytime.</Text>
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
        backgroundColor: '#F8FBFA'
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm
    },
    topBarSpacer: {
        width: 40
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center'
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 36,
        paddingTop: 8
    },
    loadingWrap: {
        paddingTop: 96,
        alignItems: 'center'
    },
    hero: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 24
    },
    heroIcon: {
        width: 84,
        height: 84,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20
    },
    heroLogo: {
        width: 68,
        height: 68,
    },
    heroTitle: {
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 38,
        color: COLORS.text,
        textAlign: 'center'
    },
    heroSubtitle: {
        marginTop: 10,
        fontFamily: 'DMSans_500Medium',
        fontSize: 17,
        lineHeight: 24,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20
    },
    toggleWrap: {
        marginTop: 24,
        width: '100%',
        alignItems: 'center'
    },
    toggleTrack: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: '#E6F4F2',
        borderRadius: 999,
        padding: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    togglePill: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12
    },
    toggleLabel: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
    },
    toggleLabelMuted: {
        color: '#6E8E89'
    },
    togglePillActive: {
        backgroundColor: COLORS.white,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    toggleLabelActiveText: {
        color: COLORS.primary
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#E8F7F5',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 16
    },
    noticeText: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 13,
        color: '#0C7F76'
    },
    compareCard: {
        backgroundColor: COLORS.white,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E6E7E4',
        paddingHorizontal: 18,
        paddingVertical: 14
    },
    compareHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingBottom: 12
    },
    compareHeaderTitle: {
        flex: 1,
        fontFamily: 'DMSans_700Bold',
        fontSize: 17,
        color: '#8A8F98'
    },
    compareColumnsHeader: {
        width: 120,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    compareFreeHeader: {
        width: 48,
        textAlign: 'center',
        fontFamily: 'DMSans_700Bold',
        fontSize: 16,
        color: '#8A8F98'
    },
    compareProHeader: {
        width: 48,
        textAlign: 'center',
        fontFamily: 'DMSans_700Bold',
        fontSize: 16,
        color: COLORS.primary
    },
    compareRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 6,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#F0F1EE'
    },
    compareRowLast: {
        paddingBottom: 10
    },
    compareLabel: {
        flex: 1,
        paddingRight: 12,
        fontFamily: 'DMSans_700Bold',
        fontSize: 18,
        lineHeight: 24,
        color: COLORS.text
    },
    compareColumns: {
        width: 120,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    compareColumnCell: {
        width: 48,
        alignItems: 'center',
        justifyContent: 'center'
    },
    planCellText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 12,
        color: '#8A8F98',
        textAlign: 'center'
    },
    planCellTextAccent: {
        color: COLORS.primary
    },
    statusCard: {
        marginTop: 18,
        backgroundColor: COLORS.white,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: '#ECEDE8',
        padding: 18
    },
    statusCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    statusTitle: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
        color: '#8A8F98'
    },
    statusValue: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
        color: COLORS.text
    },
    statusLine: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 14,
        lineHeight: 21,
        color: '#4B5563',
        marginTop: 4
    },
    statusMeta: {
        marginTop: 12,
        fontFamily: 'DMSans_500Medium',
        fontSize: 13,
        color: '#8A8F98'
    },
    upgradeButton: {
        marginTop: 28,
        minHeight: 62,
        borderRadius: 31,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 5
    },
    upgradeButtonDisabled: {
        opacity: 0.7
    },
    upgradeButtonText: {
        color: COLORS.white,
        fontFamily: 'DMSans_700Bold',
        fontSize: 20
    },
    restoreButton: {
        marginTop: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    restoreButtonText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 18,
        color: COLORS.primary,
        textDecorationLine: 'underline'
    },
    footerBlock: {
        alignItems: 'center',
        marginTop: 14,
        gap: 10
    },
    footerLinks: {
        flexDirection: 'row',
        gap: 18
    },
    footerLink: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 13,
        color: '#4B5563'
    },
    footerMeta: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 15,
        color: COLORS.text,
        textAlign: 'center'
    }
});

export default SubscriptionScreen;
