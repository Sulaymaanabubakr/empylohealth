import { initializeApp } from 'firebase/app';
import {
    getAuth,
    initializeAuth,
    setPersistence,
    browserLocalPersistence,
    getReactNativePersistence
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const FUNCTIONS_REGION = 'europe-west1';
const FIRESTORE_REGION = 'eur3';

const configuredRtdbUrl =
    process.env.EXPO_PUBLIC_FIREBASE_RTDB_URL ||
    'https://circles-app-by-empylo-default-rtdb.europe-west1.firebasedatabase.app';

const firebaseConfig = {
    apiKey: 'AIzaSyDVaL0blWgX0_jJQe6TVogePIdD9GqQ_Zk',
    authDomain: 'circles-app-by-empylo.firebaseapp.com',
    projectId: 'circles-app-by-empylo',
    storageBucket: 'circles-app-by-empylo.firebasestorage.app',
    messagingSenderId: '433309283212',
    appId: '1:433309283212:web:b94f75cbb30a0abb775ca9',
    measurementId: 'G-S3WCX4LZL6',
    databaseURL: configuredRtdbUrl
};

const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } catch {
        auth = getAuth(app);
        setPersistence(auth, getReactNativePersistence(ReactNativeAsyncStorage)).catch(() => {});
    }
}

const db = getFirestore(app);
const functions = getFunctions(app, FUNCTIONS_REGION);
const rtdb = getDatabase(app, configuredRtdbUrl);

export const FIREBASE_ENV_INFO = {
    functionsRegion: FUNCTIONS_REGION,
    firestoreRegion: FIRESTORE_REGION,
    rtdbUrl: configuredRtdbUrl
};

if (__DEV__) {
    console.log('[Firebase] Initialized', {
        projectId: app.options.projectId,
        functionsRegion: FUNCTIONS_REGION,
        firestoreRegion: FIRESTORE_REGION,
        rtdbUrl: configuredRtdbUrl
    });
}

export { auth, db, functions, rtdb, app };
