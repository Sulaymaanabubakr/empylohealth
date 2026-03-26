export const PLAN_RULES = {
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

export const normalizePlanId = (plan = 'free') => {
    const value = String(plan || '').trim().toLowerCase();
    if (value === 'pro' || value === 'premium') return 'pro';
    return 'free';
};

export const getPlanRules = (plan = 'free') => PLAN_RULES[normalizePlanId(plan)] || PLAN_RULES.free;

export const getAllowedPlansForResource = (resource = {}) => {
    const plans = Array.isArray(resource?.access?.plans)
        ? resource.access.plans.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
        : [];
    if (plans.length > 0) return plans.map((plan) => normalizePlanId(plan));
    const category = String(resource?.access?.kind || resource?.category || '').toLowerCase();
    return category.includes('group') ? ['pro'] : ['pro'];
};

export const getActivityAccessKind = (resource = {}) => {
    const explicit = String(resource?.access?.kind || '').trim().toLowerCase();
    if (explicit === 'group_activity') return explicit;
    if (explicit === 'self_development') return explicit;
    const category = String(resource?.category || '').trim().toLowerCase();
    return category.includes('group') ? 'group_activity' : 'self_development';
};
