const ONLINE_FRESHNESS_MS = 60 * 1000;

const toMillis = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

export const isPresenceOnline = (presence) => {
    if (!presence || presence.state !== 'online') return false;
    const lastChangedMs = toMillis(presence.lastChanged ?? presence.updatedAt ?? 0);
    if (!lastChangedMs) return false;
    return (Date.now() - lastChangedMs) <= ONLINE_FRESHNESS_MS;
};

export const presenceFreshnessMs = ONLINE_FRESHNESS_MS;
