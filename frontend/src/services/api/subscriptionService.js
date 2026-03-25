import {
    finishTransaction,
    getAvailablePurchases,
    getProducts,
    initConnection,
    purchaseUpdatedListener,
    purchaseErrorListener,
    requestSubscription
} from 'react-native-iap';
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

export const subscriptionService = {
    async getCatalog() {
        const catalog = await subscriptionGuardService.getSubscriptionCatalog();
        const plans = Array.isArray(catalog?.plans) ? catalog.plans : [];
        const productIds = Array.from(new Set(plans.map((plan) => String(plan?.productId || '').trim()).filter(Boolean)));
        let storeProducts = [];
        if (productIds.length > 0) {
            try {
                await ensureConnection();
                storeProducts = await getProducts({ skus: productIds });
            } catch (error) {
                console.warn('[subscriptionService] Failed to fetch store products', error?.message || error);
            }
        }
        return {
            plans,
            storeProducts
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
        return requestSubscription({
            sku: productId
        });
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
                if (payload.purchaseToken && purchase?.purchaseToken) {
                    await subscriptionGuardService.validateGooglePurchase({
                        purchaseToken: payload.purchaseToken,
                        productId: payload.productId
                    });
                } else {
                    await subscriptionGuardService.validateAppleTransaction({
                        productId: payload.productId,
                        transactionId: payload.transactionId,
                        originalTransactionId: payload.originalTransactionId,
                        signedTransactionInfo: payload.signedTransactionInfo
                    });
                }
                await finishTransaction({ purchase, isConsumable: false });
                if (typeof onSuccess === 'function') onSuccess(purchase);
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
