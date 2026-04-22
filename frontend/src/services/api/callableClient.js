import { supabase, supabaseFunctionUrl } from '../supabase/supabaseClient';

const tryRefreshSession = async () => {
    try {
        const { data } = await supabase.auth.refreshSession();
        return data.session || null;
    } catch {
        return null;
    }
};

const waitForSession = async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
        return data.session;
    }
    return tryRefreshSession();
};

const asCallableError = (status, payload, fallbackMessage) => {
    const message = payload?.error?.message || fallbackMessage || 'Function request failed.';
    const err = new Error(message);
    err.code = status ? `functions/${status}` : 'functions/internal';
    err.details = payload?.error?.details;
    return err;
};

const FUNCTION_MAP = {
    generateUploadSignature: { endpoint: 'media-signature', auth: true, map: (payload) => payload || {} },
    getPublicProfile: { endpoint: 'app-users', auth: true, map: (payload) => ({ action: 'getPublicProfile', ...payload }) },
    blockUser: { endpoint: 'app-users', auth: true, map: (payload) => ({ action: 'blockUser', ...payload }) },
    unblockUser: { endpoint: 'app-users', auth: true, map: (payload) => ({ action: 'unblockUser', ...payload }) },
    savePushToken: { endpoint: 'app-users', auth: true, map: (payload) => ({ action: 'savePushToken', ...payload }) },
    getExploreContent: { endpoint: 'app-content', auth: true, map: (payload) => ({ action: 'getExploreContent', ...payload }) },
    getAffirmations: { endpoint: 'app-content', auth: true, map: (payload) => ({ action: 'getAffirmations', ...payload }) },
    getKeyChallenges: { endpoint: 'app-content', auth: true, map: (payload) => ({ action: 'getKeyChallenges', ...payload }) },
    getRecommendedContent: { endpoint: 'app-content', auth: true, map: (payload) => ({ action: 'getRecommendedContent', ...payload }) },
    getDashboardData: { endpoint: 'app-content', auth: true, map: (payload) => ({ action: 'getDashboardData', ...payload }) },
    createCircle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'createCircle', ...payload }) },
    updateCircle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'updateCircle', ...payload }) },
    joinCircle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'joinCircle', ...payload }) },
    leaveCircle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'leaveCircle', ...payload }) },
    deleteCircle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'deleteCircle', ...payload }) },
    createCircleInvite: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'createCircleInvite', ...payload }) },
    createAppInvite: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'createAppInvite', ...payload }) },
    listUserInvitations: { endpoint: 'app-circles', auth: true, map: () => ({ action: 'listUserInvitations' }) },
    listCircleRequests: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'listCircleRequests', ...payload }) },
    listCircleReports: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'listCircleReports', ...payload }) },
    ensureCircleChat: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'ensureCircleChat', ...payload }) },
    resolveInviteToken: { endpoint: 'app-circles', auth: false, map: (payload) => ({ action: 'resolveInviteToken', ...payload }) },
    joinCircleWithInvite: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'joinCircleWithInvite', ...payload }) },
    resolveAppInvite: { endpoint: 'app-circles', auth: false, map: (payload) => ({ action: 'resolveAppInvite', ...payload }) },
    consumeAppInvite: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'consumeAppInvite', ...payload }) },
    manageMember: {
        endpoint: 'app-circles',
        auth: true,
        map: (payload) => {
            const { action: memberAction, ...rest } = payload || {};
            return { action: 'manageMember', ...rest, actionType: memberAction };
        }
    },
    handleJoinRequest: {
        endpoint: 'app-circles',
        auth: true,
        map: (payload) => {
            const { action: requestAction, ...rest } = payload || {};
            return { action: 'handleJoinRequest', ...rest, requestAction };
        }
    },
    resolveCircleReport: {
        endpoint: 'app-circles',
        auth: true,
        map: (payload) => {
            const { action: resolutionAction, ...rest } = payload || {};
            return { action: 'resolveCircleReport', ...rest, resolutionAction };
        }
    },
    submitReport: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'submitReport', ...payload }) },
    scheduleHuddle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'scheduleHuddle', ...payload }) },
    toggleScheduledHuddleReminder: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'toggleScheduledHuddleReminder', ...payload }) },
    deleteScheduledHuddle: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'deleteScheduledHuddle', ...payload }) },
    triggerDueScheduledHuddles: { endpoint: 'app-circles', auth: true, map: (payload) => ({ action: 'triggerDueScheduledHuddles', ...payload }) },
    getSubscriptionStatus: { endpoint: 'app-billing', auth: true, map: () => ({ action: 'getSubscriptionStatus' }) },
    getSubscriptionCatalog: { endpoint: 'app-billing', auth: false, map: () => ({ action: 'getSubscriptionCatalog' }) },
    getEnterpriseContactConfig: { endpoint: 'app-billing', auth: false, map: () => ({ action: 'getEnterpriseContactConfig' }) },
    validateAppleSubscriptionReceipt: { endpoint: 'app-billing', auth: true, map: (payload) => ({ action: 'validateAppleSubscriptionReceipt', ...payload }) },
    validateGoogleSubscriptionPurchase: { endpoint: 'app-billing', auth: true, map: (payload) => ({ action: 'validateGoogleSubscriptionPurchase', ...payload }) },
    restoreSubscriptions: { endpoint: 'app-billing', auth: true, map: (payload) => ({ action: 'restoreSubscriptions', ...payload }) },
    syncRevenueCatCustomer: { endpoint: 'app-billing', auth: true, map: (payload) => ({ action: 'syncRevenueCatCustomer', ...payload }) },
    validateBoostPurchase: { endpoint: 'app-billing', auth: true, map: (payload) => ({ action: 'validateBoostPurchase', ...payload }) },
    generateKeyChallengesForLatestAssessment: { endpoint: 'app-ai', auth: true, map: (payload) => ({ action: 'generateKeyChallengesForLatestAssessment', ...payload }) },
    askAiAboutChallenge: { endpoint: 'app-ai', auth: true, map: (payload) => ({ action: 'askAiAboutChallenge', ...payload }) },
    seedResources: { local: async () => ({ success: true }) },
};

const invokeMapped = async (functionName, payload, requireAuth) => {
    const mapped = FUNCTION_MAP[functionName];
    if (!mapped) {
        const token = requireAuth ? (await waitForSession())?.access_token : null;
        const response = await fetch(supabaseFunctionUrl(functionName), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload || {}),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw asCallableError(response.status, body, `Unable to call ${functionName}.`);
        return body?.result ?? body;
    }

    if (mapped.local) {
        return mapped.local(payload || {});
    }

    let session = requireAuth || mapped.auth ? await waitForSession() : null;
    if ((requireAuth || mapped.auth) && !session?.access_token) {
        throw new Error('Your session expired. Please sign in again.');
    }

    const requestBody = JSON.stringify(mapped.map ? mapped.map(payload || {}) : (payload || {}));
    const execute = async (accessToken) => {
        const response = await fetch(supabaseFunctionUrl(mapped.endpoint), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
            body: requestBody,
        });
        const body = await response.json().catch(() => ({}));
        return { response, body };
    };

    let { response, body } = await execute(session?.access_token || null);
    if (!response.ok && response.status === 401 && (requireAuth || mapped.auth)) {
        session = await tryRefreshSession();
        if (session?.access_token) {
            ({ response, body } = await execute(session.access_token));
        }
    }

    if (!response.ok) {
        throw asCallableError(response.status, body, `Unable to call ${functionName}.`);
    }

    return body?.result ?? body;
};

export const callableClient = {
    invokePublic(functionName, payload) {
        return invokeMapped(functionName, payload, false);
    },

    invokeWithAuth(functionName, payload) {
        return invokeMapped(functionName, payload, true);
    },
};
