import { formatDateUK, formatTimeUK } from './dateFormat';

export const toMillis = (scheduledAt) => {
    if (!scheduledAt) return 0;
    if (typeof scheduledAt?.toMillis === 'function') return scheduledAt.toMillis();
    const date = scheduledAt?.toDate ? scheduledAt.toDate() : new Date(scheduledAt);
    const ms = date?.getTime?.() || 0;
    return Number.isFinite(ms) ? ms : 0;
};

export const formatCountdown = (targetMs, nowMs = Date.now()) => {
    const diff = Math.max(0, targetMs - nowMs);
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
};

export const formatEventDateTime = (scheduledAt) => {
    const date = scheduledAt?.toDate ? scheduledAt.toDate() : new Date(scheduledAt);
    if (!date || Number.isNaN(date.getTime())) return 'Unknown time';
    return `${formatDateUK(date)} • ${formatTimeUK(date)}`;
};
