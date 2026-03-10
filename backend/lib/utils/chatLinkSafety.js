"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUnsafeUrlsInMessage = exports.extractUrlsFromMessage = exports.isSafeChatUrl = exports.sanitizeChatMessageText = void 0;
const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<>{}\[\]|\\^`"]+)/gi;
const UNSAFE_SCHEME_PATTERN = /^(javascript|data|file|intent|vbscript|about|blob|ftp|mailto|tel):/i;
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const SHORTENER_HOSTS = new Set([
    'bit.ly',
    'tinyurl.com',
    't.co',
    'goo.gl',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'rebrand.ly',
    'tiny.cc',
    'shorturl.at',
    'cutt.ly',
    'rb.gy',
    'lnkd.in'
]);
const trimTrailingPunctuation = (value) => {
    let out = value;
    while (/[),.!?;:'"]$/.test(out)) {
        out = out.slice(0, -1);
    }
    return out;
};
const sanitizeChatMessageText = (value) => {
    if (value === null || value === undefined)
        return '';
    return String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(CONTROL_CHAR_PATTERN, '');
};
exports.sanitizeChatMessageText = sanitizeChatMessageText;
const containsUnsafeScheme = (value) => {
    return UNSAFE_SCHEME_PATTERN.test(value.trim().toLowerCase());
};
const isIpv4Host = (host) => {
    if (!IPV4_PATTERN.test(host))
        return false;
    return host.split('.').every((part) => {
        const n = Number(part);
        return Number.isInteger(n) && n >= 0 && n <= 255;
    });
};
const isPrivateIpv4 = (host) => {
    if (!isIpv4Host(host))
        return false;
    const [aRaw, bRaw] = host.split('.');
    const a = Number(aRaw ?? -1);
    const b = Number(bRaw ?? -1);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
};
const normalizeChatUrl = (candidate) => {
    const raw = trimTrailingPunctuation(String(candidate || '').trim());
    if (!raw)
        return null;
    if (containsUnsafeScheme(raw))
        return null;
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed;
    try {
        parsed = new URL(withProtocol);
    }
    catch {
        return null;
    }
    const protocol = String(parsed.protocol || '').toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:')
        return null;
    const host = String(parsed.hostname || '').toLowerCase();
    if (!host)
        return null;
    return {
        href: parsed.toString(),
        protocol: protocol.replace(':', ''),
        host
    };
};
const isSafeChatUrl = (candidate) => {
    const normalized = normalizeChatUrl(candidate);
    if (!normalized) {
        return { safe: false, reason: 'malformed', normalizedUrl: null };
    }
    const host = normalized.host;
    if (!host || host === 'localhost') {
        return { safe: false, reason: 'local_host', normalizedUrl: normalized.href };
    }
    if (isIpv4Host(host)) {
        return {
            safe: false,
            reason: isPrivateIpv4(host) ? 'private_ip' : 'ip_host',
            normalizedUrl: normalized.href
        };
    }
    if (host.includes('xn--')) {
        return { safe: false, reason: 'punycode', normalizedUrl: normalized.href };
    }
    if (/[^ -~]/.test(host)) {
        return { safe: false, reason: 'unicode_host', normalizedUrl: normalized.href };
    }
    if (SHORTENER_HOSTS.has(host)) {
        return { safe: false, reason: 'shortener', normalizedUrl: normalized.href };
    }
    return {
        safe: true,
        reason: normalized.protocol === 'http' ? 'insecure_http' : null,
        normalizedUrl: normalized.href
    };
};
exports.isSafeChatUrl = isSafeChatUrl;
const extractUrlsFromMessage = (messageText) => {
    const text = (0, exports.sanitizeChatMessageText)(messageText);
    const out = [];
    const regex = new RegExp(URL_REGEX.source, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
        const value = trimTrailingPunctuation(String(match[0] || ''));
        if (!value)
            continue;
        out.push(value);
    }
    return out;
};
exports.extractUrlsFromMessage = extractUrlsFromMessage;
const findUnsafeUrlsInMessage = (messageText) => {
    return (0, exports.extractUrlsFromMessage)(messageText)
        .map((url) => ({ url, ...(0, exports.isSafeChatUrl)(url) }))
        .filter((entry) => !entry.safe)
        .map((entry) => ({ url: entry.url, reason: entry.reason }));
};
exports.findUnsafeUrlsInMessage = findUnsafeUrlsInMessage;
//# sourceMappingURL=chatLinkSafety.js.map