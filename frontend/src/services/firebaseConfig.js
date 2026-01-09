import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
    apiKey: "AIzaSyDEe2QhoNeM2fNFYLypMA6nEgepfBz5ZMs",
    authDomain: "empylo-health.firebaseapp.com",
    projectId: "empylo-health",
    storageBucket: "empylo-health.firebasestorage.app",
    messagingSenderId: "607256726988",
    appId: "1:607256726988:web:a83be3162f30cad061a169",
    measurementId: "G-1G5TPG07BC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

let auth;
if (Platform.OS === 'web') {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
} else {
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
}

const db = getFirestore(app);
const functions = getFunctions(app);

export { auth, db, functions, app };
