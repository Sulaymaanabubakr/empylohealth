import { supabase } from '../supabase/supabaseClient';
import { circleRepository } from '../repositories/CircleRepository';
import { callableClient } from './callableClient';

const dueScheduleKickState = new Map();
const DUE_SCHEDULE_KICK_THROTTLE_MS = 20000;

const randomChannel = (prefix, id) => `${prefix}-${id}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeCircle = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        chatId: row.chat_id || null,
        name: row.name || '',
        description: row.description || '',
        category: row.category || 'General',
        type: row.type || 'public',
        visibility: row.visibility || 'visible',
        image: row.image || '',
        location: row.location || '',
        tags: Array.isArray(row.tags) ? row.tags : [],
        status: row.status || 'active',
        billingTier: row.billing_tier || 'free',
        adminId: row.admin_id || null,
        creatorId: row.creator_id || null,
        members: Array.isArray(row.members) ? row.members : [],
        activeHuddle: row.active_huddle || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
};

const normalizeScheduledEvent = (row) => ({
    id: row.id,
    circleId: row.circle_id,
    chatId: row.chat_id || null,
    title: row.title || 'Scheduled huddle',
    scheduledAt: row.scheduled_at,
    reminderEnabled: row.reminder_enabled !== false,
    metadata: row.metadata || {},
    createdBy: row.created_by || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    status: 'scheduled',
});

const loadCircles = async (uid = null) => {
    // Step 1: Get membership IDs and public circles in parallel
    const publicQuery = supabase
        .from('circles')
        .select('*')
        .eq('status', 'active')
        .eq('type', 'public')
        .order('created_at', { ascending: false });

    const ownMemberships = uid
        ? supabase.from('circle_members').select('circle_id').eq('user_id', uid).eq('status', 'active')
        : Promise.resolve({ data: [] });

    const [{ data: publicCircles, error: publicError }, { data: memberships, error: membershipError }] = await Promise.all([publicQuery, ownMemberships]);
    if (publicError) throw publicError;
    if (membershipError) throw membershipError;

    // Step 2: Fetch member-only circles (non-public ones the user belongs to)
    const publicIds = new Set((publicCircles || []).map((c) => c.id));
    const memberCircleIds = (memberships || []).map((item) => item.circle_id).filter((id) => id && !publicIds.has(id));

    let extraCircles = [];
    if (memberCircleIds.length) {
        const { data, error } = await supabase
            .from('circles')
            .select('*')
            .in('id', memberCircleIds)
            .neq('status', 'deleted');
        if (error) throw error;
        extraCircles = data || [];
    }

    const byId = new Map();
    [...(publicCircles || []), ...extraCircles].forEach((item) => {
        byId.set(item.id, normalizeCircle(item));
    });
    return Array.from(byId.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
};

const subscribeTableReload = (channelName, table, filter, load, onError) => {
    let active = true;

    const run = async () => {
        try {
            await load();
        } catch (error) {
            if (active) onError?.(error);
        }
    };

    run();

    const channel = supabase
        .channel(channelName)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter }, run)
        .subscribe();

    return () => {
        active = false;
        supabase.removeChannel(channel).catch(() => {});
    };
};

export const circleService = {
    createCircle: async (...args) => circleRepository.createCircle(...args),
    updateCircle: async (circleId, data) => circleRepository.updateCircle(circleId, data),
    setCircleBillingTier: async (circleId, billingTier) => circleRepository.setCircleBillingTier(circleId, billingTier),
    createCircleInvite: async (circleId, options = {}) => callableClient.invokeWithAuth('createCircleInvite', { circleId, expiresInHours: options?.expiresInHours, maxUses: options?.maxUses }),
    createAppInvite: async (options = {}) => callableClient.invokeWithAuth('createAppInvite', { expiresInHours: options?.expiresInHours, maxUses: options?.maxUses }),
    listUserInvitations: async () => callableClient.invokeWithAuth('listUserInvitations', {}),
    resolveInviteToken: async (token) => callableClient.invokePublic('resolveInviteToken', { token }),
    joinCircleWithInvite: async (token) => callableClient.invokeWithAuth('joinCircleWithInvite', { token }),
    ensureCircleChat: async (circleId) => callableClient.invokeWithAuth('ensureCircleChat', { circleId }),
    resolveAppInvite: async (token) => callableClient.invokePublic('resolveAppInvite', { token }),
    consumeAppInvite: async (token) => callableClient.invokeWithAuth('consumeAppInvite', { token }),
    joinCircle: async (circleId) => circleRepository.joinCircle(circleId),
    leaveCircle: async (circleId) => circleRepository.leaveCircle(circleId),

    async deleteCircle(circleId) {
        const result = await circleRepository.deleteCircle(circleId);
        // Notify all subscribers that this circle was removed
        circleService._deletedIds.add(circleId);
        circleService._onChangeListeners.forEach((fn) => fn());
        return result;
    },

    // Internal: track deleted circle IDs so subscribers can filter them out instantly
    _deletedIds: new Set(),
    _onChangeListeners: new Set(),

    subscribeToMyCircles(uid, callback) {
        const load = async () => {
            const circles = await loadCircles(uid);
            const filtered = circles
                .filter((circle) => (circle.members || []).includes(uid))
                .filter((circle) => !circleService._deletedIds.has(circle.id));
            callback(filtered);
        };

        // Listen to both circle_members AND circles table for realtime updates
        let active = true;
        const run = async () => {
            if (!active) return;
            try { await load(); } catch {}
        };

        run();

        const memberChannel = supabase
            .channel(randomChannel('my-circles-members', uid))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'circle_members', filter: `user_id=eq.${uid}` }, run)
            .subscribe();

        const circleChannel = supabase
            .channel(randomChannel('my-circles-status', uid))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'circles' }, run)
            .subscribe();

        // Also listen for local optimistic deletions
        const onLocalChange = () => run();
        circleService._onChangeListeners.add(onLocalChange);

        return () => {
            active = false;
            circleService._onChangeListeners.delete(onLocalChange);
            supabase.removeChannel(memberChannel).catch(() => {});
            supabase.removeChannel(circleChannel).catch(() => {});
        };
    },

    async getAllCircles() {
        const { data } = await supabase.auth.getUser();
        return loadCircles(data.user?.id || null);
    },

    manageMember: async (circleId, targetUid, action) => callableClient.invokeWithAuth('manageMember', { circleId, targetUid, action }),
    handleJoinRequest: async (circleId, targetUid, action) => callableClient.invokeWithAuth('handleJoinRequest', { circleId, targetUid, action }),
    resolveCircleReport: async (circleId, reportId, action, resolutionNote = '') => callableClient.invokeWithAuth('resolveCircleReport', { circleId, reportId, action, resolutionNote }),
    submitReport: async (circleId, targetId, targetType, reason, description = '') => callableClient.invokeWithAuth('submitReport', { circleId, targetId, targetType, reason, description }),
    scheduleHuddle: async (circleId, title, scheduledAt) => callableClient.invokeWithAuth('scheduleHuddle', { circleId, title, scheduledAt: scheduledAt.toISOString() }),
    toggleScheduledHuddleReminder: async (circleId, eventId, enabled) => callableClient.invokeWithAuth('toggleScheduledHuddleReminder', { circleId, eventId, enabled: !!enabled }),
    deleteScheduledHuddle: async (circleId, eventId) => callableClient.invokeWithAuth('deleteScheduledHuddle', { circleId, eventId }),
    triggerDueScheduledHuddles: async (circleId) => callableClient.invokeWithAuth('triggerDueScheduledHuddles', { circleId }),

    subscribeToScheduledHuddles(circleId, callback, onError) {
        return subscribeTableReload(randomChannel('scheduled-huddles', circleId), 'scheduled_huddles', `circle_id=eq.${circleId}`, async () => {
            const { data, error } = await supabase
                .from('scheduled_huddles')
                .select('*')
                .eq('circle_id', circleId)
                .order('scheduled_at', { ascending: true });
            if (error) throw error;

            const now = Date.now();
            const events = (data || []).map(normalizeScheduledEvent).filter((event) => new Date(event.scheduledAt || 0).getTime() > now);
            const hasDueSoonEvent = events.some((event) => {
                const ms = new Date(event.scheduledAt || 0).getTime();
                return Number.isFinite(ms) && ms <= (now + 30000) && ms >= (now - 10 * 60 * 1000);
            });

            if (hasDueSoonEvent) {
                const lastKick = dueScheduleKickState.get(circleId) || 0;
                if ((now - lastKick) > DUE_SCHEDULE_KICK_THROTTLE_MS) {
                    dueScheduleKickState.set(circleId, now);
                    callableClient.invokeWithAuth('triggerDueScheduledHuddles', { circleId }).catch(() => {});
                }
            }

            callback(events);
        }, onError);
    },

    subscribeToCircleMember(circleId, uid, callback, onError) {
        return subscribeTableReload(randomChannel('circle-member', `${circleId}-${uid}`), 'circle_members', `circle_id=eq.${circleId}`, async () => {
            const { data, error } = await supabase
                .from('circle_members')
                .select('*')
                .eq('circle_id', circleId)
                .eq('user_id', uid)
                .maybeSingle();
            if (error) throw error;
            callback(data ? {
                uid: data.user_id,
                role: data.role,
                status: data.status,
                joinedAt: data.joined_at,
            } : null);
        }, onError);
    },

    async getCircleById(circleId) {
        const { data, error } = await supabase.from('circles').select('*').eq('id', circleId).maybeSingle();
        if (error) throw error;
        return normalizeCircle(data);
    },

    async listCircleRequests(circleId) {
        const response = await callableClient.invokeWithAuth('listCircleRequests', { circleId });
        return Array.isArray(response?.items) ? response.items.map((item) => ({
            id: item.id,
            uid: item.user_id,
            status: item.status,
            answers: item.answers || {},
            message: item.message || '',
            createdAt: item.created_at || null,
            resolvedAt: item.resolved_at || null,
        })) : [];
    },

    async listCircleReports(circleId) {
        const response = await callableClient.invokeWithAuth('listCircleReports', { circleId });
        return Array.isArray(response?.items) ? response.items.map((item) => ({
            id: item.id,
            reporterId: item.reporter_uid,
            targetId: item.target_id,
            targetType: item.target_type,
            reason: item.reason || '',
            description: item.description || '',
            status: item.status || 'pending',
            resolutionAction: item.resolution_action || null,
            resolutionNote: item.resolution_note || '',
            createdAt: item.created_at || null,
            resolvedAt: item.resolved_at || null,
        })) : [];
    },
};
