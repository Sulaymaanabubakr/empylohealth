import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, setPersistence, browserLocalPersistence, Auth, getReactNativePersistence } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyDVaL0blWgX0_jJQe6TVogePIdD9GqQ_Zk",
    authDomain: "circles-app-by-empylo.firebaseapp.com",
    projectId: "circles-app-by-empylo",
    storageBucket: "circles-app-by-empylo.firebasestorage.app",
    messagingSenderId: "433309283212",
    appId: "1:433309283212:web:b94f75cbb30a0abb775ca9",
    measurementId: "G-S3WCX4LZL6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => { });
} else {
    try {
        auth = initializeAuth(app, {
            persistence: (getReactNativePersistence)(ReactNativeAsyncStorage)
        });
    } catch (error) {
        // If already initialized (fast refresh), reuse existing instance.
        auth = getAuth(app);
        console.log('[Firebase] Auth already initialized, reusing instance. Setting persistence for safety.');
        // Ensure persistence is set even on fallback
        setPersistence(auth, (getReactNativePersistence)(ReactNativeAsyncStorage))
            .then(() => console.log('[Firebase] Persistence set manually on fallback'))
            .catch((e) => console.error('[Firebase] Failed to set persistence on fallback', e));
    }
}

const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

console.log('Firebase Initialized:', {
    appId: app.options.appId,
    projectId: app.options.projectId,
    functionsRegion: functions.region,
    functionsCustomDomain: functions.customDomain
});

export { auth, db, functions, app };
