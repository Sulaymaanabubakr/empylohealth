import { FIREBASE_ENV_INFO } from '../firebaseConfig';

export const logNetworkRegionDebug = () => {
    if (!__DEV__) return;

    console.log('[NetworkRegionDebug] Functions region:', FIREBASE_ENV_INFO.functionsRegion);
    console.log('[NetworkRegionDebug] Firestore location:', FIREBASE_ENV_INFO.firestoreRegion);
    console.log('[NetworkRegionDebug] RTDB URL:', FIREBASE_ENV_INFO.rtdbUrl);
};
