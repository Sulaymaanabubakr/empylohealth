import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from 'firebase/functions';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

const db = getFirestore(app);
const functions = getFunctions(app);

export { auth, db, functions, app };
