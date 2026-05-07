'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();
  const isInitialized = useRef(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      const role = user.publicMetadata?.role as string || '';
      const adminRole = role.toUpperCase() === 'ADMIN';
      setIsAdmin(adminRole);
      console.log('[OneSignalSetup] User role check:', adminRole, 'role:', role, 'metadata:', user.publicMetadata);
    }
  }, [isLoaded, user]);

  useEffect(() => {
    if (isLoaded && user && isAdmin && !isInitialized.current) {
      console.log('[OneSignalSetup] Starting initialization...');
      isInitialized.current = true;
      const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';
      
      if (!appId) {
        console.warn('[OneSignalSetup] OneSignal App ID is not configured');
        return;
      }

      console.log('[OneSignalSetup] App ID:', appId);

      // Dynamic import to ensure SDK is loaded
      import('react-onesignal').then((OneSignalModule) => {
        const OneSignal = OneSignalModule.default;
        console.log('[OneSignalSetup] OneSignal module loaded:', typeof OneSignal);
        
        OneSignal.init({
          appId: appId,
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
    } else {
      console.log('[OneSignalSetup] Skipping initialization - isAdmin:', isAdmin, 'isLoaded:', isLoaded);
    }
  }, [isLoaded, user, isAdmin]);

  return null;
}
