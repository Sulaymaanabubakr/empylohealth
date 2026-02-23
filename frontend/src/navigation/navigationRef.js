import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
let pendingNavigation = null;
let lastHuddleNav = { huddleId: null, ts: 0 };

const canNavigateToRoute = (name) => {
    if (!navigationRef.isReady()) return false;
    const routeNames = navigationRef.getRootState()?.routeNames || [];
    return routeNames.includes(name);
};

export const navigate = (name, params) => {
    if (name === 'Huddle') {
        const requestedHuddleId = params?.huddleId || null;
        const now = Date.now();
        const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
        const currentHuddleId = currentRoute?.name === 'Huddle' ? (currentRoute?.params?.huddleId || null) : null;

        if (requestedHuddleId && currentHuddleId && requestedHuddleId === currentHuddleId) {
            return true;
        }
        if (
            requestedHuddleId &&
            lastHuddleNav.huddleId === requestedHuddleId &&
            (now - lastHuddleNav.ts) < 4000
        ) {
            return true;
        }
        lastHuddleNav = { huddleId: requestedHuddleId, ts: now };
    }

    if (canNavigateToRoute(name)) {
        navigationRef.navigate(name, params);
        return true;
    }
    pendingNavigation = { name, params };
    return false;
};

export const flushPendingNavigation = () => {
    if (!pendingNavigation || !navigationRef.isReady()) return false;
    const { name, params } = pendingNavigation;
    if (!canNavigateToRoute(name)) {
        return false;
    }
    pendingNavigation = null;
    navigationRef.navigate(name, params);
    return true;
};
