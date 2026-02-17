import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
let pendingNavigation = null;

const canNavigateToRoute = (name) => {
    if (!navigationRef.isReady()) return false;
    const routeNames = navigationRef.getRootState()?.routeNames || [];
    return routeNames.includes(name);
};

export const navigate = (name, params) => {
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
