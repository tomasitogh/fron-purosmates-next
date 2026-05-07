'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const ONESIGNAL_APP_ID = '19f32369-e546-4917-8ae4-925ed7be4980';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = (user.publicMetadata?.role as string) || '';
    const isAdmin = role.toUpperCase() === 'ADMIN';
    
    console.log('[OneSignalSetup] User role check:', isAdmin, 'role:', role, 'metadata:', user.publicMetadata);

    if (isAdmin && !isInitialized.current) {
      console.log('[OneSignalSetup] Starting initialization...');
      isInitialized.current = true;

      console.log('[OneSignalSetup] App ID:', ONESIGNAL_APP_ID);

      import('react-onesignal').then((OneSignalModule) => {
        const OneSignal = OneSignalModule.default;
        console.log('[OneSignalSetup] OneSignal module loaded:', typeof OneSignal);
        
        OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: {
            scope: '/',
          },
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        }).then(() => {
          console.log('[OneSignalSetup] ✅ OneSignal initialized successfully');
          OneSignal.User.addTag('role', 'admin');
          console.log('[OneSignalSetup] Admin tag added');
        }).catch((err) => {
          console.error('[OneSignalSetup] Error initializing OneSignal:', err);
        });
      }).catch(err => {
        console.error('[OneSignalSetup] Failed to load OneSignal SDK:', err);
      });
    }
  }, [isLoaded, user]);

  return null;
}
