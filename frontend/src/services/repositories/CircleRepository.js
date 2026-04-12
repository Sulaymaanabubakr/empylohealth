import { callableClient } from '../api/callableClient';

export const circleRepository = {
    async createCircle({ name, description, category, type, image, visibility, location, tags }) {
        if (!name?.trim()) throw new Error('Circle name is required.');
        return callableClient.invokeWithAuth('createCircle', {
            name: name.trim(),
            description: description || '',
            category: category || 'General',
            type: type || 'public',
            visibility: visibility || 'visible',
            image: image || null,
            location: String(location || '').trim(),
            tags: Array.isArray(tags) ? tags : [],
        });
    },

    async updateCircle(circleId, data) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('updateCircle', { circleId, ...data });
    },

    async setCircleBillingTier(circleId, billingTier) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('setCircleBillingTier', { circleId, billingTier });
    },

    async joinCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('joinCircle', { circleId });
    },

    async leaveCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('leaveCircle', { circleId });
    },

    async deleteCircle(circleId) {
        if (!circleId) throw new Error('Invalid request.');
        return callableClient.invokeWithAuth('deleteCircle', { circleId });
    },
};
