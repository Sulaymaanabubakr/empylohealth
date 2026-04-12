import { supabase, supabaseFunctionUrl } from '../supabase/supabaseClient';

const invoke = async (functionName, payload = {}, { requireAuth = false } = {}) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (requireAuth) {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
            throw new Error('Authentication is required.');
        }
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(supabaseFunctionUrl(functionName), {
        method: 'POST',
        headers,
        body: JSON.stringify(payload || {}),
    });

    const text = await response.text();
    const json = text ? JSON.parse(text) : {};
    if (!response.ok) {
        const error = new Error(json?.error?.message || `${functionName} failed.`);
        error.status = response.status;
        error.details = json?.error?.details;
        throw error;
    }
    return json;
};

export const authApiClient = {
    invokePublic(functionName, payload) {
        return invoke(functionName, payload, { requireAuth: false });
    },
    invokeWithAuth(functionName, payload) {
        return invoke(functionName, payload, { requireAuth: true });
    },
};
