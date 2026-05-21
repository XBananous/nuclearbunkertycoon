/// <reference types="vite/client" />
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

// @ts-ignore
import firebaseConfigDefault from '../../firebase-applet-config.json';

const hasCustomEnv = !!import.meta.env.VITE_FIREBASE_API_KEY;

const firebaseConfig = hasCustomEnv ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "(default)"
} : {
  apiKey: firebaseConfigDefault.apiKey,
  authDomain: firebaseConfigDefault.authDomain,
  projectId: firebaseConfigDefault.projectId,
  storageBucket: firebaseConfigDefault.storageBucket,
  messagingSenderId: firebaseConfigDefault.messagingSenderId,
  appId: firebaseConfigDefault.appId,
  measurementId: firebaseConfigDefault.measurementId,
  firestoreDatabaseId: firebaseConfigDefault.firestoreDatabaseId
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Test de connexion initiale comme requis par les directives
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Connexion Firestore hors-ligne: vérifiez vos configurations Firebase.");
    }
  }
}
testConnection();

