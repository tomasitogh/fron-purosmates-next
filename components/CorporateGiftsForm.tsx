'use client';

import { useState } from 'react';
import { Send, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  cantidad: string;
  tipoRegalo: string;
  fechaEntrega: string;
  comentarios: string;
}

export default function CorporateGiftsForm() {
  const [form, setForm] = useState<FormData>({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    cantidad: '',
    tipoRegalo: '',
    fechaEntrega: '',
    comentarios: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.nombre.trim() ||
      !form.email.trim() ||
      !form.telefono.trim() ||
      !form.empresa.trim()
    ) {
      toast.error('Completá todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/v1/corporate-gifts/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error('Error al enviar la consulta');
      }

      setIsSubmitted(true);
      toast.success('¡Consulta enviada! Te contactamos pronto.');
    } catch {
      toast.error('Hubo un error. Intentá nuevamente o escribinos por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-2xl bg-white p-10 text-center shadow-xl">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-[#254642]" />
        <h3 className="mb-2 text-2xl font-bold text-[#254642]">¡Gracias, {form.nombre}!</h3>
        <p className="mb-6 text-gray-600">
          Recibimos tu consulta. Te enviamos un presupuesto personalizado a{' '}
          <strong>{form.email}</strong> en menos de 24 horas.
        </p>
        <a
          href="https://wa.me/5491130548207?text=Hola!%20Quiero%20información%20sobre%20regalos%20empresariales"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg bg-[#25D366] px-6 py-3 font-semibold text-white transition-all hover:bg-[#20ba5a]"
        >
          ¿Tenés urgencia? Escribinos por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Nombre */}
        <div>
          <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-gray-700">
            Nombre y Apellido *
          </label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            required
            value={form.nombre}
            onChange={handleChange}
            placeholder="Juan Pérez"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
            Email Corporativo / Contacto *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            placeholder="juan@miempresa.com"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>

        {/* Teléfono */}
        <div>
          <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-gray-700">
            Teléfono / WhatsApp *
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            required
            value={form.telefono}
            onChange={handleChange}
            placeholder="11 3054 8207"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>

        {/* Empresa */}
        <div>
          <label htmlFor="empresa" className="mb-1 block text-sm font-medium text-gray-700">
            Empresa / Razón Social *
          </label>
          <input
            type="text"
            id="empresa"
            name="empresa"
            required
            value={form.empresa}
            onChange={handleChange}
            placeholder="Mi Empresa S.A."
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>

        {/* Cantidad */}
        <div>
          <label htmlFor="cantidad" className="mb-1 block text-sm font-medium text-gray-700">
            Cantidad estimada
          </label>
          <select
            id="cantidad"
            name="cantidad"
            value={form.cantidad}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="50">50 unidades</option>
            <option value="51-100">51 a 100 unidades</option>
            <option value="100+">100 o más unidades</option>
          </select>
        </div>

        {/* Tipo de regalo */}
        <div>
          <label htmlFor="tipoRegalo" className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de Producto / Kit de Interés
          </label>
          <select
            id="tipoRegalo"
            name="tipoRegalo"
            value={form.tipoRegalo}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar...</option>
            <option value="mate-bombilla">Mate + Bombilla</option>
            <option value="mate-yerbero">Mate + Yerbero</option>
            <option value="mate-solo">Mate solo</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Fecha de entrega requerida */}
        <div>
          <label htmlFor="fechaEntrega" className="mb-1 block text-sm font-medium text-gray-700">
            Fecha requerida de entrega
          </label>
          <input
            type="date"
            id="fechaEntrega"
            name="fechaEntrega"
            value={form.fechaEntrega}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Comentarios */}
      <div className="mt-5">
        <label htmlFor="comentarios" className="mb-1 block text-sm font-medium text-gray-700">
          Comentarios / Detalles del pedido
        </label>
        <textarea
          id="comentarios"
          name="comentarios"
          rows={4}
          value={form.comentarios}
          onChange={handleChange}
          placeholder="Ej: Queremos regalar 30 mates para la inauguración de nuestra nueva sucursal. Nos gustaría que tengan el logo de la empresa y los colores corporativos..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
        />
      </div>

      {/* Submit */}
      <div className="mt-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D4AF37] px-6 py-3 text-base font-semibold text-[#254642] transition-all hover:bg-[#DAA520] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Enviar Solicitud de Presupuesto
            </>
          )}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">
          Te respondemos en menos de 24 horas hábiles. Sin spam, lo prometemos.
        </p>
      </div>
    </form>
  );
}
