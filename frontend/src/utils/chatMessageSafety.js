const URL_REGEX = /\b((?:https?:\/\/|www\.)[^\s<>{}\[\]|\\^`"]+)/gi;

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

const UNSAFE_SCHEME_PATTERN = /^(javascript|data|file|intent|vbscript|about|blob|ftp|mailto|tel):/i;

const IPV4_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$/;
const CONTROL_CHAR_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

const trimTrailingPunctuation = (value = '') => {
  let out = String(value || '');
  while (/[),.!?;:'"]$/.test(out)) {
    out = out.slice(0, -1);
  }
  return out;
};

const sanitizeChatMessageText = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(CONTROL_CHAR_PATTERN, '');
};

const containsUnsafeScheme = (candidate = '') => {
  const normalized = String(candidate || '').trim().toLowerCase();
  return UNSAFE_SCHEME_PATTERN.test(normalized);
};

const isIpv4Host = (host = '') => {
  if (!IPV4_PATTERN.test(host)) return false;
  return host.split('.').every((part) => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255;
  });
};

const isPrivateIpv4 = (host = '') => {
  if (!isIpv4Host(host)) return false;
  const [a, b] = host.split('.').map((part) => Number(part));
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
};

const normalizeChatUrl = (candidate) => {
  if (!candidate) return null;
  const raw = trimTrailingPunctuation(String(candidate || '').trim());
  if (!raw) return null;
  if (containsUnsafeScheme(raw)) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  let parsed;
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
    raw,
    href: parsed.toString(),
    protocol: protocol.replace(':', ''),
    host
  };
};

const getUnsafeReason = (normalizedUrl) => {
  if (!normalizedUrl) return 'malformed';

  const { host } = normalizedUrl;
  if (!host || host === 'localhost') return 'local_host';
  if (isIpv4Host(host)) return isPrivateIpv4(host) ? 'private_ip' : 'ip_host';
  if (host.includes('xn--')) return 'punycode';
  if (/[^ -~]/.test(host)) return 'unicode_host';
  if (SHORTENER_HOSTS.has(host)) return 'shortener';
  return null;
};

const isSafeChatUrl = (candidate) => {
  const normalized = normalizeChatUrl(candidate);
  if (!normalized) {
    return { safe: false, reason: 'malformed', normalizedUrl: null };
  }
  const unsafeReason = getUnsafeReason(normalized);
  if (unsafeReason) {
    return { safe: false, reason: unsafeReason, normalizedUrl: normalized.href };
  }
  return {
    safe: true,
    reason: normalized.protocol === 'http' ? 'insecure_http' : null,
    normalizedUrl: normalized.href
  };
};

const extractUrlsFromMessage = (messageText) => {
  const text = sanitizeChatMessageText(messageText);
  const urls = [];
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let match;

  while ((match = regex.exec(text)) !== null) {
    const fullMatch = String(match[0] || '');
    const trimmed = trimTrailingPunctuation(fullMatch);
    if (!trimmed) continue;
    urls.push({
      raw: trimmed,
      index: match.index,
      length: trimmed.length,
      ...isSafeChatUrl(trimmed)
    });
  }

  return urls;
};

const parseChatMessageText = (messageText) => {
  const text = sanitizeChatMessageText(messageText);
  if (!text) return [{ type: 'text', text: '' }];

  const segments = [];
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const matchedText = String(match[0] || '');
    const trimmed = trimTrailingPunctuation(matchedText);
    const start = match.index;
    if (start > lastIndex) {
      segments.push({
        type: 'text',
        text: text.slice(lastIndex, start)
      });
    }

    if (!trimmed) {
      lastIndex = start + matchedText.length;
      continue;
    }

    const safety = isSafeChatUrl(trimmed);
    segments.push({
      type: 'link',
      text: trimmed,
      raw: trimmed,
      url: safety.normalizedUrl,
      safe: safety.safe,
      reason: safety.reason
    });

    const trimOffset = matchedText.length - trimmed.length;
    if (trimOffset > 0) {
      segments.push({
        type: 'text',
        text: matchedText.slice(trimmed.length)
      });
    }

    lastIndex = start + matchedText.length;
  }

  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(lastIndex)
    });
  }

  return segments;
};

const findUnsafeUrlsInMessage = (messageText) => {
  return extractUrlsFromMessage(messageText).filter((entry) => !entry.safe);
};

export {
  sanitizeChatMessageText,
  extractUrlsFromMessage,
  normalizeChatUrl,
  isSafeChatUrl,
  parseChatMessageText,
  findUnsafeUrlsInMessage
};
