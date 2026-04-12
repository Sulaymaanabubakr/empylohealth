export const PLAN_RULES = {
    free: {
        id: 'free',
        label: 'Free',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: 2,
        huddleMinutesPerDay: 48,
        huddleMinutesPerSession: 10,
        activities: {
            allowGroup: false,
            allowShare: false,
            allowSchedule: false
        },
        aiCreditsPerMonth: 16
    },
    pro: {
        id: 'pro',
        label: 'Pro',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: 3,
        huddleMinutesPerDay: 240,
        huddleMinutesPerSession: 30,
        activities: {
            allowGroup: true,
            allowShare: true,
            allowSchedule: true
        },
        aiCreditsPerMonth: 160
    },
    premium: {
        id: 'premium',
        label: 'Premium',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: 5,
        huddleMinutesPerDay: 640,
        huddleMinutesPerSession: 60,
        activities: {
            allowGroup: true,
            allowShare: true,
            allowSchedule: true
        },
        aiCreditsPerMonth: 480
    },
    enterprise: {
        id: 'enterprise',
        label: 'Coach+',
        circleLimits: {
            private: null,
            public: null
        },
        huddlesPerDay: null,
        huddleMinutesPerDay: null,
        huddleMinutesPerSession: 90,
        activities: {
            allowGroup: true,
            allowShare: true,
            allowSchedule: true
        },
        aiCreditsPerMonth: null
    }
};

export const normalizePlanId = (plan = 'free') => {
    const value = String(plan || '').trim().toLowerCase();
    if (value === 'coach+' || value === 'coach_plus') return 'enterprise';
    if (value === 'pro') return 'pro';
    if (value === 'premium') return 'premium';
    if (value === 'enterprise') return 'enterprise';
    return 'free';
};

export const getPlanRules = (plan = 'free') => PLAN_RULES[normalizePlanId(plan)] || PLAN_RULES.free;

export const getAllowedPlansForResource = (resource = {}) => {
    const plans = Array.isArray(resource?.access?.plans)
        ? resource.access.plans.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
        : [];
    if (plans.length > 0) return plans.map((plan) => normalizePlanId(plan));
    const category = String(resource?.access?.kind || resource?.category || '').toLowerCase();
    return category.includes('group')
        ? ['pro', 'premium', 'enterprise']
        : ['free', 'pro', 'premium', 'enterprise'];
};

export const getActivityAccessKind = (resource = {}) => {
    const explicit = String(resource?.access?.kind || '').trim().toLowerCase();
    if (explicit === 'group_activity') return explicit;
    if (explicit === 'self_development') return explicit;
    const category = String(resource?.category || '').trim().toLowerCase();
    return category.includes('group') ? 'group_activity' : 'self_development';
};
