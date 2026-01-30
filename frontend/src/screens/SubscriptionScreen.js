import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import PlanDetailModal from '../components/PlanDetailModal';
import SubscriptionSuccessModal from '../components/SubscriptionSuccessModal';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

const { width } = Dimensions.get('window');

const SubscriptionScreen = ({ navigation }) => {
    const { userData } = useAuth();
    const { showModal } = useModal();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [plans, setPlans] = useState([]);

    useEffect(() => {
        const q = query(collection(db, 'subscriptionPlans'));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setPlans(items);
        }, () => setPlans([]));
    }, []);

    const formatPrice = (plan) => {
        if (typeof plan.price === 'number') {
            const currency = plan.currency || 'GBP';
            try {
                return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(plan.price);
            } catch (error) {
                return `${plan.currencySymbol || ''}${plan.price}`;
            }
        }
        return plan.priceLabel || plan.price || '';
    };

    const currentPlanLabel = useMemo(() => {
        if (!userData?.subscription?.plan) return 'FREE';
        return String(userData.subscription.plan).toUpperCase();
    }, [userData?.subscription?.plan]);

    const currentPlanPrice = useMemo(() => {
        return userData?.subscription?.priceLabel || '';
    }, [userData?.subscription?.priceLabel]);

    const handleSelectPlan = (plan) => {
        setSelectedPlan({ ...plan, priceLabel: formatPrice(plan) });
    };

    const handleSubscribe = () => {
        if (!selectedPlan?.productId) {
            showModal({ type: 'info', title: 'Purchases unavailable', message: 'This plan is not configured for in-app purchases yet.' });
            return;
        }
        setSelectedPlan(null);
        setShowSuccess(true);
    };

    const renderPlanCard = (plan) => (
        <View key={plan.id} style={styles.planCard}>
            <View style={styles.planIconContainer}>
                <MaterialCommunityIcons
                    name={plan.iconName || 'star-outline'}
                    size={28}
                    color={plan.accentColor || '#009688'}
                />
            </View>
            <Text style={styles.cardName}>{plan.name}</Text>
            <Text style={styles.cardPrice}>
                {formatPrice(plan)}{plan.period ? <Text style={styles.cardPeriod}>/{plan.period}</Text> : null}
            </Text>

            <TouchableOpacity
                onPress={() => handleSelectPlan(plan)}
                style={styles.selectButtonContainer}
            >
                <LinearGradient
                    colors={plan.gradientColors || ['#E0F2F1', '#B2DFDB']}
                    style={styles.selectButton}
                >
                    <Text style={[styles.selectButtonText, { color: plan.accentColor || '#00695C' }]}>
                        Select Plan
                    </Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="dark-content" />

            {/* Simple Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Subscription Plan</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Current Plan */}
                <View style={styles.currentPlanCard}>
                    <View style={styles.currentPlanHeader}>
                        <View style={styles.currentPlanIcon}>
                            <Ionicons name="gift-outline" size={24} color="#757575" />
                        </View>
                        <View>
                            <Text style={styles.currentPlanLabel}>Current Plan</Text>
                            <Text style={styles.currentPlanTitle}>{currentPlanLabel}</Text>
                        </View>
                    </View>
                    <Text style={styles.currentPlanPrice}>
                        {currentPlanPrice || '—'}{currentPlanPrice ? <Text style={styles.period}>/month</Text> : null}
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Available Plans</Text>

                <View style={styles.plansContainer}>
                    {plans.length === 0 ? (
                        <Text style={styles.emptyText}>No subscription plans available yet.</Text>
                    ) : plans.map(renderPlanCard)}
                </View>

                {/* Footer Links */}
                <View style={styles.footerLinks}>
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.linkText}>Restore Purchases</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.linkText}>Terms of Service</Text>
                    </TouchableOpacity>
                    <View style={styles.divider} />
                    <TouchableOpacity style={styles.footerLink}>
                        <Text style={styles.linkText}>Privacy Policy</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    Subscriptions automatically renew unless auto-renew is turned off at least 24-hours before the end of the current period. Your account will be charged for renewal within 24-hours prior to the end of the current period.
                </Text>

            </ScrollView>

            <PlanDetailModal
                visible={!!selectedPlan}
                plan={selectedPlan}
                onClose={() => setSelectedPlan(null)}
                onSubscribe={handleSubscribe}
            />

            <SubscriptionSuccessModal
                visible={showSuccess}
                onClose={() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }}
            />
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
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 10,
    },
    currentPlanCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    currentPlanHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    currentPlanIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    currentPlanLabel: {
        fontSize: 12,
        color: '#757575',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    currentPlanTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A1A1A',
    },
    currentPlanPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A1A1A',
    },
    period: {
        fontSize: 12,
        fontWeight: '400',
        color: '#757575',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 16,
        marginLeft: 4,
    },
    emptyText: {
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
        marginVertical: 20,
    },
    plansContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    planCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },
    planIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    cardPrice: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1A1A1A',
        marginBottom: 24,
    },
    cardPeriod: {
        fontSize: 12,
        fontWeight: '500',
        color: '#9E9E9E',
    },
    selectButtonContainer: {
        width: '100%',
    },
    selectButton: {
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        width: '100%',
    },
    selectButtonText: {
        fontSize: 13,
        fontWeight: '700',
    },
    footerLinks: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 48,
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 8,
    },
    footerLink: {
        paddingHorizontal: 4,
    },
    linkText: {
        fontSize: 11,
        color: '#009688',
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 12,
        backgroundColor: '#E0E0E0',
    },
    disclaimer: {
        fontSize: 10,
        color: '#BDBDBD',
        textAlign: 'center',
        lineHeight: 14,
        paddingHorizontal: 20,
    },
});

export default SubscriptionScreen;
