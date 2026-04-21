import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY || '';
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY || '';

export const REVENUECAT_ENTITLEMENTS = {
    PRO: 'Pro',
    PREMIUM: 'Premium',
};

export const REVENUECAT_OFFERING_ID = 'default';

export const REVENUECAT_PACKAGE_IDS = {
    PRO_MONTHLY: 'pro_monthly',
    PRO_ANNUAL: 'pro_annual',
    PREMIUM_MONTHLY: 'premium_monthly',
    PREMIUM_ANNUAL: 'premium_annual',
};

let configured = false;
const isAnonymousAppUserId = (value) => String(value || '').startsWith('$RCAnonymousID:');

const getApiKey = () => {
    if (Platform.OS === 'ios') return IOS_API_KEY;
    if (Platform.OS === 'android') return ANDROID_API_KEY;
    return '';
};

const toDateString = (value) => (value ? new Date(value).toISOString() : null);

const serializeEntitlement = (entitlement) => {
    if (!entitlement) return null;
    return {
        identifier: entitlement.identifier,
        productIdentifier: entitlement.productIdentifier,
        isActive: entitlement.isActive === true,
        willRenew: entitlement.willRenew === true,
        periodType: entitlement.periodType || null,
        latestPurchaseDate: toDateString(entitlement.latestPurchaseDate),
        originalPurchaseDate: toDateString(entitlement.originalPurchaseDate),
        expirationDate: toDateString(entitlement.expirationDate),
        store: entitlement.store || null,
        isSandbox: entitlement.isSandbox === true,
        unsubscribeDetectedAt: toDateString(entitlement.unsubscribeDetectedAt),
        billingIssueDetectedAt: toDateString(entitlement.billingIssueDetectedAt),
        ownershipType: entitlement.ownershipType || null,
        productPlanIdentifier: entitlement.productPlanIdentifier || null,
    };
};

const serializeEntitlements = (entitlements = {}) => {
    const active = Object.fromEntries(
        Object.entries(entitlements.active || {})
            .map(([key, value]) => [key, serializeEntitlement(value)])
            .filter(([, value]) => Boolean(value))
    );
    const all = Object.fromEntries(
        Object.entries(entitlements.all || {})
            .map(([key, value]) => [key, serializeEntitlement(value)])
            .filter(([, value]) => Boolean(value))
    );

    return {
        active,
        all,
        verification: entitlements.verification || null,
    };
};

export const revenueCatService = {
    async configure(appUserID) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.warn('[RevenueCat] Missing public API key for platform', Platform.OS);
            return false;
        }
        if (configured) return true;
        try {
            Purchases.setLogLevel(Purchases.LOG_LEVEL.VERBOSE);
            Purchases.configure({
                apiKey,
                appUserID: appUserID || undefined,
            });
            configured = true;
            return true;
        } catch (error) {
            console.warn('[RevenueCat] configure failed', error?.message || error);
            return false;
        }
    },

    async logIn(appUserID) {
        if (!appUserID) return null;
        const ok = await this.configure();
        if (!ok) return null;
        try {
            return await Purchases.logIn(appUserID);
        } catch (error) {
            console.warn('[RevenueCat] logIn failed', error?.message || error);
            return null;
        }
    },

    async logOut() {
        if (!configured) return null;
        try {
            return await Purchases.logOut();
        } catch (error) {
            const message = String(error?.message || error || '');
            if (!message.toLowerCase().includes('current user is anonymous')) {
                console.warn('[RevenueCat] logOut failed', message);
            }
            return null;
        }
    },

    async getOfferings() {
        const ok = await this.configure();
        if (!ok) return null;
        return Purchases.getOfferings();
    },

    async getCustomerInfo() {
        const ok = await this.configure();
        if (!ok) return null;
        return Purchases.getCustomerInfo();
    },

    async logOutIfNeeded() {
        if (!configured) return null;
        const customerInfo = await this.getCustomerInfo().catch(() => null);
        const currentAppUserId = String(customerInfo?.originalAppUserId || '');
        if (!currentAppUserId || isAnonymousAppUserId(currentAppUserId)) {
            return null;
        }
        return this.logOut();
    },

    async syncPurchases() {
        const ok = await this.configure();
        if (!ok) return null;
        const result = await Purchases.syncPurchasesForResult();
        return result?.customerInfo || null;
    },

    async restorePurchases() {
        const ok = await this.configure();
        if (!ok) return null;
        return Purchases.restorePurchases();
    },

    async purchasePackage(aPackage) {
        const ok = await this.configure();
        if (!ok) throw new Error('RevenueCat is not configured yet.');
        const result = await Purchases.purchasePackage(aPackage);
        return result?.customerInfo || null;
    },

    async presentCustomerCenter() {
        const ok = await this.configure();
        if (!ok) throw new Error('RevenueCat is not configured yet.');
        return RevenueCatUI.presentCustomerCenter();
    },

    addCustomerInfoUpdateListener(listener) {
        if (!configured) return () => {};
        const wrapped = (customerInfo) => listener?.(customerInfo);
        Purchases.addCustomerInfoUpdateListener(wrapped);
        return () => {
            Purchases.removeCustomerInfoUpdateListener(wrapped);
        };
    },

    getCurrentOffering(offerings) {
        return offerings?.current || offerings?.all?.[REVENUECAT_OFFERING_ID] || null;
    },

    getPackageMap(offering) {
        const availablePackages = Array.isArray(offering?.availablePackages) ? offering.availablePackages : [];
        const byId = new Map(availablePackages.map((pkg) => [pkg.identifier, pkg]));
        return {
            [REVENUECAT_PACKAGE_IDS.PRO_MONTHLY]: byId.get(REVENUECAT_PACKAGE_IDS.PRO_MONTHLY) || null,
            [REVENUECAT_PACKAGE_IDS.PRO_ANNUAL]: byId.get(REVENUECAT_PACKAGE_IDS.PRO_ANNUAL) || null,
            [REVENUECAT_PACKAGE_IDS.PREMIUM_MONTHLY]: byId.get(REVENUECAT_PACKAGE_IDS.PREMIUM_MONTHLY) || null,
            [REVENUECAT_PACKAGE_IDS.PREMIUM_ANNUAL]: byId.get(REVENUECAT_PACKAGE_IDS.PREMIUM_ANNUAL) || null,
        };
    },

    hasEntitlement(customerInfo, entitlementId) {
        return customerInfo?.entitlements?.active?.[entitlementId]?.isActive === true;
    },

    hasActiveSubscription(customerInfo) {
        return this.hasEntitlement(customerInfo, REVENUECAT_ENTITLEMENTS.PRO)
            || this.hasEntitlement(customerInfo, REVENUECAT_ENTITLEMENTS.PREMIUM);
    },

    serializeCustomerInfo(customerInfo) {
        if (!customerInfo) return null;
        return {
            originalAppUserId: customerInfo.originalAppUserId || null,
            activeSubscriptions: Array.isArray(customerInfo.activeSubscriptions) ? customerInfo.activeSubscriptions : [],
            allPurchasedProductIdentifiers: Array.isArray(customerInfo.allPurchasedProductIdentifiers)
                ? customerInfo.allPurchasedProductIdentifiers
                : [],
            latestExpirationDate: toDateString(customerInfo.latestExpirationDate),
            firstSeen: toDateString(customerInfo.firstSeen),
            originalPurchaseDate: toDateString(customerInfo.originalPurchaseDate),
            requestDate: toDateString(customerInfo.requestDate),
            managementURL: customerInfo.managementURL || null,
            entitlements: serializeEntitlements(customerInfo.entitlements || {}),
        };
    },
};
