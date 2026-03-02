import { Linking } from 'react-native';
import { navigate } from '../../navigation/navigationRef';
import { pendingDeepLink } from './pendingDeepLink';
import { parseDeepLink } from '../../utils/deepLinks';

const dedupeSeen = new Map();
const DEDUPE_TTL_MS = 12_000;

const remember = (key) => {
  const now = Date.now();
  for (const [k, ts] of dedupeSeen.entries()) {
    if ((now - ts) > DEDUPE_TTL_MS) dedupeSeen.delete(k);
  }
  if (dedupeSeen.has(key)) return false;
  dedupeSeen.set(key, now);
  return true;
};

const buildRouteFromParsed = (parsed) => {
  if (!parsed?.type) return null;
  if (parsed.type === 'invite' && parsed.token) return { screen: 'InviteLanding', params: { token: parsed.token } };
  if (parsed.type === 'app_invite' && parsed.token) return { screen: 'AppInviteLanding', params: { token: parsed.token } };
  if (parsed.type === 'circle' && parsed.id) return { screen: 'CircleDetail', params: { circle: { id: parsed.id } } };
  if (parsed.type === 'affirmation' && parsed.id) return { screen: 'Affirmations', params: { affirmationId: parsed.id } };
  if (parsed.type === 'resource' && parsed.id) return { screen: 'ActivityDetail', params: { resourceId: parsed.id } };
  return null;
};

const routeNow = async ({ parsed, url, source, routeTarget, onBanner }) => {
  const route = buildRouteFromParsed(parsed);
  if (!route) return false;

  if (routeTarget === 'UNAUTH') {
    await pendingDeepLink.save({
      kind: 'route',
      route,
      url: String(url || ''),
      source: source || 'unknown',
      createdAt: Date.now()
    });
    if (parsed.type === 'app_invite') {
      navigate('Onboarding', { appInviteToken: parsed.token });
    } else {
      navigate('Onboarding');
    }
    return true;
  }

  navigate(route.screen, route.params || {});
  if (typeof onBanner === 'function') {
    if (parsed.type === 'invite') onBanner('Opened invite link');
    if (parsed.type === 'app_invite') onBanner('Opened app invite');
    if (parsed.type === 'circle') onBanner('Opened circle link');
    if (parsed.type === 'affirmation') onBanner('Opened affirmation link');
    if (parsed.type === 'resource') onBanner('Opened resource link');
  }
  return true;
};

const handleParsedCandidate = async ({ parsed, url, source, routeTarget, onBanner }) => {
  if (!parsed) return false;
  const key = `${parsed.type}:${parsed.id || parsed.token || ''}:${source || ''}`;
  if (!remember(key)) return false;
  return routeNow({ parsed, url, source, routeTarget, onBanner });
};

const handleUrl = async ({ url, source, routeTarget, onBanner }) => {
  const parsed = parseDeepLink(url);
  return handleParsedCandidate({ parsed, url, source, routeTarget, onBanner });
};

export const DeepLinkRouter = {
  start: ({ routeTarget, onBanner }) => {
    let cancelled = false;

    Linking.getInitialURL()
      .then((url) => {
        if (!url || cancelled) return;
        handleUrl({ url, source: 'initial_url', routeTarget, onBanner }).catch(() => {});
      })
      .catch(() => {});

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      if (!url || cancelled) return;
      handleUrl({ url, source: 'runtime_url', routeTarget, onBanner }).catch(() => {});
    });

    return () => {
      cancelled = true;
      linkSub?.remove?.();
    };
  },

  resumePending: async ({ routeTarget, onBanner }) => {
    if (routeTarget === 'UNAUTH') return false;
    const pending = await pendingDeepLink.consume().catch(() => null);
    if (!pending) return false;

    if (pending?.route?.screen) {
      const key = `${pending.route.screen}:${JSON.stringify(pending.route.params || {})}`;
      if (!remember(key)) return false;
      navigate(pending.route.screen, pending.route.params || {});
      if (typeof onBanner === 'function') onBanner('Continued from shared link');
      return true;
    }

    const url = String(pending?.url || '').trim();
    if (!url) return false;
    return handleUrl({ url, source: pending?.source || 'pending', routeTarget, onBanner });
  }
};
