export const PLAN_RULES = {
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

export const getPlanRules = (plan = 'free') => PLAN_RULES[plan] || PLAN_RULES.free;

export const getAllowedPlansForResource = (resource = {}) => {
    const plans = Array.isArray(resource?.access?.plans)
        ? resource.access.plans.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean)
        : [];
    if (plans.length > 0) return plans;
    const category = String(resource?.access?.kind || resource?.category || '').toLowerCase();
    return category.includes('group') ? ['premium'] : ['premium'];
};

export const getActivityAccessKind = (resource = {}) => {
    const explicit = String(resource?.access?.kind || '').trim().toLowerCase();
    if (explicit === 'group_activity') return explicit;
    if (explicit === 'self_development') return explicit;
    const category = String(resource?.category || '').trim().toLowerCase();
    return category.includes('group') ? 'group_activity' : 'self_development';
};
