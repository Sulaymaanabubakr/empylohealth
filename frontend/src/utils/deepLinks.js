const APP_SCHEMES = ['exp+circles-app://', 'circles-app://', 'circles://'];
const APP_SCHEME = APP_SCHEMES[0];
const WEB_BASE = 'https://www.empylo.com';

export const buildInviteLink = (uid) => `${APP_SCHEME}invite/${encodeURIComponent(uid || '')}`;
export const buildCircleLink = (circleId) => `${APP_SCHEME}circle/${encodeURIComponent(circleId || '')}`;
export const buildAffirmationLink = (affirmationId) => `${APP_SCHEME}affirmation/${encodeURIComponent(affirmationId || '')}`;

export const buildInviteShareText = (uid) => {
    const appLink = buildInviteLink(uid);
    const webLink = `${WEB_BASE}/download`;
    return `Join me on Circles Health App by Empylo.\n\nOpen in app: ${appLink}\nDownload app: ${webLink}`;
};

export const buildCircleShareText = ({ circleName, circleId }) => {
    const appLink = buildCircleLink(circleId);
    const webLink = `${WEB_BASE}/download`;
    return `Join my circle "${circleName || 'Circle'}" on Circles Health App.\n\nOpen in app: ${appLink}\nDownload app: ${webLink}`;
};

export const buildAffirmationShareText = ({ text, affirmationId }) => {
    const appLink = buildAffirmationLink(affirmationId);
    const safeText = String(text || '').trim();
    return `${safeText}\n\nView this affirmation in Circles: ${appLink}`;
};

export const parseDeepLink = (url) => {
    if (!url || typeof url !== 'string') return null;
    let normalized = url;
    APP_SCHEMES.forEach((scheme) => {
        normalized = normalized.replace(scheme, '');
    });
    normalized = normalized.replace(/^https?:\/\/[^/]+\//, '');
    const [path, rawId] = normalized.split('/');
    const id = decodeURIComponent(rawId || '');
    if (!path) return null;

    const key = path.toLowerCase();
    if (key === 'circle' && id) return { type: 'circle', id };
    if (key === 'affirmation' && id) return { type: 'affirmation', id };
    if (key === 'invite' && id) return { type: 'invite', id };
    return null;
};
