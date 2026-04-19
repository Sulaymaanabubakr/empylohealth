import { callableClient } from '../api/callableClient';
import { getActivityAccessKind, getAllowedPlansForResource, normalizePlanId } from './subscriptionConfig';

let cachedStatus = null;
let cacheTs = 0;
const STATUS_TTL_MS = 30 * 1000;

const normalizeGuard = (result = {}) => ({
    allowed: result.allowed !== false,
    reasonCode: result.reasonCode || '',
    message: result.message || '',
    plan: normalizePlanId(result.plan || cachedStatus?.entitlement?.plan || 'free'),
    usage: result.usage || cachedStatus?.usage || null,
    upgradeCta: result.upgradeCta || 'upgrade',
    grantedMinutes: typeof result.grantedMinutes === 'number' ? result.grantedMinutes : null
});

const getCachedPlan = () => normalizePlanId(cachedStatus?.entitlement?.plan || 'free');

export const subscriptionGuardService = {
    invalidateCache() {
        cachedStatus = null;
        cacheTs = 0;
    },

    async getSubscriptionStatus(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh && cachedStatus && (now - cacheTs) < STATUS_TTL_MS) {
            return cachedStatus;
        }
        const result = await callableClient.invokeWithAuth('getSubscriptionStatus', {});
        cachedStatus = result || null;
        cacheTs = now;
        return cachedStatus;
    },

    async getEffectiveSubscriptionStatus(forceRefresh = false) {
        const status = await this.getSubscriptionStatus(forceRefresh);
        return status?.entitlement || { plan: 'free', status: 'expired' };
    },

    async getUsageSnapshot(forceRefresh = false) {
        const status = await this.getSubscriptionStatus(forceRefresh);
        return status?.usage || null;
    },

    async getSubscriptionCatalog() {
        return callableClient.invokeWithAuth('getSubscriptionCatalog', {});
    },

    async validateBoostPurchase({ productId, platform, transactionId, originalTransactionId, purchaseToken, idempotencyKey }) {
        const result = await callableClient.invokeWithAuth('validateBoostPurchase', {
            productId,
            platform,
            transactionId,
            originalTransactionId,
            purchaseToken,
            idempotencyKey
        });
        this.invalidateCache();
        return result;
    },

    async canCreateCircle({ type, circles = [] }) {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = normalizePlanId(status?.entitlement?.plan || 'free');
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canStartHuddle() {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = normalizePlanId(status?.entitlement?.plan || 'free');
        const capabilities = status?.capabilities || {};
        const remaining = status?.remaining || {};
        const limits = status?.limits || {};
        if (capabilities?.canStartHuddles !== true) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'plan_cannot_start_huddles',
                message: 'Your current plan does not allow starting huddles.',
                plan,
                usage
            });
        }
        const remainingMinutes = Number(remaining?.huddleMinutesRemaining ?? 0);
        if (remainingMinutes <= 0) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'monthly_huddle_minutes_reached',
                message: 'You have used all available huddle minutes for this billing period.',
                plan,
                usage
            });
        }
        return normalizeGuard({
            allowed: true,
            plan,
            usage,
            grantedMinutes: Math.min(Number(limits?.maxMinutesPerHuddle || remainingMinutes), remainingMinutes)
        });
    },

    async canScheduleHuddle() {
        const status = await this.getSubscriptionStatus();
        const plan = normalizePlanId(status?.entitlement?.plan || 'free');
        const usage = status?.usage || null;
        if (status?.capabilities?.canScheduleHuddles !== true) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'schedule_requires_pro',
                message: 'Scheduling huddles is not available on your current plan.',
                plan,
                usage
            });
        }
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canAccessActivity({ resource }) {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = normalizePlanId(status?.entitlement?.plan || 'free');
        const gatingEnabled = status?.activityGatingEnabled === true;
        if (!gatingEnabled) return normalizeGuard({ allowed: true, plan, usage });
        const kind = getActivityAccessKind(resource);
        const allowedPlans = getAllowedPlansForResource(resource);
        if (kind === 'group_activity' && status?.capabilities?.canAccessGroupActivities !== true) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'group_activity_requires_pro',
                message: 'Group activities are available on Pro.',
                plan,
                usage
            });
        }
        if (!allowedPlans.includes(plan)) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'activity_requires_pro',
                message: 'This activity is available on Pro.',
                plan,
                usage
            });
        }
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canShareActivity({ resource }) {
        const access = await this.canAccessActivity({ resource });
        if (!access.allowed) return access;
        if (resource?.access?.shareRequiresPremium && !cachedStatus?.capabilities?.canShareActivities) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'activity_share_requires_pro',
                message: 'Sharing activities is available on Pro.',
                plan: getCachedPlan(),
                usage: cachedStatus?.usage || null
            });
        }
        return normalizeGuard({
            allowed: true,
            plan: getCachedPlan(),
            usage: cachedStatus?.usage || null
        });
    },

    filterActivities(resources = []) {
        if (!cachedStatus?.activityGatingEnabled) return resources;
        const plan = getCachedPlan();
        return resources.filter((resource) => {
            const kind = getActivityAccessKind(resource);
            const allowedPlans = getAllowedPlansForResource(resource);
            if (kind === 'group_activity' && !cachedStatus?.capabilities?.canAccessGroupActivities) return false;
            return allowedPlans.includes(plan);
        });
    },

    async validateAppleTransaction({ productId, transactionId, originalTransactionId, signedTransactionInfo, idempotencyKey }) {
        const result = await callableClient.invokeWithAuth('validateAppleSubscriptionReceipt', {
            productId,
            transactionId,
            originalTransactionId,
            signedTransactionInfo,
            idempotencyKey
        });
        this.invalidateCache();
        return result;
    },

    async validateGooglePurchase({ purchaseToken, productId, idempotencyKey }) {
        const result = await callableClient.invokeWithAuth('validateGoogleSubscriptionPurchase', { purchaseToken, productId, idempotencyKey });
        this.invalidateCache();
        return result;
    },

    async syncRevenueCatCustomer(payload) {
        const result = await callableClient.invokeWithAuth('syncRevenueCatCustomer', payload || {});
        this.invalidateCache();
        return result;
    },

    async restoreSubscriptions(payload) {
        const result = await callableClient.invokeWithAuth('restoreSubscriptions', payload || {});
        this.invalidateCache();
        return result;
    }
};
