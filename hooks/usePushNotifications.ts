'use client';

import { useState, useEffect, useCallback } from 'react';
import { getToken, deleteToken } from 'firebase/messaging';
import { getFirebaseMessaging, getVapidKey } from '@/lib/firebase/client';
import toast from 'react-hot-toast';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Detectar información amigable del dispositivo
  const getDeviceInfo = (): string => {
    if (typeof window === 'undefined') return 'Desconocido';
    const ua = navigator.userAgent;
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    let device = 'Desktop';
    if (/iPad|iPhone|iPod/.test(ua)) device = isStandalone ? 'iPhone (PWA)' : 'iPhone (Safari)';
    else if (/Android/.test(ua)) device = isStandalone ? 'Android (PWA)' : 'Android (Browser)';
    else if (/Macintosh/.test(ua)) device = 'Mac';
    else if (/Windows/.test(ua)) device = 'Windows';

    return `${device} - ${new Date().toLocaleDateString('es-AR')}`;
  };

  // Registrar el Service Worker con los query params de configuración
  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
    const senderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '';
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';

    const swUrl = `/sw.js?apiKey=${encodeURIComponent(apiKey)}&projectId=${encodeURIComponent(projectId)}&messagingSenderId=${encodeURIComponent(senderId)}&appId=${encodeURIComponent(appId)}`;

    try {
      const registration = await navigator.serviceWorker.register(swUrl, { scope: '/' });
      await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      console.error('[FCM] Error al registrar service worker:', err);
      return null;
    }
  };

  // Inicializar estado en el cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasNotification = 'Notification' in window;
    const hasSW = 'serviceWorker' in navigator;
    const supported = hasNotification && hasSW;

    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);
      const savedToken = localStorage.getItem('fcm_admin_token');
      if (savedToken && Notification.permission === 'granted') {
        setIsSubscribed(true);
      }
    }

    setLoading(false);
  }, []);

  // Función para suscribir el dispositivo
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error(
        'Tu navegador no soporta notificaciones push. En iPhone, agregá la web a la Pantalla de Inicio (PWA).'
      );
      return false;
    }

    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isStandalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      toast.error(
        'En iPhone, tenés que abrir la app desde el icono en la Pantalla de Inicio (PWA) para activar notificaciones.'
      );
      return false;
    }

    if (Notification.permission === 'denied') {
      toast.error(
        'Las notificaciones están bloqueadas en tu dispositivo. Habilitalas desde Ajustes > Notificaciones.'
      );
      return false;
    }

    // 1. SOLICITUD NATIVA DE PERMISO EN EL PRIMER FRAME DEL CLICK
    let permResult: NotificationPermission = Notification.permission;
    if (permResult === 'default') {
      try {
        permResult = await Notification.requestPermission();
      } catch (err) {
        console.error('[FCM] Error solicitando permiso:', err);
        toast.error('Error al solicitar permiso nativo en el dispositivo.');
        return false;
      }
    }

    setPermission(permResult);

    if (permResult !== 'granted') {
      toast.error('No se concedieron permisos de notificación.');
      return false;
    }

    setLoading(true);

    try {
      // 2. Registrar Service Worker
      const registration = await registerServiceWorker();
      if (!registration) {
        throw new Error('No se pudo registrar el Service Worker.');
      }

      // 3. Inicializar Messaging y obtener Token
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        throw new Error('Firebase Messaging no está disponible.');
      }

      const vapidKey = getVapidKey();
      if (!vapidKey) {
        throw new Error('Falta configurar NEXT_PUBLIC_FIREBASE_VAPID_KEY.');
      }

      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (!token) {
        throw new Error('No se pudo generar el token FCM.');
      }

      // 4. Enviar token al backend de Spring Boot (MySQL privado en Railway) y a Next.js
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const tokenBackend = await (window as any).Clerk?.session?.getToken?.();
      const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (tokenBackend) {
        authHeaders['Authorization'] = `Bearer ${tokenBackend}`;
      }

      await fetch(`${baseUrl}/api/v1/admin/fcm-token`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          token,
          deviceInfo: getDeviceInfo(),
        }),
      }).catch((e) => console.warn('Error guardando token en Spring Boot:', e));

      // Guardar también en Next.js (si Prisma está conectado)
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          deviceInfo: getDeviceInfo(),
        }),
      }).catch((e) => console.warn('Error guardando token en Next.js:', e));

      localStorage.setItem('fcm_admin_token', token);
      setIsSubscribed(true);
      toast.success('¡Notificaciones activadas con éxito en este dispositivo!');
      return true;
    } catch (err: any) {
      console.error('[FCM] Error al suscribir:', err);
      toast.error(err.message || 'Error al activar notificaciones');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para desuscribir el dispositivo
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const savedToken = localStorage.getItem('fcm_admin_token');

      if (savedToken) {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
        const tokenBackend = await (window as any).Clerk?.session?.getToken?.();
        const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (tokenBackend) {
          authHeaders['Authorization'] = `Bearer ${tokenBackend}`;
        }

        await fetch(`${baseUrl}/api/v1/admin/fcm-token`, {
          method: 'DELETE',
          headers: authHeaders,
          body: JSON.stringify({ token: savedToken }),
        }).catch((e) => console.warn('Error eliminando token en Spring Boot:', e));

        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: savedToken }),
        }).catch((e) => console.warn('Error en unsubscribe backend:', e));

        const messaging = await getFirebaseMessaging();
        if (messaging) {
          await deleteToken(messaging).catch(() => {});
        }

        localStorage.removeItem('fcm_admin_token');
      }

      setIsSubscribed(false);
      toast.success('Notificaciones desactivadas en este dispositivo.');
      return true;
    } catch (err: any) {
      console.error('[FCM] Error al desuscribir:', err);
      toast.error('Error al desactivar notificaciones');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    loading,
    subscribe,
    unsubscribe,
  };
}
