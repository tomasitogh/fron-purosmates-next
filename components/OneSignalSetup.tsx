'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

const ONESIGNAL_APP_ID = '19f32369-e546-4917-8ae4-925ed7be4980';
const SAFARI_WEB_ID = 'web.onesignal.auto.201c9c11-2835-4563-82b9-55a6f9094e87';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = (user.publicMetadata?.role as string) || '';
    const isAdmin = role.toUpperCase() === 'ADMIN';

    console.log('[OneSignalSetup] User role check:', isAdmin, 'role:', role);

    if (isAdmin && !isInitialized.current) {
      isInitialized.current = true;

      console.log('[OneSignalSetup] Setting up OneSignalDeferred...');

      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];

      const deferredPush = async (OneSignal: any) => {
        console.log('[OneSignalSetup] OneSignal deferred callback executed');

        try {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            safari_web_id: SAFARI_WEB_ID,
            allowLocalhostAsSecureOrigin:
              typeof window !== 'undefined' && window.location.hostname === 'localhost',
          });

          console.log('[OneSignalSetup] ✅ OneSignal initialized successfully');

          await OneSignal.User.addTag('role', 'admin');
          console.log('[OneSignalSetup] Admin tag added');
        } catch (err: any) {
          console.error('[OneSignalSetup] Error initializing OneSignal:', err);
        }
      };

      (window as any).OneSignalDeferred.push(deferredPush);
    }
  }, [isLoaded, user]);

  return null;
}
