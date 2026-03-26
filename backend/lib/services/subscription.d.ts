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
export declare const PLAN_RULES: Record<PlanId, PlanRules>;
export declare const SUBSCRIPTION_COLLECTIONS: {
    readonly entitlements: "subscriptionEntitlements";
    readonly dailyUsage: "subscriptionUsageDaily";
};
export declare const SUBSCRIPTION_REASON_MESSAGES: Record<string, string>;
export declare const SUBSCRIPTION_WARNING_WINDOW_MS: number;
export declare const isValidTimezone: (timeZone?: string | null) => boolean;
export declare const getUserTimezone: (userData: any) => string;
export declare const getUsageDayKeyForTimezone: (timeZone: string, now?: Date) => string;
export declare const getDailyUsageDocId: (uid: string, dayKey: string) => string;
export declare const getEntitlementRef: (db: admin.firestore.Firestore, uid: string) => admin.firestore.DocumentReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export declare const getDailyUsageRef: (db: admin.firestore.Firestore, uid: string, dayKey: string) => admin.firestore.DocumentReference<admin.firestore.DocumentData, admin.firestore.DocumentData>;
export declare const normalizeStatus: (status: any) => SubscriptionStatus;
export declare const normalizePlanId: (plan: any) => PlanId;
export declare const getEffectivePlan: (entitlement: any) => PlanId;
export declare const buildSubscriptionSummary: (entitlement: any) => {
    plan: PlanId;
    planId: PlanId;
    label: string;
    status: SubscriptionStatus;
    platformSource: any;
    productId: any;
    originalTransactionId: any;
    expiresAt: any;
    startsAt: any;
    lastValidatedAt: any;
    renewalState: any;
    updatedAt: admin.firestore.FieldValue;
};
export declare const getPlanRulesForEntitlement: (entitlement: any) => PlanRules;
export declare const getActivityAccessKind: (resource: any) => ActivityAccessKind;
export declare const getAllowedPlansForResource: (resource: any) => PlanId[];
export declare const isSharePremiumOnly: (resource: any) => boolean;
export declare const canAccessResourceForPlan: (resource: any, plan: PlanId) => {
    allowed: boolean;
    reasonCode: string;
};
export declare const createEmptyUsageSnapshot: (uid: string, dayKey: string, timeZone: string) => {
    uid: string;
    serverDay: string;
    timezoneBasis: string;
    huddlesStarted: number;
    huddleMinutesReserved: number;
    huddleMinutesConsumed: number;
    personalHuddlesStarted: number;
    personalHuddleMinutesReserved: number;
    personalHuddleMinutesConsumed: number;
    circleHuddlesStarted: number;
    circleHuddleMinutesReserved: number;
    circleHuddleMinutesConsumed: number;
    circleCreates: {
        public: number;
        private: number;
    };
    activeReservations: {};
    finalizedHuddleIds: never[];
    lastEventAt: admin.firestore.FieldValue;
    createdAt: admin.firestore.FieldValue;
    updatedAt: admin.firestore.FieldValue;
};
export declare const coerceUsageSnapshot: (uid: string, usage: any, dayKey: string, timeZone: string) => {
    uid: string;
    serverDay: string;
    timezoneBasis: string;
    huddlesStarted: number;
    huddleMinutesReserved: number;
    huddleMinutesConsumed: number;
    personalHuddlesStarted: number;
    personalHuddleMinutesReserved: number;
    personalHuddleMinutesConsumed: number;
    circleHuddlesStarted: number;
    circleHuddleMinutesReserved: number;
    circleHuddleMinutesConsumed: number;
    circleCreates: {
        public: number;
        private: number;
    };
    activeReservations: any;
    finalizedHuddleIds: any;
};
export declare const buildUsageSummary: (usage: any, planRules: PlanRules) => {
    serverDay: any;
    timezoneBasis: any;
    huddlesStarted: number;
    huddlesRemaining: number | null;
    huddleMinutesConsumed: number;
    huddleMinutesReserved: number;
    huddleMinutesRemaining: number;
    personalHuddlesStarted: number;
    personalHuddlesRemaining: number;
    personalHuddleMinutesConsumed: number;
    personalHuddleMinutesReserved: number;
    personalHuddleMinutesRemaining: number;
    circleHuddlesStarted: number;
    circleHuddleMinutesConsumed: number;
    circleHuddleMinutesReserved: number;
    circleHuddleMinutesRemaining: number;
    circleCreates: {
        public: number;
        private: number;
    };
};
export declare const getCircleBillingTier: (circle: any) => CircleBillingTier;
export declare const getCircleMemberCap: (circle: any) => number;
export declare const isCircleHuddlesEnabled: (circle: any) => any;
export declare const minutesBetween: (fromValue: any, toValue: any) => number;
export declare const toTimestampMs: (value: any) => any;
//# sourceMappingURL=subscription.d.ts.map