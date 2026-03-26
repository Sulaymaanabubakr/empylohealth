"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTimestampMs = exports.minutesBetween = exports.isCircleHuddlesEnabled = exports.getCircleMemberCap = exports.getCircleBillingTier = exports.buildUsageSummary = exports.coerceUsageSnapshot = exports.createEmptyUsageSnapshot = exports.canAccessResourceForPlan = exports.isSharePremiumOnly = exports.getAllowedPlansForResource = exports.getActivityAccessKind = exports.getPlanRulesForEntitlement = exports.buildSubscriptionSummary = exports.getEffectivePlan = exports.normalizePlanId = exports.normalizeStatus = exports.getDailyUsageRef = exports.getEntitlementRef = exports.getDailyUsageDocId = exports.getUsageDayKeyForTimezone = exports.getUserTimezone = exports.isValidTimezone = exports.SUBSCRIPTION_WARNING_WINDOW_MS = exports.SUBSCRIPTION_REASON_MESSAGES = exports.SUBSCRIPTION_COLLECTIONS = exports.PLAN_RULES = void 0;
const admin = __importStar(require("firebase-admin"));
exports.PLAN_RULES = {
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
exports.SUBSCRIPTION_COLLECTIONS = {
    entitlements: 'subscriptionEntitlements',
    dailyUsage: 'subscriptionUsageDaily'
};
exports.SUBSCRIPTION_REASON_MESSAGES = {
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
exports.SUBSCRIPTION_WARNING_WINDOW_MS = 2 * 60 * 1000;
const TIMESTAMP_TYPES = ['_seconds', 'seconds'];
const toMillis = (value) => {
    if (!value)
        return 0;
    if (typeof value?.toMillis === 'function')
        return value.toMillis();
    if (typeof value?.toDate === 'function')
        return value.toDate().getTime();
    if (value instanceof Date)
        return value.getTime();
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
const formatDayKey = (date, timeZone) => {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return formatter.format(date);
};
const isValidTimezone = (timeZone) => {
    if (!timeZone || typeof timeZone !== 'string')
        return false;
    try {
        Intl.DateTimeFormat('en-US', { timeZone }).format(new Date());
        return true;
    }
    catch {
        return false;
    }
};
exports.isValidTimezone = isValidTimezone;
const getUserTimezone = (userData) => {
    const timeZone = String(userData?.timezone || '').trim();
    return (0, exports.isValidTimezone)(timeZone) ? timeZone : 'UTC';
};
exports.getUserTimezone = getUserTimezone;
const getUsageDayKeyForTimezone = (timeZone, now = new Date()) => formatDayKey(now, timeZone);
exports.getUsageDayKeyForTimezone = getUsageDayKeyForTimezone;
const getDailyUsageDocId = (uid, dayKey) => `${uid}_${dayKey}`;
exports.getDailyUsageDocId = getDailyUsageDocId;
const getEntitlementRef = (db, uid) => db.collection(exports.SUBSCRIPTION_COLLECTIONS.entitlements).doc(uid);
exports.getEntitlementRef = getEntitlementRef;
const getDailyUsageRef = (db, uid, dayKey) => db.collection(exports.SUBSCRIPTION_COLLECTIONS.dailyUsage).doc((0, exports.getDailyUsageDocId)(uid, dayKey));
exports.getDailyUsageRef = getDailyUsageRef;
const normalizeStatus = (status) => {
    const value = String(status || '').trim().toLowerCase();
    if (value === 'active' || value === 'grace_period' || value === 'canceled')
        return value;
    return 'expired';
};
exports.normalizeStatus = normalizeStatus;
const normalizePlanId = (plan) => {
    const value = String(plan || '').trim().toLowerCase();
    if (value === 'pro' || value === 'premium')
        return 'pro';
    return 'free';
};
exports.normalizePlanId = normalizePlanId;
const getEffectivePlan = (entitlement) => {
    const plan = (0, exports.normalizePlanId)(entitlement?.plan || entitlement?.planId || 'free');
    const status = (0, exports.normalizeStatus)(entitlement?.status);
    const expiresAtMs = toMillis(entitlement?.expiresAt);
    if (plan !== 'pro')
        return 'free';
    if (status !== 'active' && status !== 'grace_period')
        return 'free';
    if (expiresAtMs > 0 && expiresAtMs <= Date.now())
        return 'free';
    return 'pro';
};
exports.getEffectivePlan = getEffectivePlan;
const buildSubscriptionSummary = (entitlement) => {
    const effectivePlan = (0, exports.getEffectivePlan)(entitlement);
    const rules = exports.PLAN_RULES[effectivePlan];
    const rawPlan = (0, exports.normalizePlanId)(entitlement?.plan || entitlement?.planId || 'free');
    const status = effectivePlan === 'free' && rawPlan === 'pro'
        ? 'expired'
        : (0, exports.normalizeStatus)(entitlement?.status || (effectivePlan === 'pro' ? 'active' : 'expired'));
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
exports.buildSubscriptionSummary = buildSubscriptionSummary;
const getPlanRulesForEntitlement = (entitlement) => exports.PLAN_RULES[(0, exports.getEffectivePlan)(entitlement)];
exports.getPlanRulesForEntitlement = getPlanRulesForEntitlement;
const getActivityAccessKind = (resource) => {
    const explicit = String(resource?.access?.kind || '').trim().toLowerCase();
    if (explicit === 'group_activity')
        return 'group_activity';
    if (explicit === 'self_development')
        return 'self_development';
    const category = String(resource?.category || '').trim().toLowerCase();
    return category.includes('group') ? 'group_activity' : 'self_development';
};
exports.getActivityAccessKind = getActivityAccessKind;
const getAllowedPlansForResource = (resource) => {
    const plans = Array.isArray(resource?.access?.plans)
        ? resource.access.plans.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
        : [];
    const normalized = plans
        .map((value) => (0, exports.normalizePlanId)(value))
        .filter((value) => value === 'free' || value === 'pro');
    if (normalized.length > 0)
        return normalized;
    return (0, exports.getActivityAccessKind)(resource) === 'group_activity' ? ['pro'] : ['pro'];
};
exports.getAllowedPlansForResource = getAllowedPlansForResource;
const isSharePremiumOnly = (resource) => resource?.access?.shareRequiresPremium === true;
exports.isSharePremiumOnly = isSharePremiumOnly;
const canAccessResourceForPlan = (resource, plan) => {
    const kind = (0, exports.getActivityAccessKind)(resource);
    const allowedPlans = (0, exports.getAllowedPlansForResource)(resource);
    if (kind === 'group_activity' && plan !== 'pro') {
        return { allowed: false, reasonCode: 'group_activity_requires_pro' };
    }
    if (!allowedPlans.includes(plan)) {
        return { allowed: false, reasonCode: 'activity_requires_pro' };
    }
    return { allowed: true, reasonCode: '' };
};
exports.canAccessResourceForPlan = canAccessResourceForPlan;
const createEmptyUsageSnapshot = (uid, dayKey, timeZone) => ({
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
exports.createEmptyUsageSnapshot = createEmptyUsageSnapshot;
const coerceUsageSnapshot = (uid, usage, dayKey, timeZone) => {
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
exports.coerceUsageSnapshot = coerceUsageSnapshot;
const buildUsageSummary = (usage, planRules) => {
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
exports.buildUsageSummary = buildUsageSummary;
const getCircleBillingTier = (circle) => {
    const value = String(circle?.billingTier || '').trim().toLowerCase();
    return value === 'pro' ? 'pro' : 'free';
};
exports.getCircleBillingTier = getCircleBillingTier;
const getCircleMemberCap = (circle) => {
    const explicit = Number(circle?.memberCap);
    if (Number.isFinite(explicit) && explicit > 0)
        return explicit;
    return (0, exports.getCircleBillingTier)(circle) === 'pro' ? 12 : 6;
};
exports.getCircleMemberCap = getCircleMemberCap;
const isCircleHuddlesEnabled = (circle) => {
    if (typeof circle?.huddlesEnabled === 'boolean')
        return circle.huddlesEnabled;
    return (0, exports.getCircleBillingTier)(circle) === 'pro';
};
exports.isCircleHuddlesEnabled = isCircleHuddlesEnabled;
const minutesBetween = (fromValue, toValue) => {
    const fromMs = toMillis(fromValue);
    const toMs = toMillis(toValue);
    if (fromMs <= 0 || toMs <= 0 || toMs <= fromMs)
        return 0;
    return Math.max(0, Math.ceil((toMs - fromMs) / 60000));
};
exports.minutesBetween = minutesBetween;
exports.toTimestampMs = toMillis;
//# sourceMappingURL=subscription.js.map