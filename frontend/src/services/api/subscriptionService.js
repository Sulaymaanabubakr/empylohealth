import {
    finishTransaction,
    fetchProducts,
    initConnection,
    purchaseUpdatedListener,
    purchaseErrorListener,
    requestPurchase
} from 'react-native-iap';
import { Platform } from 'react-native';
import { subscriptionGuardService } from '../subscription/subscriptionGuardService';
import { revenueCatService, REVENUECAT_PACKAGE_IDS } from '../subscription/revenueCatService';

let iapReady = false;
let updateSub = null;
let errorSub = null;

const ensureConnection = async () => {
    if (iapReady) return true;
    await initConnection();
    iapReady = true;
    return true;
};

const extractPurchasePayload = (purchase) => ({
    purchaseToken: purchase?.purchaseToken || '',
    transactionId: purchase?.transactionId || purchase?.transactionIdentifierIOS || '',
    originalTransactionId: purchase?.originalTransactionIdentifierIOS || purchase?.originalTransactionId || '',
    signedTransactionInfo: purchase?.signedTransactionInfo || '',
    productId: purchase?.productId || ''
});

const buildIdempotencyKey = (purchase, productId = '') =>
    String(
        purchase?.transactionId
        || purchase?.transactionIdentifierIOS
        || purchase?.originalTransactionIdentifierIOS
        || purchase?.purchaseToken
        || `${productId}:${Date.now()}`
    );

const selectFallbackProductId = (plan, defaults) => {
    const platformKey = Platform.OS === 'ios' ? 'ios' : 'android';
    const explicitByPlatform = String(plan?.productIds?.[platformKey] || '').trim();
    if (explicitByPlatform) return explicitByPlatform;
    const defaultList = Array.isArray(defaults?.[`${platformKey}ProductIds`]) ? defaults[`${platformKey}ProductIds`] : [];
    const firstDefault = String(defaultList[0] || '').trim();
    return firstDefault;
};

const normalizePlan = (plan, defaults) => {
    const explicitProductId = String(plan?.productId || '').trim();
    const productId = explicitProductId || selectFallbackProductId(plan, defaults);
    return {
        ...plan,
        productId
    };
};

const buildPurchaseRequest = (productId, type = 'in-app') => ({
    request: (
        Platform.OS === 'ios'
            ? { ios: { sku: productId } }
            : { android: { skus: [productId] } }
    ),
    type
});

const getCurrentPlatformKey = () => (Platform.OS === 'ios' ? 'ios' : 'android');

const getStoreProductPriceLabel = (product) => (
    product?.displayPrice
    || product?.localizedPrice
    || product?.priceString
    || product?.oneTimePurchaseOfferDetails?.formattedPrice
    || product?.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice
    || product?.formattedPrice
    || ''
);

const enrichPlanWithRevenueCat = (plan, packageMap = {}) => {
    const planId = String(plan?.id || '').trim().toLowerCase();
    if (!planId || planId === 'free' || planId === 'enterprise') return plan;

    const packageIds = planId === 'pro'
        ? {
            monthly: REVENUECAT_PACKAGE_IDS.PRO_MONTHLY,
            annual: REVENUECAT_PACKAGE_IDS.PRO_ANNUAL,
        }
        : {
            monthly: REVENUECAT_PACKAGE_IDS.PREMIUM_MONTHLY,
            annual: REVENUECAT_PACKAGE_IDS.PREMIUM_ANNUAL,
        };

    const monthlyPackage = packageMap[packageIds.monthly] || null;
    const annualPackage = packageMap[packageIds.annual] || null;

    return {
        ...plan,
        productId: monthlyPackage?.product?.identifier || plan?.productId || '',
        priceLabel: monthlyPackage?.product?.priceString || plan?.priceLabel || '',
        annualPriceLabel: annualPackage?.product?.priceString || plan?.annualPriceLabel || '',
        productIds: {
            ...(plan?.productIds || {}),
            [getCurrentPlatformKey()]: [
                monthlyPackage?.product?.identifier,
                annualPackage?.product?.identifier,
            ].filter(Boolean),
        },
        revenueCatPackages: {
            monthly: monthlyPackage,
            annual: annualPackage,
        },
    };
};

export const subscriptionService = {
    async getCatalog() {
        const [catalog, offerings] = await Promise.all([
            subscriptionGuardService.getSubscriptionCatalog(),
            revenueCatService.getOfferings().catch(() => null),
        ]);
        const defaults = catalog?.defaults || {};
        const platformKey = getCurrentPlatformKey();
        const currentOffering = revenueCatService.getCurrentOffering(offerings);
        const packageMap = revenueCatService.getPackageMap(currentOffering);
        const plans = Array.isArray(catalog?.plans)
            ? catalog.plans.map((plan) => enrichPlanWithRevenueCat(normalizePlan(plan, defaults), packageMap))
            : [];
        const boosts = Array.isArray(catalog?.boosts)
            ? catalog.boosts.filter((boost) => {
                const platform = String(boost?.platform || '').trim().toLowerCase();
                return !platform || platform === platformKey;
            })
            : [];
        const boostIds = Array.from(new Set(boosts.map((boost) => String(boost?.productId || boost?.id || '').trim()).filter(Boolean)));
        
        let storeProducts = [];
        try {
            await ensureConnection();
            const queries = [];
            if (boostIds.length > 0) queries.push(fetchProducts({ skus: boostIds, type: 'in-app' }));
            
            if (queries.length > 0) {
                const results = await Promise.all(queries);
                storeProducts = results.flat();
            }
        } catch (error) {
            console.warn('[subscriptionService] Failed to fetch store products:', error?.message || error);
        }

        const storeProductMap = new Map(
            storeProducts.map((product) => [
                String(product?.productId || product?.id || product?.sku || '').trim(),
                product,
            ])
        );
        const enrichedBoosts = boosts.map((boost) => {
            const productId = String(boost?.productId || boost?.id || '').trim();
            const storeProduct = storeProductMap.get(productId);
            return {
                ...boost,
                priceLabel: getStoreProductPriceLabel(storeProduct) || boost?.priceLabel || '',
            };
        });

        return {
            plans,
            boosts: enrichedBoosts,
            storeProducts,
            enterprise: catalog?.enterprise || null,
            offering: currentOffering || null,
        };
    },

    async getStatus(forceRefresh = false) {
        return subscriptionGuardService.getSubscriptionStatus(forceRefresh);
    },

    async requestPlanPurchase(plan) {
        const selectedCadence = String(plan?.selectedCadence || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly';
        const aPackage = selectedCadence === 'annual' ? plan?.revenueCatPackages?.annual : plan?.revenueCatPackages?.monthly;
        if (!aPackage) {
            throw new Error('This plan is not configured for purchase yet.');
        }
        try {
            const customerInfo = await revenueCatService.purchasePackage(aPackage);
            try {
                await subscriptionGuardService.syncRevenueCatCustomer({
                    customerInfo: revenueCatService.serializeCustomerInfo(customerInfo),
                    source: 'subscription_purchase',
                    forceDowngrade: false,
                });
            } catch (syncError) {
                console.warn('[RevenueCat] purchase sync failed', syncError?.message || syncError);
            }
            return customerInfo;
        } catch (error) {
            if (error?.userCancelled) return null;
            throw error;
        }
    },

    async requestBoostPurchase(boost) {
        const productId = String(boost?.productId || boost?.id || '').trim();
        if (!productId) {
            throw new Error('This boost is not configured for purchase yet.');
        }
        await ensureConnection();
        return requestPurchase(buildPurchaseRequest(productId, 'in-app'));
    },

    async restore(payload = {}) {
        const customerInfo = await revenueCatService.restorePurchases();
        try {
            await subscriptionGuardService.syncRevenueCatCustomer({
                customerInfo: revenueCatService.serializeCustomerInfo(customerInfo),
                source: 'restore',
                forceDowngrade: false,
            });
        } catch (syncError) {
            console.warn('[RevenueCat] restore sync failed', syncError?.message || syncError);
        }
        return customerInfo;
    },

    startPurchaseListeners({ onSuccess, onError } = {}) {
        if (updateSub || errorSub) return;
        updateSub = purchaseUpdatedListener(async (purchase) => {
            try {
                const payload = extractPurchasePayload(purchase);
                const idempotencyKey = buildIdempotencyKey(purchase, payload.productId);
                const isBoostPurchase = String(payload.productId || '').toLowerCase().includes('boost');
                let result;
                if (isBoostPurchase) {
                    result = await subscriptionGuardService.validateBoostPurchase({
                        productId: payload.productId,
                        platform: Platform.OS,
                        purchaseToken: payload.purchaseToken,
                        transactionId: payload.transactionId,
                        originalTransactionId: payload.originalTransactionId,
                        idempotencyKey
                    });
                } else if (payload.purchaseToken && purchase?.purchaseToken) {
                    result = await subscriptionGuardService.validateGooglePurchase({
                        purchaseToken: payload.purchaseToken,
                        productId: payload.productId,
                        idempotencyKey
                    });
                } else {
                    result = await subscriptionGuardService.validateAppleTransaction({
                        productId: payload.productId,
                        transactionId: payload.transactionId,
                        originalTransactionId: payload.originalTransactionId,
                        signedTransactionInfo: payload.signedTransactionInfo,
                        idempotencyKey
                    });
                }
                await finishTransaction({ purchase, isConsumable: isBoostPurchase });
                if (typeof onSuccess === 'function') onSuccess(purchase, result);
            } catch (error) {
                if (typeof onError === 'function') onError(error);
            }
        });
        errorSub = purchaseErrorListener((error) => {
            if (typeof onError === 'function') onError(error);
        });
    },

    stopPurchaseListeners() {
        updateSub?.remove?.();
        errorSub?.remove?.();
        updateSub = null;
        errorSub = null;
    }
};
