import {
    finishTransaction,
    getAvailablePurchases,
    fetchProducts,
    initConnection,
    purchaseUpdatedListener,
    purchaseErrorListener,
    requestPurchase,
    requestSubscription
} from 'react-native-iap';
import { Platform } from 'react-native';
import { subscriptionGuardService } from '../subscription/subscriptionGuardService';

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

const buildPurchaseRequest = (productId) => (
    Platform.OS === 'ios'
        ? { ios: { sku: productId } }
        : { android: { skus: [productId] } }
);

export const subscriptionService = {
    async getCatalog() {
        const catalog = await subscriptionGuardService.getSubscriptionCatalog();
        const defaults = catalog?.defaults || {};
        const plans = Array.isArray(catalog?.plans)
            ? catalog.plans.map((plan) => normalizePlan(plan, defaults))
            : [];
        const boosts = Array.isArray(catalog?.boosts) ? catalog.boosts : [];
        const boostIds = Array.from(new Set(boosts.map((boost) => String(boost?.productId || boost?.id || '').trim()).filter(Boolean)));
        
        let storeProducts = [];
        try {
            await ensureConnection();
            const queries = [];
            if (productIds.length > 0) queries.push(fetchProducts({ skus: productIds, type: 'subs' }));
            if (boostIds.length > 0) queries.push(fetchProducts({ skus: boostIds, type: 'in-app' }));
            
            if (queries.length > 0) {
                const results = await Promise.all(queries);
                storeProducts = results.flat();
            }
        } catch (error) {
            console.warn('[subscriptionService] Failed to fetch store products:', error?.message || error);
        }

        return {
            plans,
            boosts,
            storeProducts,
            enterprise: catalog?.enterprise || null
        };
    },

    async getStatus(forceRefresh = false) {
        return subscriptionGuardService.getSubscriptionStatus(forceRefresh);
    },

    async requestPlanPurchase(plan) {
        const productId = String(plan?.productId || '').trim();
        if (!productId) {
            throw new Error('This plan is not configured for purchase yet.');
        }
        await ensureConnection();
        return requestSubscription(buildPurchaseRequest(productId));
    },

    async requestBoostPurchase(boost) {
        const productId = String(boost?.productId || boost?.id || '').trim();
        if (!productId) {
            throw new Error('This boost is not configured for purchase yet.');
        }
        await ensureConnection();
        return requestPurchase(buildPurchaseRequest(productId));
    },

    async restore(payload = {}) {
        await ensureConnection();
        const purchases = await getAvailablePurchases();
        const first = purchases[0];
        if (!first) {
            throw new Error('No purchases available to restore.');
        }
        const productId = payload?.productId || first.productId;
        if (first.purchaseToken) {
            return subscriptionGuardService.restoreSubscriptions({
                platform: 'android',
                purchaseToken: first.purchaseToken,
                productId
            });
        }
        const applePayload = extractPurchasePayload(first);
        if (!applePayload.transactionId && !applePayload.originalTransactionId && !applePayload.signedTransactionInfo) {
            throw new Error('No Apple transaction identifier is available to restore this subscription.');
        }
        return subscriptionGuardService.restoreSubscriptions({
            platform: 'ios',
            productId,
            transactionId: applePayload.transactionId,
            originalTransactionId: applePayload.originalTransactionId,
            signedTransactionInfo: applePayload.signedTransactionInfo
        });
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
