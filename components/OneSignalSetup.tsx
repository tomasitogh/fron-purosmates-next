'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import OneSignal from 'react-onesignal';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isLoaded && user && !isInitialized.current) {
      const isAdmin = user.publicMetadata?.role === 'admin';
      if (isAdmin) {
        isInitialized.current = true;
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
        
        if (!appId) {
          console.warn('OneSignal App ID is not configured');
          return;
        }

        OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: {
            scope: '/',
          },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
          notifyButton: {
            enable: false,
          },
        }).then(() => {
          console.log('OneSignal initialized');
          OneSignal.User.addTag('role', 'admin');
        }).catch((err) => {
          console.error('Error initializing OneSignal', err);
        });
      }
    }
  }, [isLoaded, user]);

  return null;
}
