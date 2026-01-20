import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, setPersistence, browserLocalPersistence, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getFunctions, Functions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyC_e9Du-QiK5t5sbuPl3BW7v6g_Bh-7oCU",
    authDomain: "circles-app-by-empylo.firebaseapp.com",
    projectId: "circles-app-by-empylo",
    storageBucket: "circles-app-by-empylo.firebasestorage.app",
    messagingSenderId: "433309283212",
    appId: "1:433309283212:web:b94f75cbb30a0abb775ca9",
    measurementId: "G-S3WCX4LZL6"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

let auth: Auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => { });
} else {
    try {
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(ReactNativeAsyncStorage)
        });
    } catch (error) {
        // If already initialized (fast refresh), reuse existing instance.
        auth = getAuth(app);
    }
}

const db: Firestore = getFirestore(app);
const functions: Functions = getFunctions(app);

export { auth, db, functions, app };
