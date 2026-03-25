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
exports.toTimestampMs = exports.minutesBetween = exports.buildUsageSummary = exports.coerceUsageSnapshot = exports.createEmptyUsageSnapshot = exports.canAccessResourceForPlan = exports.isSharePremiumOnly = exports.getAllowedPlansForResource = exports.getActivityAccessKind = exports.getPlanRulesForEntitlement = exports.buildSubscriptionSummary = exports.getEffectivePlan = exports.normalizeStatus = exports.getDailyUsageRef = exports.getEntitlementRef = exports.getDailyUsageDocId = exports.getUsageDayKeyForTimezone = exports.getUserTimezone = exports.isValidTimezone = exports.SUBSCRIPTION_WARNING_WINDOW_MS = exports.SUBSCRIPTION_REASON_MESSAGES = exports.SUBSCRIPTION_COLLECTIONS = exports.PLAN_RULES = void 0;
const admin = __importStar(require("firebase-admin"));
exports.PLAN_RULES = {
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
exports.SUBSCRIPTION_COLLECTIONS = {
    entitlements: 'subscriptionEntitlements',
    dailyUsage: 'subscriptionUsageDaily'
};
exports.SUBSCRIPTION_REASON_MESSAGES = {
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
const getEffectivePlan = (entitlement) => {
    const plan = String(entitlement?.plan || entitlement?.planId || 'free').trim().toLowerCase();
    const status = (0, exports.normalizeStatus)(entitlement?.status);
    const expiresAtMs = toMillis(entitlement?.expiresAt);
    if (plan !== 'premium')
        return 'free';
    if (status !== 'active' && status !== 'grace_period')
        return 'free';
    if (expiresAtMs > 0 && expiresAtMs <= Date.now())
        return 'free';
    return 'premium';
};
exports.getEffectivePlan = getEffectivePlan;
const buildSubscriptionSummary = (entitlement) => {
    const effectivePlan = (0, exports.getEffectivePlan)(entitlement);
    const rules = exports.PLAN_RULES[effectivePlan];
    const status = effectivePlan === 'free' && String(entitlement?.plan || entitlement?.planId || '').trim().toLowerCase() === 'premium'
        ? 'expired'
        : (0, exports.normalizeStatus)(entitlement?.status || (effectivePlan === 'premium' ? 'active' : 'expired'));
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
    const normalized = plans.filter((value) => value === 'free' || value === 'premium');
    if (normalized.length > 0)
        return normalized;
    return (0, exports.getActivityAccessKind)(resource) === 'group_activity' ? ['premium'] : ['premium'];
};
exports.getAllowedPlansForResource = getAllowedPlansForResource;
const isSharePremiumOnly = (resource) => resource?.access?.shareRequiresPremium === true;
exports.isSharePremiumOnly = isSharePremiumOnly;
const canAccessResourceForPlan = (resource, plan) => {
    const kind = (0, exports.getActivityAccessKind)(resource);
    const allowedPlans = (0, exports.getAllowedPlansForResource)(resource);
    if (kind === 'group_activity' && plan !== 'premium') {
        return { allowed: false, reasonCode: 'group_activity_requires_premium' };
    }
    if (!allowedPlans.includes(plan)) {
        return { allowed: false, reasonCode: 'activity_requires_premium' };
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
exports.buildUsageSummary = buildUsageSummary;
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