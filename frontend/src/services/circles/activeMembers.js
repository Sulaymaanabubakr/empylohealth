import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const toUniqueCircleIds = (circleIds = []) => {
    return [...new Set((Array.isArray(circleIds) ? circleIds : []).filter(Boolean))];
};

export const fetchActiveMemberIdsMap = async (circleIds = []) => {
    const uniqueCircleIds = toUniqueCircleIds(circleIds);
    if (uniqueCircleIds.length === 0) return {};

    const entries = await Promise.all(
        uniqueCircleIds.map(async (circleId) => {
            try {
                const membersQuery = query(
                    collection(db, 'circles', circleId, 'members'),
                    where('status', '==', 'active')
                );
                const snapshot = await getDocs(membersQuery);
                return [circleId, snapshot.docs.map((docSnap) => docSnap.id)];
            } catch (error) {
                const code = String(error?.code || '').toLowerCase();
                const message = String(error?.message || '').toLowerCase();
                const isPermissionDenied = code.includes('permission-denied') || message.includes('permission') || message.includes('insufficient permissions');
                if (typeof __DEV__ !== 'undefined' && __DEV__ && !isPermissionDenied) {
                    console.warn('[ActiveMembers] fallback to circle.members for', circleId, error?.code || error?.message || error);
                }
                return [circleId, null];
            }
        })
    );

    return Object.fromEntries(entries);
};

export const getDisplayMemberIds = (circleId, fallbackMembers = [], activeMemberIdsMap = {}) => {
    const activeIds = activeMemberIdsMap?.[circleId];
    if (Array.isArray(activeIds)) return activeIds;
    return Array.isArray(fallbackMembers) ? fallbackMembers : [];
};

export const getActiveMemberCount = (circleId, fallbackMembers = [], activeMemberIdsMap = {}) => {
    return getDisplayMemberIds(circleId, fallbackMembers, activeMemberIdsMap).length;
};
