const OFFLINE_STATE = { state: 'offline', lastChanged: null };

export const presenceRepository = {
    startPresence() {
        return async () => {};
    },

    subscribeToPresence(_uid, callback) {
        callback?.(OFFLINE_STATE);
        return () => {};
    },

    async getPresence() {
        return OFFLINE_STATE;
    },

    async markOffline() {
        return;
    },
};
