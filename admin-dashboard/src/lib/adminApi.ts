import { supabase, supabaseConfigError } from './supabase';

const invokeAdmin = async (endpoint: string, body: Record<string, unknown>) => {
    if (!supabase) {
        throw new Error(supabaseConfigError || 'Supabase is not configured for admin-dashboard.');
    }
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
        throw new Error('Missing admin session token.');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(payload?.error?.message || 'Admin request failed.');
    }
    return payload;
};

export const adminApi = {
    async bootstrapSession() {
        return invokeAdmin('admin-session-bootstrap', {});
    },

    async getBillingOverview() {
        return invokeAdmin('admin-billing', { action: 'getBillingOverview' });
    },

    async listOrganisations() {
        return invokeAdmin('admin-billing', { action: 'listOrganisations' });
    },

    async upsertOrganisation(payload: Record<string, unknown>) {
        return invokeAdmin('admin-billing', { action: 'upsertOrganisation', ...payload });
    },

    async assignOrganisationSeat(payload: Record<string, unknown>) {
        return invokeAdmin('admin-billing', { action: 'assignOrganisationSeat', ...payload });
    },

    async grantManualBoost(payload: Record<string, unknown>) {
        return invokeAdmin('admin-billing', { action: 'grantManualBoost', ...payload });
    },
};
