const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<>{}\[\]|\\^`"]+)/gi;
const UNSAFE_SCHEME_PATTERN = /^(javascript|data|file|intent|vbscript|about|blob|ftp|mailto|tel):/i;
const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const SHORTENER_HOSTS = new Set<string>([
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

export type ChatUrlSafetyResult = {
    safe: boolean;
    reason: string | null;
    normalizedUrl: string | null;
};

const trimTrailingPunctuation = (value: string): string => {
    let out = value;
    while (/[),.!?;:'"]$/.test(out)) {
        out = out.slice(0, -1);
    }
    return out;
};

export const sanitizeChatMessageText = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(CONTROL_CHAR_PATTERN, '');
};

const containsUnsafeScheme = (value: string): boolean => {
    return UNSAFE_SCHEME_PATTERN.test(value.trim().toLowerCase());
};

const isIpv4Host = (host: string): boolean => {
    if (!IPV4_PATTERN.test(host)) return false;
    return host.split('.').every((part) => {
        const n = Number(part);
        return Number.isInteger(n) && n >= 0 && n <= 255;
    });
};

const isPrivateIpv4 = (host: string): boolean => {
    if (!isIpv4Host(host)) return false;
    const [aRaw, bRaw] = host.split('.');
    const a = Number(aRaw ?? -1);
    const b = Number(bRaw ?? -1);
    return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
};

const normalizeChatUrl = (candidate: string): { href: string; protocol: string; host: string } | null => {
    const raw = trimTrailingPunctuation(String(candidate || '').trim());
    if (!raw) return null;
    if (containsUnsafeScheme(raw)) return null;

    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed: URL;
    try {
        parsed = new URL(withProtocol);
    } catch {
        return null;
    }

    const protocol = String(parsed.protocol || '').toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return null;
    const host = String(parsed.hostname || '').toLowerCase();
    if (!host) return null;

    return {
        href: parsed.toString(),
        protocol: protocol.replace(':', ''),
        host
    };
};

export const isSafeChatUrl = (candidate: string): ChatUrlSafetyResult => {
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

export const extractUrlsFromMessage = (messageText: unknown): string[] => {
    const text = sanitizeChatMessageText(messageText);
    const out: string[] = [];
    const regex = new RegExp(URL_REGEX.source, 'gi');
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
        const value = trimTrailingPunctuation(String(match[0] || ''));
        if (!value) continue;
        out.push(value);
    }
    return out;
};

export const findUnsafeUrlsInMessage = (messageText: unknown): Array<{ url: string; reason: string | null }> => {
    return extractUrlsFromMessage(messageText)
        .map((url) => ({ url, ...isSafeChatUrl(url) }))
        .filter((entry) => !entry.safe)
        .map((entry) => ({ url: entry.url, reason: entry.reason }));
};
