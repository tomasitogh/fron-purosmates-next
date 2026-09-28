'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getMessaging, isSupported, Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

export const getFirebaseApp = (): FirebaseApp | null => {
  if (typeof window === 'undefined') return null;
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    console.warn('[FCM Client] NEXT_PUBLIC_FIREBASE_API_KEY is not configured');
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
};

export const getFirebaseMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === 'undefined') return null;

  if (messagingPromise) return messagingPromise;

  messagingPromise = (async () => {
    try {
      const supported = await isSupported();
      if (!supported) {
        console.warn(
          '[FCM Client] Firebase Messaging is not supported in this browser environment'
        );
        return null;
      }
      const firebaseApp = getFirebaseApp();
      if (!firebaseApp) return null;
      return getMessaging(firebaseApp);
    } catch (err) {
      console.error('[FCM Client] Error initializing messaging:', err);
      return null;
    }
  })();

  return messagingPromise;
};

export const getVapidKey = (): string => {
  return process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '';
};
