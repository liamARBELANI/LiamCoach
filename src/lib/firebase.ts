import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAnalytics, type Analytics } from 'firebase/analytics';

// TODO: replace with real Firebase project credentials (Liam's project).
// Values come from src/.env -> import.meta.env. While they remain PLACEHOLDER_*,
// `isFirebaseConfigured` is false and the app runs on the localStorage mock adapter.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? 'PLACEHOLDER_API_KEY',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'PLACEHOLDER.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'PLACEHOLDER_PROJECT_ID',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? 'PLACEHOLDER.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID ?? 'PLACEHOLDER_SENDER_ID',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? 'PLACEHOLDER_APP_ID',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'PLACEHOLDER_MEASUREMENT_ID',
};

/** True only when real (non-placeholder) credentials are present. */
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('PLACEHOLDER');

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;
let analyticsInstance: Analytics | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  authInstance = getAuth(app);
  // `ignoreUndefinedProperties` lets us write form objects that contain optional
  // fields left as `undefined` (e.g. untouched yes/no & enum selects). Without it,
  // Firestore throws "Unsupported field value: undefined" on save — which surfaced
  // to trainees as a generic "form submit failed" error at the very end.
  dbInstance = initializeFirestore(app, { ignoreUndefinedProperties: true });
  storageInstance = getStorage(app);
  if (typeof window !== 'undefined') {
    // Analytics is non-essential and can throw in blocked/unsupported environments.
    // Never let it crash app boot — that would white-screen everything.
    try {
      analyticsInstance = getAnalytics(app);
    } catch (err) {
      console.warn('[firebase] analytics unavailable:', err);
    }
  }
}

function required<T>(value: T | null, name: string): T {
  if (!value) {
    throw new Error(
      `Firebase ${name} is not initialised — running without real credentials.`,
    );
  }
  return value;
}

export const firebaseApp = () => required(app, 'app');
export const firebaseAuth = () => required(authInstance, 'auth');
export const firebaseDb = () => required(dbInstance, 'firestore');
export const firebaseStorage = () => required(storageInstance, 'storage');
export const firebaseAnalytics = () => required(analyticsInstance, 'analytics');
