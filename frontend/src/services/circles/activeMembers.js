import { supabase } from '../supabase/supabaseClient';

const toUniqueCircleIds = (circleIds = []) => {
    return [...new Set((Array.isArray(circleIds) ? circleIds : []).filter(Boolean))];
};

export const fetchActiveMemberIdsMap = async (circleIds = []) => {
    const uniqueCircleIds = toUniqueCircleIds(circleIds);
    if (uniqueCircleIds.length === 0) return {};

    try {
        const { data, error } = await supabase
            .from('circle_members')
            .select('circle_id, user_id')
            .in('circle_id', uniqueCircleIds)
            .eq('status', 'active');
        if (error) throw error;

        const map = {};
        uniqueCircleIds.forEach((id) => { map[id] = []; });
        (data || []).forEach((row) => {
            if (map[row.circle_id]) {
                map[row.circle_id].push(row.user_id);
            }
        });
        return map;
    } catch (error) {
        // Fallback: return empty map so UI uses circle.members
        return {};
    }
};

export const getDisplayMemberIds = (circleId, fallbackMembers = [], activeMemberIdsMap = {}) => {
    const activeIds = activeMemberIdsMap?.[circleId];
    if (Array.isArray(activeIds)) return activeIds;
    return Array.isArray(fallbackMembers) ? fallbackMembers : [];
};

export const getActiveMemberCount = (circleId, fallbackMembers = [], activeMemberIdsMap = {}) => {
    return getDisplayMemberIds(circleId, fallbackMembers, activeMemberIdsMap).length;
};
