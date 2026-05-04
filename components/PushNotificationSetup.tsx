'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const POLL_INTERVAL = 15000;

export default function PushNotificationSetup() {
  const { user, isLoaded } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lastOrderId = useRef<number>(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && user) {
      const isAdmin = user?.publicMetadata?.role === 'admin';
      if (isAdmin) {
        startPolling();
      }
    }

    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
      }
    };
  }, [isLoaded, user]);

  const startPolling = async () => {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setIsSubscribed(true);
      poll();
    } else {
      setIsSubscribed(false);
      if (permission === 'default') {
        toast.success('Activa notificaciones para recibir alertas', { duration: 5000 });
      }
    }
  };

  const poll = async () => {
    try {
      const response = await axios.get('/api/v1/orders/latest');
      const data = response.data;
      
      if (data?.id && data.id > lastOrderId.current) {
        showNotification(data.id, data.total);
        lastOrderId.current = data.id;
      }
    } catch (error) {
      // Silently continue polling
    }

    pollingRef.current = setTimeout(poll, POLL_INTERVAL);
  };

  const showNotification = (orderId: number, total: number) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Nueva venta en Puros Mates', {
        body: `Pedido #${orderId} - $${total?.toLocaleString('es-AR')}`,
        icon: '/logo-purosmates.png',
        tag: 'new-sale'
      });
    } else {
      toast.success(`Nueva venta #${orderId}`, { duration: 4000 });
    }
  };

  if (!isLoaded || !user) return null;

  const isAdmin = user?.publicMetadata?.role === 'admin';
  if (!isAdmin) return null;

  return (
    <button
      onClick={startPolling}
      className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition flex items-center gap-2 ${
        isSubscribed 
          ? 'bg-green-600 text-white hover:bg-green-700' 
          : 'bg-[#254642] text-white hover:bg-[#1d3530]'
      }`}
      title={isSubscribed ? 'Polling activo cada 15s' : 'Activar notificaciones'}
    >
      <Bell className="w-5 h-5" />
      <span className="text-sm">{isSubscribed ? 'Alertas ON' : 'Activar alertas'}</span>
    </button>
  );
}