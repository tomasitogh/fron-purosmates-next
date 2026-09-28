import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Messaging } from 'firebase-admin/messaging';

const initFirebaseAdmin = (): App | null => {
  if (getApps().length > 0) {
    return getApp();
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn('[FCM Admin] Missing Firebase Admin credentials in environment variables');
    return null;
  }

  // Soporta claves privadas con escapes de saltos de línea (típico en Vercel, Railway, .env)
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('[FCM Admin] Error initializing Firebase Admin SDK:', error);
    return null;
  }
};

export const getFirebaseAdminApp = () => initFirebaseAdmin();

export const getAdminMessaging = (): Messaging | null => {
  const app = initFirebaseAdmin();
  return app ? getMessaging(app) : null;
};
