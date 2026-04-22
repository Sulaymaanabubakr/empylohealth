import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator, Linking, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useModal } from '../context/ModalContext';
import { LEGAL_LINKS } from '../constants/legalLinks';
import { subscriptionService } from '../services/api/subscriptionService';
import { subscriptionGuardService } from '../services/subscription/subscriptionGuardService';
import { getPlanRules, normalizePlanId } from '../services/subscription/subscriptionConfig';
import { revenueCatService } from '../services/subscription/revenueCatService';
import LoadingOverlay from '../components/LoadingOverlay';
import { COLORS, SPACING } from '../theme/theme';

const PLAN_ORDER = ['free', 'pro', 'premium', 'enterprise'];

const FEATURE_ROWS = [
    { label: 'Join huddles', key: 'canJoinHuddles', type: 'capability' },
    { label: 'Start huddles', key: 'canStartHuddles', type: 'capability' },
    { label: 'Schedule huddles', key: 'canScheduleHuddles', type: 'capability' },
    { label: 'AI assistant', key: 'canUseAiAssistant', type: 'capability' },
    { label: 'Full Daily Focus', key: 'hasFullKeyChallenges', type: 'capability' },
    { label: 'Group activities', key: 'canAccessGroupActivities', type: 'capability' },
    { label: 'Share activities', key: 'canShareActivities', type: 'capability' },
    { label: 'Monthly AI credits', key: 'monthlyAiCredits', type: 'limit' },
    { label: 'Monthly huddle minutes', key: 'monthlyHuddleMinutes', type: 'limit' },
    { label: 'Max minutes per huddle', key: 'maxMinutesPerHuddle', type: 'limit' },
];

const getPlanProductIdForCadence = (plan, cadence = 'monthly') => {
    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    const productIds = Array.isArray(plan?.productIds?.[platformKey]) ? plan.productIds[platformKey] : [];
    const needle = cadence === 'annual' ? 'annual' : 'monthly';
    const exact = productIds.find((id) => String(id || '').toLowerCase().includes(`.${needle}.`));
    return String(exact || productIds[0] || '').trim();
};

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
    const [boosts, setBoosts] = useState([]);
    const [enterpriseConfig, setEnterpriseConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busyProductId, setBusyProductId] = useState('');
    const [restoring, setRestoring] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('pro');
    const [selectedCadence, setSelectedCadence] = useState('annual');

    const refresh = async (forceRefresh = false) => {
        setLoading(true);
        try {
            const [catalog, nextStatus] = await Promise.all([
                subscriptionService.getCatalog(),
                subscriptionService.getStatus(forceRefresh)
            ]);
            setPlans(Array.isArray(catalog?.plans) ? catalog.plans : []);
            setBoosts(Array.isArray(catalog?.boosts) ? catalog.boosts : []);
            setEnterpriseConfig(catalog?.enterprise || null);
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
                    title: 'Purchase complete',
                    message: 'Your balance and subscription status have been updated.'
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
    const remaining = status?.remaining || {};
    const limits = status?.limits || {};
    const capabilities = status?.capabilities || {};
    const currentPlan = entitlement?.plan || 'free';
    const currentCadence = String(entitlement?.billingCadence || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
    const currentRules = getPlanRules(currentPlan);
    const normalizedPlans = useMemo(() => {
        const mapped = plans.map((plan) => ({
            ...plan,
            id: normalizePlanId(plan?.id),
            capabilities: plan?.capabilities || {},
            limits: plan?.limits || {}
        }));
        const byId = new Map(mapped.map((plan) => [plan.id, plan]));
        return PLAN_ORDER
            .map((id) => byId.get(id))
            .filter(Boolean);
    }, [plans]);

    const selectedPlan = normalizedPlans.find((plan) => plan.id === selectedPlanId)
        || normalizedPlans.find((plan) => plan.id === 'pro')
        || null;

    useEffect(() => {
        const fallbackPlan = currentPlan === 'free' ? 'pro' : currentPlan;
        setSelectedPlanId(fallbackPlan);
    }, [currentPlan]);

    useEffect(() => {
        if (selectedPlanId === 'free' || selectedPlanId === 'enterprise') {
            setSelectedCadence('monthly');
            return;
        }
        setSelectedCadence('annual');
    }, [selectedPlanId]);

    const selectedPlanPricing = useMemo(() => {
        const activePriceLabel = (selectedCadence === 'annual' ? selectedPlan?.annualPriceLabel : selectedPlan?.priceLabel)
            || '';
        const productId = getPlanProductIdForCadence(selectedPlan, selectedCadence);
        const annualSavingsPercent = Number(selectedPlan?.annualSavingsPercent || 0);

        return {
            activePriceLabel,
            annualSavingsPercent: annualSavingsPercent > 0 ? annualSavingsPercent : null,
            productId,
        };
    }, [selectedCadence, selectedPlan]);

    const comparisonTitle = selectedPlan?.displayName || selectedPlan?.name || 'Choose your plan';
    const comparisonSubtitle = selectedPlanId === 'enterprise'
        ? 'Coach+ is managed outside the app for organisations and coaching teams.'
        : selectedCadence === 'annual' && selectedPlanPricing.annualSavingsPercent
            ? `Best value. Save ${selectedPlanPricing.annualSavingsPercent}% with yearly billing.`
            : selectedCadence === 'annual'
                ? 'Yearly billing keeps everything on one renewal and is usually the best value.'
            : 'Plans refresh on your renewal date. Subscription balances do not roll over.';

    const summaryRows = useMemo(() => ([
        `AI credits remaining: ${remaining?.aiCreditsRemaining ?? 0}${remaining?.boostAiCreditsRemaining ? ` (+${remaining.boostAiCreditsRemaining} boost)` : ''}`,
        `Huddle minutes remaining: ${remaining?.huddleMinutesRemaining ?? 0}${remaining?.boostHuddleMinutesRemaining ? ` (+${remaining.boostHuddleMinutesRemaining} boost)` : ''}`,
        `Current plan: ${currentRules.label}`,
    ]), [currentRules.label, remaining]);

    const handleSubscribe = async (planToBuy = selectedPlanPurchase) => {
        if (!planToBuy?.productId) {
            showModal({
                type: 'info',
                title: 'Purchases unavailable',
                message: selectedPlanId === 'enterprise'
                    ? 'Enterprise plans are activated by our team outside the app.'
                    : 'No product ID is configured for this plan yet.'
            });
            return;
        }
        try {
            setBusyProductId(String(planToBuy.productId));
            const result = await subscriptionService.requestPlanPurchase(planToBuy);
            if (!result) {
                setBusyProductId('');
                return;
            }
            await refresh(true);
            showModal({
                type: 'success',
                title: 'Subscription updated',
                message: 'Your subscription is active and your plan status has been refreshed.'
            });
            setBusyProductId('');
        } catch (error) {
            setBusyProductId('');
            if (error?.userCancelled) return;
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
            await subscriptionService.restore({ productId: selectedPlanPricing.productId || '' });
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

    const handleEnterprisePress = async () => {
        const url = enterpriseConfig?.url || 'https://circleshealth.com';
        try {
            await Linking.openURL(url);
        } catch {
            showModal({
                type: 'error',
                title: 'Unable to open link',
                message: 'Please try again later.'
            });
        }
    };

    const handleManageSubscription = async () => {
        try {
            await revenueCatService.presentCustomerCenter();
        } catch (error) {
            showModal({
                type: 'error',
                title: 'Subscription management unavailable',
                message: error?.message || 'Unable to open subscription management right now.'
            });
        }
    };

    const renderFeatureValue = (plan, row) => {
        if (row.type === 'capability') {
            return <PlanCell enabled={plan?.capabilities?.[row.key] === true} accent={plan?.id === selectedPlanId} />;
        }
        const value = plan?.limits?.[row.key];
        return <PlanCell text={value == null ? 'Custom' : String(value)} accent={plan?.id === selectedPlanId} />;
    };

    const isCurrentPlanSelected = selectedPlanId === normalizePlanId(currentPlan) && (
        selectedPlanId === 'free'
        || selectedPlanId === 'enterprise'
        || selectedCadence === currentCadence
    );
    const currentProductBusy = busyProductId && busyProductId === selectedPlanPricing.productId;

    const handleBoostPurchase = async (boost) => {
        const productId = String(boost?.productId || boost?.id || '').trim();
        if (!productId) {
            showModal({
                type: 'info',
                title: 'Purchases unavailable',
                message: 'This boost is not configured for purchase yet.'
            });
            return;
        }
        try {
            setBusyProductId(productId);
            await subscriptionService.requestBoostPurchase(boost);
        } catch (error) {
            setBusyProductId('');
            showModal({
                type: 'error',
                title: 'Unable to start purchase',
                message: error?.message || 'Unable to open the store purchase flow.'
            });
        }
    };

    const selectedPlanPurchase = selectedPlan
        ? {
            ...selectedPlan,
            productId: selectedPlanPricing.productId,
            selectedCadence,
        }
        : null;

    const renderLoadingState = () => (
        <View style={styles.loadingState}>
            <View style={styles.hero}>
                <View style={styles.heroIcon}>
                    <Image source={require('../assets/images/logo_teal.png')} style={styles.heroLogo} resizeMode="contain" />
                </View>
                <Text style={styles.heroTitle}>Membership</Text>
                <Text style={styles.heroSubtitle}>
                    Loading your current plan, usage, and upgrade options.
                </Text>
            </View>

            <View style={styles.loadingCard}>
                <View style={[styles.loadingLine, styles.loadingLineWide]} />
                <View style={[styles.loadingLine, styles.loadingLineMedium]} />
                <View style={[styles.loadingPillRow]}>
                    <View style={styles.loadingPill} />
                    <View style={styles.loadingPill} />
                    <View style={styles.loadingPill} />
                </View>
            </View>

            <View style={styles.loadingCard}>
                <View style={[styles.loadingLine, styles.loadingLineWide]} />
                <View style={[styles.loadingLine, styles.loadingLineShort]} />
                <View style={[styles.loadingComparisonRow]}>
                    <View style={styles.loadingColumn} />
                    <View style={styles.loadingColumn} />
                </View>
                <View style={[styles.loadingComparisonRow]}>
                    <View style={styles.loadingColumn} />
                    <View style={styles.loadingColumn} />
                </View>
                <View style={[styles.loadingComparisonRow]}>
                    <View style={styles.loadingColumn} />
                    <View style={styles.loadingColumn} />
                </View>
            </View>
        </View>
    );

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
                {loading ? renderLoadingState() : (
                    <>
                        <View style={styles.hero}>
                            <View style={styles.heroIcon}>
                                <Image source={require('../assets/images/logo_teal.png')} style={styles.heroLogo} resizeMode="contain" />
                            </View>
                            <Text style={styles.heroTitle}>{comparisonTitle}</Text>
                            <Text style={styles.heroSubtitle}>{comparisonSubtitle}</Text>

                            <View style={styles.toggleWrap}>
                                <View style={styles.toggleTrack}>
                                    {normalizedPlans.map((plan) => (
                                        <TouchableOpacity
                                            key={plan.id}
                                            style={[styles.togglePill, selectedPlanId === plan.id && styles.togglePillActive]}
                                            onPress={() => setSelectedPlanId(plan.id)}
                                            activeOpacity={0.9}
                                        >
                                            <Text style={[styles.toggleLabel, selectedPlanId === plan.id ? styles.toggleLabelActiveText : styles.toggleLabelMuted]}>
                                                {plan.displayName || plan.name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {selectedPlanId !== 'free' && selectedPlanId !== 'enterprise' && (
                                <View style={styles.billingCard}>
                                    <View style={styles.billingToggle}>
                                        <TouchableOpacity
                                            style={[styles.billingOption, selectedCadence === 'monthly' && styles.billingOptionActive]}
                                            onPress={() => setSelectedCadence('monthly')}
                                            activeOpacity={0.9}
                                        >
                                            <Text style={[styles.billingLabel, selectedCadence === 'monthly' ? styles.billingLabelActive : styles.billingLabelMuted]}>
                                                Monthly
                                            </Text>
                                            <Text style={[styles.billingPrice, selectedCadence === 'monthly' ? styles.billingPriceActive : styles.billingPriceMuted]}>
                                                {selectedPlan?.priceLabel || 'Unavailable'}
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.billingOption, styles.billingAnnualOption, selectedCadence === 'annual' && styles.billingOptionActive]}
                                            onPress={() => setSelectedCadence('annual')}
                                            activeOpacity={0.9}
                                        >
                                            <View style={styles.billingAnnualHeader}>
                                                <Text style={[styles.billingLabel, selectedCadence === 'annual' ? styles.billingLabelActive : styles.billingLabelMuted]}>
                                                    Annual
                                                </Text>
                                                <View style={styles.discountBadge}>
                                                    <Text style={styles.discountBadgeText}>
                                                        {selectedPlanPricing.annualSavingsPercent
                                                            ? `Save ${selectedPlanPricing.annualSavingsPercent}%`
                                                            : 'Best value'}
                                                    </Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.billingPrice, selectedCadence === 'annual' ? styles.billingPriceActive : styles.billingPriceMuted]}>
                                                {selectedPlan?.annualPriceLabel || 'Unavailable'}
                                            </Text>
                                            <Text style={styles.billingHint}>
                                                {selectedPlanPricing.annualSavingsPercent
                                                    ? `Pay yearly and save ${selectedPlanPricing.annualSavingsPercent}%`
                                                    : 'Pay yearly for the best value'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
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
                                    <Text style={styles.compareFreeHeader}>Current</Text>
                                    <Text style={styles.compareProHeader}>Selected</Text>
                                </View>
                            </View>

                            {FEATURE_ROWS.map((row, index) => (
                                <View key={row.label} style={[styles.compareRow, index === FEATURE_ROWS.length - 1 && styles.compareRowLast]}>
                                    <Text style={styles.compareLabel}>{row.label}</Text>
                                    <View style={styles.compareColumns}>
                                        <View style={styles.compareColumnCell}>
                                            {renderFeatureValue(normalizedPlans.find((plan) => plan.id === normalizePlanId(currentPlan)) || {
                                                id: normalizePlanId(currentPlan),
                                                capabilities,
                                                limits
                                            }, row)}
                                        </View>
                                        <View style={styles.compareColumnCell}>
                                            {renderFeatureValue(selectedPlan, row)}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.statusCard}>
                            <View style={styles.statusCardHeader}>
                                <Text style={styles.statusTitle}>Current plan</Text>
                                <Text style={styles.statusValue}>{status?.entitlement?.displayName || currentRules.label}</Text>
                            </View>
                            {summaryRows.map((row) => (
                                <Text key={row} style={styles.statusLine}>{row}</Text>
                            ))}
                            <Text style={styles.statusMeta}>
                                {status?.refreshesOn
                                    ? `Credits refresh on ${new Date(status.refreshesOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}.`
                                    : formatExpiry(entitlement?.expiresAt)}
                            </Text>
                        </View>

                        {boosts.length > 0 && capabilities?.canUseBoosts === true && (
                            <View style={styles.statusCard}>
                                <View style={styles.statusCardHeader}>
                                    <Text style={styles.statusTitle}>Boost packs</Text>
                                    <Text style={styles.statusValue}>Non-expiring</Text>
                                </View>
                                {boosts.map((boost) => {
                                    const boostId = boost.productId || boost.id;
                                    const isBusy = busyProductId === boostId;
                                    return (
                                        <View key={boostId} style={styles.boostRow}>
                                            <View style={styles.boostCopy}>
                                                <Text style={styles.boostTitle}>{boost.title || boost.name || boost.productId}</Text>
                                                <Text style={styles.statusLine}>
                                                    {(boost.priceLabel ? `${boost.priceLabel} · ` : '')}+{boost.aiCredits || 0} AI credits and +{boost.huddleMinutes || 0} huddle minutes
                                                </Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.boostButton}
                                                onPress={() => handleBoostPurchase(boost)}
                                                disabled={!!busyProductId}
                                            >
                                                {isBusy ? (
                                                    <ActivityIndicator color="#FFFFFF" size="small" />
                                                ) : (
                                                    <Text style={styles.boostButtonText}>Buy</Text>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.upgradeButton, (isCurrentPlanSelected || selectedPlanId === 'free') && styles.upgradeButtonDisabled]}
                            onPress={selectedPlanId === 'enterprise' ? handleEnterprisePress : () => handleSubscribe(selectedPlanPurchase)}
                            disabled={selectedPlanId !== 'enterprise' && (isCurrentPlanSelected || selectedPlanId === 'free' || !!busyProductId || !selectedPlanPricing.productId)}
                        >
                            {currentProductBusy ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.upgradeButtonText}>
                                    {selectedPlanId === 'enterprise'
                                        ? 'Contact us for a demo'
                                        : isCurrentPlanSelected
                                            ? `${currentRules.label} active`
                                            : `Choose ${selectedPlanPricing.activePriceLabel || 'this plan'}`}
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

                        {selectedPlanId !== 'enterprise' && (
                            <TouchableOpacity style={styles.manageButton} onPress={handleManageSubscription}>
                                <Text style={styles.manageButtonText}>Manage subscription</Text>
                            </TouchableOpacity>
                        )}

                        <View style={styles.footerBlock}>
                            <View style={styles.footerLinks}>
                                <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.terms)}>
                                    <Text style={styles.footerLink}>Terms</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => Linking.openURL(LEGAL_LINKS.privacy)}>
                                    <Text style={styles.footerLink}>Privacy</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.footerMeta}>
                                {selectedCadence === 'annual' ? 'Auto-renews yearly. Cancel anytime.' : 'Auto-renews monthly. Cancel anytime.'}
                            </Text>
                        </View>
                    </>
                )}
            </ScrollView>

            <LoadingOverlay
                visible={loading}
                title="Preparing subscription"
                message="Fetching your plan details and storefront options."
            />
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
    loadingState: {
        paddingTop: 12,
        gap: 18,
    },
    loadingCard: {
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E7EEEB',
        padding: 20,
        gap: 14,
    },
    loadingLine: {
        height: 14,
        borderRadius: 999,
        backgroundColor: '#E6EEEB',
    },
    loadingLineWide: {
        width: '78%',
    },
    loadingLineMedium: {
        width: '56%',
    },
    loadingLineShort: {
        width: '42%',
    },
    loadingPillRow: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 6,
    },
    loadingPill: {
        flex: 1,
        height: 44,
        borderRadius: 16,
        backgroundColor: '#EEF4F1',
    },
    loadingComparisonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    loadingColumn: {
        flex: 1,
        height: 46,
        borderRadius: 16,
        backgroundColor: '#EEF4F1',
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
        fontSize: 28,
        color: COLORS.text,
        textAlign: 'center'
    },
    heroSubtitle: {
        marginTop: 10,
        fontFamily: 'DMSans_500Medium',
        fontSize: 14,
        lineHeight: 20,
        color: '#6B7280',
        textAlign: 'center',
        paddingHorizontal: 20
    },
    billingCard: {
        marginTop: 18,
        width: '100%',
        maxWidth: 420,
    },
    billingToggle: {
        gap: 12,
    },
    billingOption: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#D9E7E4',
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    billingAnnualOption: {
        borderColor: '#BFE4DE',
        backgroundColor: '#F4FBF9',
    },
    billingOptionActive: {
        borderColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
        elevation: 3
    },
    billingAnnualHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    billingLabel: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 14,
    },
    billingLabelActive: {
        color: COLORS.primary,
    },
    billingLabelMuted: {
        color: '#6B7280',
    },
    billingPrice: {
        marginTop: 6,
        fontFamily: 'SpaceGrotesk_700Bold',
        fontSize: 19,
    },
    billingPriceActive: {
        color: COLORS.text,
    },
    billingPriceMuted: {
        color: '#4B5563',
    },
    billingHint: {
        marginTop: 6,
        fontFamily: 'DMSans_500Medium',
        fontSize: 12,
        color: '#4D7A74',
    },
    discountBadge: {
        backgroundColor: COLORS.primary,
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    discountBadgeText: {
        color: '#FFFFFF',
        fontFamily: 'DMSans_700Bold',
        fontSize: 11,
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
        fontSize: 13,
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
        fontSize: 12,
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
        fontSize: 14,
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
        fontSize: 13,
        color: '#8A8F98'
    },
    compareProHeader: {
        width: 48,
        textAlign: 'center',
        fontFamily: 'DMSans_700Bold',
        fontSize: 13,
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
        fontSize: 14,
        lineHeight: 20,
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
        fontSize: 11,
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
        fontSize: 13,
        color: '#8A8F98'
    },
    statusValue: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 13,
        color: COLORS.text
    },
    statusLine: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 13,
        lineHeight: 19,
        color: '#4B5563',
        marginTop: 4
    },
    statusMeta: {
        marginTop: 12,
        fontFamily: 'DMSans_500Medium',
        fontSize: 12,
        color: '#8A8F98'
    },
    boostRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F1EE',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12
    },
    boostCopy: {
        flex: 1
    },
    boostTitle: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 13,
        color: COLORS.text
    },
    boostButton: {
        minWidth: 72,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14
    },
    boostButtonText: {
        color: '#FFFFFF',
        fontFamily: 'DMSans_700Bold',
        fontSize: 13
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
        fontSize: 15
    },
    restoreButton: {
        marginTop: 18,
        alignItems: 'center',
        justifyContent: 'center'
    },
    restoreButtonText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 15,
        color: COLORS.primary,
        textDecorationLine: 'underline'
    },
    manageButton: {
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    manageButtonText: {
        fontFamily: 'DMSans_700Bold',
        fontSize: 14,
        color: '#4B5563'
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
        fontSize: 12,
        color: '#4B5563'
    },
    footerMeta: {
        fontFamily: 'DMSans_500Medium',
        fontSize: 13,
        color: COLORS.text,
        textAlign: 'center'
    }
});

export default SubscriptionScreen;
