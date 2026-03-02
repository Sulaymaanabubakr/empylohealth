const CANONICAL_WEB_URL = (process.env.EXPO_PUBLIC_CANONICAL_WEB_URL || 'https://empylo.com').replace(/\/+$/, '');
const APP_BASE_SCHEME = 'circlesapp://';
const IOS_STORE_URL = process.env.EXPO_PUBLIC_IOS_STORE_URL || 'https://apps.apple.com';
const ANDROID_STORE_URL = process.env.EXPO_PUBLIC_ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.empylo.circlesapp';

const safeSegment = (value = '') => encodeURIComponent(String(value || '').trim());

const pathToUrl = (path) => `${CANONICAL_WEB_URL}${path.startsWith('/') ? path : `/${path}`}`;

const buildAppFallbackLink = (type, id = '') => {
    const safeType = safeSegment(type);
    const safeId = safeSegment(id);
    return `${APP_BASE_SCHEME}${safeType}${safeId ? `/${safeId}` : ''}`;
};

export const buildInviteLink = (token) => {
    const safeToken = String(token || '').trim();
    if (!safeToken) return pathToUrl('/download');
    return pathToUrl(`/invite/${safeSegment(safeToken)}`);
};
export const buildAppInviteLink = (token) => {
    const safeToken = String(token || '').trim();
    if (!safeToken) return pathToUrl('/download');
    return pathToUrl(`/ref/${safeSegment(safeToken)}`);
};

export const buildCircleLink = (circleId) => pathToUrl(`/circle/${safeSegment(circleId)}`);
export const buildAffirmationLink = (affirmationId) => pathToUrl(`/a/${safeSegment(affirmationId)}`);
export const buildResourceLink = (resourceId) => pathToUrl(`/r/${safeSegment(resourceId)}`);

export const buildStoreFallbackText = () => (
    `If the app does not open, install Circles Health:\n` +
    `iOS: ${IOS_STORE_URL}\n` +
    `Android: ${ANDROID_STORE_URL}`
);

export const buildInviteShareText = ({ token, circleName } = {}) => {
    const link = buildInviteLink(token);
    const fallback = token ? buildAppFallbackLink('invite', token) : APP_BASE_SCHEME;
    return `Join my circle '${circleName || 'Circle'}' on Circles Health: ${link}\n\nFallback link: ${fallback}\n${buildStoreFallbackText()}`;
};

export const buildAppInviteShareText = ({ token } = {}) => {
    const link = buildAppInviteLink(token);
    const fallback = token ? buildAppFallbackLink('ref', token) : APP_BASE_SCHEME;
    return `Join me on Circles Health: ${link}\n\nFallback link: ${fallback}\n${buildStoreFallbackText()}`;
};

export const buildCircleShareText = ({ circleName, circleId, inviteUrl = '' }) => {
    const link = String(inviteUrl || '').trim() || buildCircleLink(circleId);
    const fallback = buildAppFallbackLink('circle', circleId);
    return `Join my circle '${circleName || 'Circle'}' on Circles Health: ${link}\n\nFallback link: ${fallback}\n${buildStoreFallbackText()}`;
};

export const buildAffirmationShareText = ({ text, affirmationId }) => {
    const link = buildAffirmationLink(affirmationId);
    const safeText = String(text || '').trim();
    const fallback = buildAppFallbackLink('affirmation', affirmationId);
    return `Here's an affirmation from Circles Health: ${link}\n\n${safeText}\n\nFallback link: ${fallback}\n${buildStoreFallbackText()}`;
};

export const buildResourceShareText = ({ title, resourceId }) => {
    const link = buildResourceLink(resourceId);
    const fallback = buildAppFallbackLink('resource', resourceId);
    return `Check this out on Circles Health: ${link}\n\n${String(title || '').trim()}\n\nFallback link: ${fallback}\n${buildStoreFallbackText()}`;
};

export const parseDeepLink = (url) => {
    if (!url || typeof url !== 'string') return null;
    const raw = String(url).trim();
    if (!raw) return null;

    const normalizeToPath = (input) => {
        if (/^[a-z]+:\/\//i.test(input)) {
            if (input.startsWith(APP_BASE_SCHEME)) {
                return input.slice(APP_BASE_SCHEME.length);
            }
            try {
                const u = new URL(input);
                return `${u.pathname || ''}${u.search || ''}`;
            } catch {
                return input;
            }
        }
        return input;
    };

    const normalized = normalizeToPath(raw).replace(/^\/+/, '');
    const pathOnly = normalized.split('?')[0];
    const parts = pathOnly.split('/').filter(Boolean).map((p) => decodeURIComponent(p));
    if (!parts.length) return null;

    if (parts[0] === 'open') {
        const type = String(parts[1] || '').toLowerCase();
        const id = String(parts[2] || '');
        if (type === 'invite' && id) return { type: 'invite', token: id };
        if (type === 'circle' && id) return { type: 'circle', id };
        if ((type === 'affirmation' || type === 'a') && id) return { type: 'affirmation', id };
        if ((type === 'resource' || type === 'r') && id) return { type: 'resource', id };
    }

    const key = String(parts[0] || '').toLowerCase();
    const id = String(parts[1] || '');
    if ((key === 'invite' || key === 'i') && id) return { type: 'invite', token: id };
    if ((key === 'ref' || key === 'app-invite') && id) return { type: 'app_invite', token: id };
    if (key === 'circle' && id) return { type: 'circle', id };
    if (key === 'a' && id) return { type: 'affirmation', id };
    if (key === 'r' && id) return { type: 'resource', id };
    if (key === 'affirmation' && id) return { type: 'affirmation', id };
    if (key === 'resource' && id) return { type: 'resource', id };
    return null;
};

export const DEEPLINK_CANONICAL_WEB_URL = CANONICAL_WEB_URL;
