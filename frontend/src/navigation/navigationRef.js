import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();
let pendingNavigation = null;

export const navigate = (name, params) => {
    if (navigationRef.isReady()) {
        navigationRef.navigate(name, params);
        return;
    }
    pendingNavigation = { name, params };
};

export const flushPendingNavigation = () => {
    if (!pendingNavigation || !navigationRef.isReady()) return;
    const { name, params } = pendingNavigation;
    pendingNavigation = null;
    navigationRef.navigate(name, params);
};
