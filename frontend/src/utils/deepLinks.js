const APP_SCHEMES = ['circlesapp://', 'exp+circles-app://', 'circles-app://', 'circles://'];
const WEB_BASE = 'https://www.empylo.com';

const buildWebOpenLink = (type, id = '') => {
    const safeType = encodeURIComponent(String(type || '').trim());
    const safeId = encodeURIComponent(String(id || '').trim());
    const path = safeId ? `${safeType}/${safeId}` : safeType;
    return `${WEB_BASE}/open/${path}`;
};

export const buildInviteLink = (uid) => buildWebOpenLink('invite', uid);
export const buildCircleLink = (circleId) => buildWebOpenLink('circle', circleId);
export const buildAffirmationLink = (affirmationId) => buildWebOpenLink('affirmation', affirmationId);

export const buildInviteShareText = (uid) => {
    const appLink = buildInviteLink(uid);
    return `Join me on Circles Health App by Empylo.\n\n${appLink}`;
};

export const buildCircleShareText = ({ circleName, circleId }) => {
    const appLink = buildCircleLink(circleId);
    return `Join my circle "${circleName || 'Circle'}" on Circles Health App.\n\n${appLink}`;
};

export const buildAffirmationShareText = ({ text, affirmationId }) => {
    const appLink = buildAffirmationLink(affirmationId);
    const safeText = String(text || '').trim();
    return `${safeText}\n\nView this affirmation in Circles:\n${appLink}`;
};

export const parseDeepLink = (url) => {
    if (!url || typeof url !== 'string') return null;
    let normalized = String(url).trim();

    // Handle custom schemes.
    APP_SCHEMES.forEach((scheme) => {
        if (normalized.startsWith(scheme)) {
            normalized = normalized.slice(scheme.length);
        }
    });

    // Handle https links (e.g. https://www.empylo.com/open/circle/abc)
    normalized = normalized.replace(/^https?:\/\/[^/]+\//i, '');
    const clean = normalized.split('?')[0]?.replace(/^\/+/, '') || '';
    const parts = clean.split('/').filter(Boolean);
    if (!parts.length) return null;

    if (parts[0]?.toLowerCase() === 'open') {
        const type = String(parts[1] || '').toLowerCase();
        const id = decodeURIComponent(parts[2] || '');
        if (type === 'invite' && id) return { type: 'invite', id };
        if (type === 'circle' && id) return { type: 'circle', id };
        if (type === 'affirmation' && id) return { type: 'affirmation', id };
        return null;
    }

    const key = String(parts[0] || '').toLowerCase();
    const id = decodeURIComponent(parts[1] || '');
    if (key === 'circle' && id) return { type: 'circle', id };
    if (key === 'affirmation' && id) return { type: 'affirmation', id };
    if (key === 'invite' && id) return { type: 'invite', id };
    return null;
};
