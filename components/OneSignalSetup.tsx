'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();
  const isInitialized = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const adminRole = user.publicMetadata?.role === 'admin';
      setIsAdmin(adminRole);
      console.log('User role check:', user.publicMetadata);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user && isAdmin && !isInitialized.current) {
      isInitialized.current = true;
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
      
      if (!appId) {
        console.warn('OneSignal App ID is not configured');
        return;
      }

      // Dynamic import to ensure SDK is loaded
      import('react-onesignal').then((OneSignalModule) => {
        const OneSignal = OneSignalModule.default;
        
        OneSignal.init({
          appId: appId,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: {
            scope: '/',
          },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        }).then(() => {
          console.log('OneSignal initialized successfully');
          OneSignal.User.addTag('role', 'admin');
        }).catch((err) => {
          console.error('Error initializing OneSignal:', err);
        });
      }).catch(err => {
        console.error('Failed to load OneSignal SDK:', err);
      });
    }
  }, [isLoaded, user, isAdmin]);

  return null;
}
