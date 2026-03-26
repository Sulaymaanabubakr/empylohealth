import * as admin from 'firebase-admin';

export type PlanId = 'free' | 'pro';
export type SubscriptionStatus = 'active' | 'expired' | 'grace_period' | 'canceled';
export type PlatformSource = 'ios' | 'android' | 'manual';
export type ActivityAccessKind = 'self_development' | 'group_activity';
export type CircleBillingTier = 'free' | 'pro';
export type HuddleUsageKind = 'personal' | 'circle';

export type PlanRules = {
    id: PlanId;
    label: string;
    circleLimits: {
        private: number | null;
        public: number | null;
    };
    huddlesPerDay: number | null;
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
            private: null,
            public: null
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
    pro: {
        id: 'pro',
        label: 'Pro',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: null,
        huddleMinutesPerDay: 120,
        huddleMinutesPerSession: 120,
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
    free_circle_full: 'This Free Circle is full.',
    pro_circle_full: 'This Pro Circle is full.',
    free_users_cannot_join_pro_circle: 'Upgrade to Pro to join this Pro Circle.',
    free_users_cannot_access_pro_circle_chat: 'Upgrade to Pro to access chat in this Pro Circle.',
    free_users_cannot_start_circle_huddle: 'Circle huddles are available only in Pro Circles for Pro members.',
    free_users_cannot_join_circle_huddle: 'Upgrade to Pro to join this huddle.',
    pro_circle_requires_pro_membership: 'Only Pro members can be in a Pro Circle.',
    personal_huddle_daily_count_reached: 'You have reached your personal huddle limit for today.',
    personal_huddle_daily_minutes_reached: 'You have used all available personal huddle minutes for today.',
    personal_huddle_duration_grant_unavailable: 'There are not enough personal huddle minutes remaining for a new session today.',
    pro_huddle_daily_minutes_reached: 'You have used all available Pro huddle minutes for today.',
    pro_huddle_duration_grant_unavailable: 'There are not enough Pro huddle minutes remaining for a new session today.',
    schedule_requires_pro: 'Scheduling huddles is available on Pro.',
    group_activity_requires_pro: 'Group activities are available on Pro.',
    activity_requires_pro: 'This activity is available on Pro.',
    activity_share_requires_pro: 'Sharing activities is available on Pro.',
    active_huddle_conflict: 'You already have an active huddle in progress.'
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

export const normalizePlanId = (plan: any): PlanId => {
    const value = String(plan || '').trim().toLowerCase();
    if (value === 'pro' || value === 'premium') return 'pro';
    return 'free';
};

export const getEffectivePlan = (entitlement: any): PlanId => {
    const plan = normalizePlanId(entitlement?.plan || entitlement?.planId || 'free');
    const status = normalizeStatus(entitlement?.status);
    const expiresAtMs = toMillis(entitlement?.expiresAt);
    if (plan !== 'pro') return 'free';
    if (status !== 'active' && status !== 'grace_period') return 'free';
    if (expiresAtMs > 0 && expiresAtMs <= Date.now()) return 'free';
    return 'pro';
};

export const buildSubscriptionSummary = (entitlement: any) => {
    const effectivePlan = getEffectivePlan(entitlement);
    const rules = PLAN_RULES[effectivePlan];
    const rawPlan = normalizePlanId(entitlement?.plan || entitlement?.planId || 'free');
    const status = effectivePlan === 'free' && rawPlan === 'pro'
        ? 'expired'
        : normalizeStatus(entitlement?.status || (effectivePlan === 'pro' ? 'active' : 'expired'));
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
    const normalized = plans
        .map((value: string) => normalizePlanId(value))
        .filter((value: string): value is PlanId => value === 'free' || value === 'pro');
    if (normalized.length > 0) return normalized;
    return getActivityAccessKind(resource) === 'group_activity' ? ['pro'] : ['pro'];
};

export const isSharePremiumOnly = (resource: any) => resource?.access?.shareRequiresPremium === true;

export const canAccessResourceForPlan = (resource: any, plan: PlanId) => {
    const kind = getActivityAccessKind(resource);
    const allowedPlans = getAllowedPlansForResource(resource);
    if (kind === 'group_activity' && plan !== 'pro') {
        return { allowed: false, reasonCode: 'group_activity_requires_pro' };
    }
    if (!allowedPlans.includes(plan)) {
        return { allowed: false, reasonCode: 'activity_requires_pro' };
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
    personalHuddlesStarted: 0,
    personalHuddleMinutesReserved: 0,
    personalHuddleMinutesConsumed: 0,
    circleHuddlesStarted: 0,
    circleHuddleMinutesReserved: 0,
    circleHuddleMinutesConsumed: 0,
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
        personalHuddlesStarted: Number(base.personalHuddlesStarted || 0),
        personalHuddleMinutesReserved: Number(base.personalHuddleMinutesReserved || 0),
        personalHuddleMinutesConsumed: Number(base.personalHuddleMinutesConsumed || 0),
        circleHuddlesStarted: Number(base.circleHuddlesStarted || 0),
        circleHuddleMinutesReserved: Number(base.circleHuddleMinutesReserved || 0),
        circleHuddleMinutesConsumed: Number(base.circleHuddleMinutesConsumed || 0),
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
    const personalHuddlesStarted = Number(usage?.personalHuddlesStarted || 0);
    const personalHuddleMinutesConsumed = Number(usage?.personalHuddleMinutesConsumed || 0);
    const personalHuddleMinutesReserved = Number(usage?.personalHuddleMinutesReserved || 0);
    const circleHuddlesStarted = Number(usage?.circleHuddlesStarted || 0);
    const circleHuddleMinutesConsumed = Number(usage?.circleHuddleMinutesConsumed || 0);
    const circleHuddleMinutesReserved = Number(usage?.circleHuddleMinutesReserved || 0);
    return {
        serverDay: usage?.serverDay || null,
        timezoneBasis: usage?.timezoneBasis || 'UTC',
        huddlesStarted,
        huddlesRemaining: planRules.huddlesPerDay == null ? null : Math.max(0, planRules.huddlesPerDay - huddlesStarted),
        huddleMinutesConsumed,
        huddleMinutesReserved,
        huddleMinutesRemaining: Math.max(0, planRules.huddleMinutesPerDay - huddleMinutesReserved),
        personalHuddlesStarted,
        personalHuddlesRemaining: Math.max(0, 2 - personalHuddlesStarted),
        personalHuddleMinutesConsumed,
        personalHuddleMinutesReserved,
        personalHuddleMinutesRemaining: Math.max(0, 20 - personalHuddleMinutesReserved),
        circleHuddlesStarted,
        circleHuddleMinutesConsumed,
        circleHuddleMinutesReserved,
        circleHuddleMinutesRemaining: Math.max(0, 120 - circleHuddleMinutesReserved),
        circleCreates: {
            public: Number(usage?.circleCreates?.public || 0),
            private: Number(usage?.circleCreates?.private || 0)
        }
    };
};

export const getCircleBillingTier = (circle: any): CircleBillingTier => {
    const value = String(circle?.billingTier || '').trim().toLowerCase();
    return value === 'pro' ? 'pro' : 'free';
};

export const getCircleMemberCap = (circle: any) => {
    const explicit = Number(circle?.memberCap);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    return getCircleBillingTier(circle) === 'pro' ? 12 : 6;
};

export const isCircleHuddlesEnabled = (circle: any) => {
    if (typeof circle?.huddlesEnabled === 'boolean') return circle.huddlesEnabled;
    return getCircleBillingTier(circle) === 'pro';
};

export const minutesBetween = (fromValue: any, toValue: any) => {
    const fromMs = toMillis(fromValue);
    const toMs = toMillis(toValue);
    if (fromMs <= 0 || toMs <= 0 || toMs <= fromMs) return 0;
    return Math.max(0, Math.ceil((toMs - fromMs) / 60000));
};

export const toTimestampMs = toMillis;
