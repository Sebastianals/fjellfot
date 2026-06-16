import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth } from 'firebase/auth';
// @ts-ignore — getReactNativePersistence ships in the RN build of firebase/auth
import { getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reused from the followreal project. These web keys are NOT secret —
// they identify the project to Firebase; security is enforced by Firestore rules.
// Swap for a dedicated Fjellfot project when you're ready.
export const firebaseConfig = {
  apiKey: 'AIzaSyBhD3v3_8-C8czz9iYaTlhcFqQcSi_b0Bc',
  authDomain: 'followreal-eee0d.firebaseapp.com',
  projectId: 'followreal-eee0d',
  storageBucket: 'followreal-eee0d.firebasestorage.app',
  messagingSenderId: '13371832657',
  appId: '1:13371832657:web:e8f4122cb205bb19047b70',
  measurementId: 'G-PCL6JWGMZT',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth can only run once; fall back to getAuth on hot reload.
let _auth;
try {
  _auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  _auth = getAuth(app);
}
export const auth = _auth;

// Long polling makes Firestore reliable inside Expo Go / Hermes
// (the default WebChannel transport can stall on RN).
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export { app };
