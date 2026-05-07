'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { Bell, MessageSquare, Plus, Trash2 } from 'lucide-react';
import HomeEditor from '@/components/HomeEditor';
import OneSignal from 'react-onesignal';

export default function SettingsTab() {
  const { user, isLoaded } = useUser();
  const [testimonials, setTestimonials] = useState<{ name: string; text: string; rating: number }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showTestimonials, setShowTestimonials] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (isLoaded && user) {
      fetch('/api/home-config')
        .then(r => r.json())
        .then(data => setTestimonials(data.testimonials || []))
        .finally(() => setLoading(false));
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const checkSubscription = async () => {
      setCheckingSubscription(true);
      try {
        const isSubscribed = await OneSignal.Notifications.getPermissionStatusAsync();
        if (isSubscribed === 'granted') {
          setNotificationsEnabled(true);
        }
      } catch (e) {
        console.log('OneSignal not initialized yet');
      } finally {
        setCheckingSubscription(false);
      }
    };
    checkSubscription();
  }, [isLoaded]);

  const handleTestimonialChange = (idx: number, field: string, value: any) => {
    const newT = [...testimonials];
    newT[idx] = { ...newT[idx], [field]: value };
    setTestimonials(newT);
  };

  const addTestimonial = () => setTestimonials([...testimonials, { name: '', text: '', rating: 5 }]);
  const removeTestimonial = (idx: number) => setTestimonials(testimonials.filter((_, i) => i !== idx));

  const saveTestimonials = async () => {
    setSaving(true);
    try {
      await fetch('/api/home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testimonials }),
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      try {
        await OneSignal.Notifications.requestPermission();
        const playerId = await OneSignal.getPlayerId();
        console.log('OneSignal Player ID:', playerId);
        if (playerId) {
          await fetch('/api/v1/admin/onesignal-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId }),
          });
        }
        setNotificationsEnabled(true);
      } catch (e) {
        console.error('Error enabling notifications:', e);
      }
    } else {
      await OneSignal.setSubscription(false);
      setNotificationsEnabled(false);
    }
  };

  if (!isLoaded || loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-2 border-[#254642]"></div></div>;

  return (
    <div className="space-y-6">
      <HomeEditor />

      {/* Testimonios */}
      <section className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#254642]" />
            <h3 className="font-bold">Testimonios de Clientes</h3>
          </div>
          <button onClick={() => setShowTestimonials(!showTestimonials)} className="text-sm text-[#254642] font-medium hover:underline">
            {showTestimonials ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {showTestimonials && (
          <div className="p-4 space-y-3">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex-1 w-full space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Nombre del Cliente</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={e => handleTestimonialChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#254642]/20 focus:border-[#254642] outline-none transition-all"
                          placeholder="Ej: Juan P."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Calificación (Estrellas)</label>
                        <select
                          value={t.rating}
                          onChange={e => handleTestimonialChange(idx, 'rating', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#254642]/20 focus:border-[#254642] outline-none transition-all bg-white"
                        >
                          {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Estrella' : 'Estrellas'}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Comentario</label>
                      <textarea
                        value={t.text}
                        rows={3}
                        onChange={e => handleTestimonialChange(idx, 'text', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#254642]/20 focus:border-[#254642] outline-none transition-all resize-none"
                        placeholder="Escribe el testimonio aquí..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => removeTestimonial(idx)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors md:self-start"
                    title="Eliminar testimonio"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button onClick={addTestimonial} className="px-3 py-1.5 border border-[#254642] text-[#254642] rounded text-sm">+ Agregar</button>
              {testimonials.length > 0 && <button onClick={saveTestimonials} disabled={saving} className="px-3 py-1.5 bg-[#254642] text-white rounded text-sm">{saving ? '...' : 'Guardar'}</button>}
            </div>
          </div>
        )}
      </section>

      {/* Notificaciones */}
      <section className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b"><h3 className="font-bold">Notificaciones Push</h3></div>
        <div className="p-4 flex justify-between items-center">
          <div>
            <h4 className="font-medium">Alertas de nuevas ventas</h4>
            <p className="text-xs text-gray-500">Recibir notificaciones cuando se realice una venta</p>
          </div>
          <button 
            onClick={toggleNotifications} 
            disabled={checkingSubscription}
            className={`px-3 py-1.5 rounded text-sm ${notificationsEnabled ? 'bg-red-100 text-red-700' : 'bg-[#254642] text-white'} ${checkingSubscription ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {checkingSubscription ? '...' : notificationsEnabled ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </section>
    </div>
  );
}