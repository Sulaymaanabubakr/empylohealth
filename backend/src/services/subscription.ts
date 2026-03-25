import * as admin from 'firebase-admin';

export type PlanId = 'free' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'grace_period' | 'canceled';
export type PlatformSource = 'ios' | 'android' | 'manual';
export type ActivityAccessKind = 'self_development' | 'group_activity';

export type PlanRules = {
    id: PlanId;
    label: string;
    circleLimits: {
        private: number | null;
        public: number | null;
    };
    huddlesPerDay: number;
    huddleMinutesPerDay: number;
    huddleMinutesPerSession: number;
    activities: {
        allowGroup: boolean;
        allowShare: boolean;
        allowSchedule: boolean;
    };
};

export const PLAN_RULES: Record<PlanId, PlanRules> = {
    free: {
        id: 'free',
        label: 'Free',
        circleLimits: {
            private: 3,
            public: 3
        },
        huddlesPerDay: 2,
        huddleMinutesPerDay: 20,
        huddleMinutesPerSession: 10,
        activities: {
            allowGroup: false,
            allowShare: false,
            allowSchedule: false
        }
    },
    premium: {
        id: 'premium',
        label: 'Premium',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: 3,
        huddleMinutesPerDay: 120,
        huddleMinutesPerSession: 40,
        activities: {
            allowGroup: true,
            allowShare: true,
            allowSchedule: true
        }
    }
};

export const SUBSCRIPTION_COLLECTIONS = {
    entitlements: 'subscriptionEntitlements',
    dailyUsage: 'subscriptionUsageDaily'
} as const;

export const SUBSCRIPTION_REASON_MESSAGES: Record<string, string> = {
    circle_private_limit_reached: 'Free plan allows up to 3 private circles. Upgrade to Premium to create more.',
    circle_public_limit_reached: 'Free plan allows up to 3 public circles. Upgrade to Premium to create more.',
    huddle_daily_count_reached: 'You have reached your huddle limit for today.',
    huddle_daily_minutes_reached: 'You have used all available huddle minutes for today.',
    huddle_duration_grant_unavailable: 'There are not enough huddle minutes remaining for a new session today.',
    group_activity_requires_premium: 'Group activities are available on Premium.',
    activity_requires_premium: 'This activity is available on Premium.',
    activity_share_requires_premium: 'Sharing activities is available on Premium.',
    schedule_requires_premium: 'Scheduling huddles is available on Premium.'
};

export const SUBSCRIPTION_WARNING_WINDOW_MS = 2 * 60 * 1000;

const TIMESTAMP_TYPES = ['_seconds', 'seconds'];

const toMillis = (value: any) => {
    if (!value) return 0;
    if (typeof value?.toMillis === 'function') return value.toMillis();
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    for (const key of TIMESTAMP_TYPES) {
        if (typeof value?.[key] === 'number') {
            const seconds = Number(value[key] || 0);
            const nanos = Number(value?._nanoseconds || value?.nanoseconds || 0);
            return (seconds * 1000) + Math.floor(nanos / 1e6);
        }
    }
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatDayKey = (date: Date, timeZone: string) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
};

export const isValidTimezone = (timeZone?: string | null) => {
    if (!timeZone || typeof timeZone !== 'string') return false;
    try {
        Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
        return true;
    } catch {
        return false;
    }
};

export const getUserTimezone = (userData: any) => {
    const timeZone = String(userData?.timezone || '').trim();
    return isValidTimezone(timeZone) ? timeZone : 'UTC';
};

export const getUsageDayKeyForTimezone = (timeZone: string, now = new Date()) => formatDayKey(now, timeZone);

export const getDailyUsageDocId = (uid: string, dayKey: string) => `${uid}_${dayKey}`;

export const getEntitlementRef = (db: admin.firestore.Firestore, uid: string) =>
    db.collection(SUBSCRIPTION_COLLECTIONS.entitlements).doc(uid);

export const getDailyUsageRef = (db: admin.firestore.Firestore, uid: string, dayKey: string) =>
    db.collection(SUBSCRIPTION_COLLECTIONS.dailyUsage).doc(getDailyUsageDocId(uid, dayKey));

export const normalizeStatus = (status: any): SubscriptionStatus => {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'active' || value === 'grace_period' || value === 'canceled') return value as SubscriptionStatus;
    return 'expired';
};

export const getEffectivePlan = (entitlement: any): PlanId => {
    const plan = String(entitlement?.plan || entitlement?.planId || 'free').trim().toLowerCase();
    const status = normalizeStatus(entitlement?.status);
    const expiresAtMs = toMillis(entitlement?.expiresAt);
    if (plan !== 'premium') return 'free';
    if (status !== 'active' && status !== 'grace_period') return 'free';
    if (expiresAtMs > 0 && expiresAtMs <= Date.now()) return 'free';
    return 'premium';
};

export const buildSubscriptionSummary = (entitlement: any) => {
    const effectivePlan = getEffectivePlan(entitlement);
    const rules = PLAN_RULES[effectivePlan];
    const status = effectivePlan === 'free' && String(entitlement?.plan || entitlement?.planId || '').trim().toLowerCase() === 'premium'
        ? 'expired'
        : normalizeStatus(entitlement?.status || (effectivePlan === 'premium' ? 'active' : 'expired'));
    return {
        plan: effectivePlan,
        planId: effectivePlan,
        label: rules.label,
        status,
        platformSource: entitlement?.platformSource || null,
        productId: entitlement?.productId || null,
        originalTransactionId: entitlement?.originalTransactionId || null,
        expiresAt: entitlement?.expiresAt || null,
        startsAt: entitlement?.startsAt || null,
        lastValidatedAt: entitlement?.lastValidatedAt || null,
        renewalState: entitlement?.renewalState || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
};

export const getPlanRulesForEntitlement = (entitlement: any) => PLAN_RULES[getEffectivePlan(entitlement)];

export const getActivityAccessKind = (resource: any): ActivityAccessKind => {
    const explicit = String(resource?.access?.kind || '').trim().toLowerCase();
    if (explicit === 'group_activity') return 'group_activity';
    if (explicit === 'self_development') return 'self_development';
    const category = String(resource?.category || '').trim().toLowerCase();
    return category.includes('group') ? 'group_activity' : 'self_development';
};

export const getAllowedPlansForResource = (resource: any): PlanId[] => {
    const plans = Array.isArray(resource?.access?.plans)
        ? resource.access.plans.map((value: any) => String(value || '').trim().toLowerCase()).filter(Boolean)
        : [];
    const normalized = plans.filter((value: string): value is PlanId => value === 'free' || value === 'premium');
    if (normalized.length > 0) return normalized;
    return getActivityAccessKind(resource) === 'group_activity' ? ['premium'] : ['premium'];
};

export const isSharePremiumOnly = (resource: any) => resource?.access?.shareRequiresPremium === true;

export const canAccessResourceForPlan = (resource: any, plan: PlanId) => {
    const kind = getActivityAccessKind(resource);
    const allowedPlans = getAllowedPlansForResource(resource);
    if (kind === 'group_activity' && plan !== 'premium') {
        return { allowed: false, reasonCode: 'group_activity_requires_premium' };
    }
    if (!allowedPlans.includes(plan)) {
        return { allowed: false, reasonCode: 'activity_requires_premium' };
    }
    return { allowed: true, reasonCode: '' };
};

export const createEmptyUsageSnapshot = (uid: string, dayKey: string, timeZone: string) => ({
    uid,
    serverDay: dayKey,
    timezoneBasis: timeZone,
    huddlesStarted: 0,
    huddleMinutesReserved: 0,
    huddleMinutesConsumed: 0,
    circleCreates: {
        public: 0,
        private: 0
    },
    activeReservations: {},
    finalizedHuddleIds: [],
    lastEventAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
});

export const coerceUsageSnapshot = (uid: string, usage: any, dayKey: string, timeZone: string) => {
    const base = usage || {};
    return {
        uid,
        serverDay: String(base.serverDay || dayKey),
        timezoneBasis: String(base.timezoneBasis || timeZone),
        huddlesStarted: Number(base.huddlesStarted || 0),
        huddleMinutesReserved: Number(base.huddleMinutesReserved || 0),
        huddleMinutesConsumed: Number(base.huddleMinutesConsumed || 0),
        circleCreates: {
            public: Number(base?.circleCreates?.public || 0),
            private: Number(base?.circleCreates?.private || 0)
        },
        activeReservations: (base.activeReservations && typeof base.activeReservations === 'object') ? base.activeReservations : {},
        finalizedHuddleIds: Array.isArray(base.finalizedHuddleIds) ? base.finalizedHuddleIds : []
    };
};

export const buildUsageSummary = (usage: any, planRules: PlanRules) => {
    const huddlesStarted = Number(usage?.huddlesStarted || 0);
    const huddleMinutesConsumed = Number(usage?.huddleMinutesConsumed || 0);
    const huddleMinutesReserved = Number(usage?.huddleMinutesReserved || 0);
    return {
        serverDay: usage?.serverDay || null,
        timezoneBasis: usage?.timezoneBasis || 'UTC',
        huddlesStarted,
        huddlesRemaining: Math.max(0, planRules.huddlesPerDay - huddlesStarted),
        huddleMinutesConsumed,
        huddleMinutesReserved,
        huddleMinutesRemaining: Math.max(0, planRules.huddleMinutesPerDay - huddleMinutesReserved),
        circleCreates: {
            public: Number(usage?.circleCreates?.public || 0),
            private: Number(usage?.circleCreates?.private || 0)
        }
    };
};

export const minutesBetween = (fromValue: any, toValue: any) => {
    const fromMs = toMillis(fromValue);
    const toMs = toMillis(toValue);
    if (fromMs <= 0 || toMs <= 0 || toMs <= fromMs) return 0;
    return Math.max(0, Math.ceil((toMs - fromMs) / 60000));
};

export const toTimestampMs = toMillis;
