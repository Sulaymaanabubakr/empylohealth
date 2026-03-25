import { callableClient } from '../api/callableClient';
import { getActivityAccessKind, getAllowedPlansForResource } from './subscriptionConfig';

let cachedStatus = null;
let cacheTs = 0;
const STATUS_TTL_MS = 30 * 1000;

const normalizeGuard = (result = {}) => ({
    allowed: result.allowed !== false,
    reasonCode: result.reasonCode || '',
    message: result.message || '',
    plan: result.plan || cachedStatus?.entitlement?.plan || 'free',
    usage: result.usage || cachedStatus?.usage || null,
    upgradeCta: result.upgradeCta || 'upgrade',
    grantedMinutes: typeof result.grantedMinutes === 'number' ? result.grantedMinutes : null
});

const getCachedPlan = () => cachedStatus?.entitlement?.plan || 'free';

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

    async canCreateCircle({ type, circles = [] }) {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = status?.entitlement?.plan || 'free';
        if (plan === 'premium') return normalizeGuard({ allowed: true, plan, usage });
        const limits = { private: 3, public: 3 };
        const key = type === 'private' ? 'private' : 'public';
        const current = Array.isArray(circles) && circles.length > 0
            ? circles.filter((circle) => String(circle?.type || 'public') === key && String(circle?.status || 'active') === 'active').length
            : Number(usage?.circleCreates?.[key] || 0);
        if (current >= limits[key]) {
            return normalizeGuard({
                allowed: false,
                reasonCode: key === 'private' ? 'circle_private_limit_reached' : 'circle_public_limit_reached',
                message: key === 'private'
                    ? 'Free plan allows up to 3 private circles. Upgrade to Premium to create more.'
                    : 'Free plan allows up to 3 public circles. Upgrade to Premium to create more.',
                plan,
                usage
            });
        }
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canStartHuddle() {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = status?.entitlement?.plan || 'free';
        const limits = plan === 'premium'
            ? { dailyStarts: 3, dailyMinutes: 120, sessionMinutes: 40 }
            : { dailyStarts: 2, dailyMinutes: 20, sessionMinutes: 10 };
        const starts = Number(usage?.huddlesStarted || 0);
        const remainingMinutes = Number(usage?.huddleMinutesRemaining ?? (limits.dailyMinutes - Number(usage?.huddleMinutesReserved || 0)));
        if (starts >= limits.dailyStarts) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'huddle_daily_count_reached',
                message: 'You have reached your huddle limit for today.',
                plan,
                usage
            });
        }
        if (remainingMinutes <= 0) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'huddle_daily_minutes_reached',
                message: 'You have used all available huddle minutes for today.',
                plan,
                usage
            });
        }
        return normalizeGuard({
            allowed: true,
            plan,
            usage,
            grantedMinutes: Math.min(limits.sessionMinutes, remainingMinutes)
        });
    },

    async canScheduleHuddle() {
        const status = await this.getSubscriptionStatus();
        const plan = status?.entitlement?.plan || 'free';
        const usage = status?.usage || null;
        if (plan !== 'premium') {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'schedule_requires_premium',
                message: 'Scheduling huddles is available on Premium.',
                plan,
                usage
            });
        }
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canAccessActivity({ resource }) {
        const status = await this.getSubscriptionStatus();
        const usage = status?.usage || null;
        const plan = status?.entitlement?.plan || 'free';
        const gatingEnabled = status?.activityGatingEnabled === true;
        if (!gatingEnabled) return normalizeGuard({ allowed: true, plan, usage });
        const kind = getActivityAccessKind(resource);
        const allowedPlans = getAllowedPlansForResource(resource);
        if (kind === 'group_activity' && plan !== 'premium') {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'group_activity_requires_premium',
                message: 'Group activities are available on Premium.',
                plan,
                usage
            });
        }
        if (!allowedPlans.includes(plan)) {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'activity_requires_premium',
                message: 'This activity is available on Premium.',
                plan,
                usage
            });
        }
        return normalizeGuard({ allowed: true, plan, usage });
    },

    async canShareActivity({ resource }) {
        const access = await this.canAccessActivity({ resource });
        if (!access.allowed) return access;
        if (resource?.access?.shareRequiresPremium && getCachedPlan() !== 'premium') {
            return normalizeGuard({
                allowed: false,
                reasonCode: 'activity_share_requires_premium',
                message: 'Sharing activities is available on Premium.',
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
            if (kind === 'group_activity' && plan !== 'premium') return false;
            return allowedPlans.includes(plan);
        });
    },

    async validateAppleTransaction({ productId, transactionId, originalTransactionId, signedTransactionInfo }) {
        const result = await callableClient.invokeWithAuth('validateAppleSubscriptionReceipt', {
            productId,
            transactionId,
            originalTransactionId,
            signedTransactionInfo
        });
        this.invalidateCache();
        return result;
    },

    async validateGooglePurchase({ purchaseToken, productId }) {
        const result = await callableClient.invokeWithAuth('validateGoogleSubscriptionPurchase', { purchaseToken, productId });
        this.invalidateCache();
        return result;
    },

    async restoreSubscriptions(payload) {
        const result = await callableClient.invokeWithAuth('restoreSubscriptions', payload || {});
        this.invalidateCache();
        return result;
    }
};
