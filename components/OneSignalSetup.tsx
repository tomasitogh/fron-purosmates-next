'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

const ONESIGNAL_APP_ID = '19f32369-e546-4917-8ae4-925ed7be4980';
const SAFARI_WEB_ID = 'web.onesignal.auto.201c9c11-2835-4563-82b9-55a6f9094e87';

export default function OneSignalSetup() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const role = (user.publicMetadata?.role as string) || '';
    const isAdmin = role.toUpperCase() === 'ADMIN';

    console.log('[OneSignalSetup] User role check:', isAdmin, 'role:', role);

    if (!isAdmin) return;

    const win = window as any;

    if (win.__oneSignalSetupDone) return;
    win.__oneSignalSetupDone = true;

    console.log('[OneSignalSetup] Setting up OneSignalDeferred...');

    win.OneSignalDeferred = win.OneSignalDeferred || [];

    const deferredPush = async (OneSignal: any) => {
      console.log('[OneSignalSetup] OneSignal deferred callback executed');

      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          safari_web_id: SAFARI_WEB_ID,
          allowLocalhostAsSecureOrigin: win.location.hostname === 'localhost',
        });
        console.log('[OneSignalSetup] ✅ OneSignal initialized successfully');
      } catch (err: any) {
        // SDK ya inicializado (re-mount, doble init): no es fatal.
        console.warn('[OneSignalSetup] OneSignal init skipped:', err);
      }

      try {
        await OneSignal.User.addTag('role', 'admin');
        console.log('[OneSignalSetup] Admin tag added');
      } catch (err: any) {
        console.error('[OneSignalSetup] Error adding admin tag:', err);
      }
    };

    win.OneSignalDeferred.push(deferredPush);
  }, [isLoaded, user]);

  return null;
}
