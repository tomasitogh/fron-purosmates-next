'use client';

import { useState, useRef } from 'react';
import {
  Send,
  CheckCircle2,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
  nombre: string;
  empresa: string;
  email: string;
  telefono: string;
  cantidad: string;
  tipoRegalo: string;
  tipoMate: string;
  color: string;
  fotoReferenciaUrl: string;
  conPersonalizado: string; // 'si' | 'no' | ''
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
    tipoMate: '',
    color: '',
    fotoReferenciaUrl: '',
    conPersonalizado: '',
    fechaEntrega: '',
    comentarios: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Reference photo upload state
  const [uploadingRef, setUploadingRef] = useState(false);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [refFileName, setRefFileName] = useState<string>('');
  const refFileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      // "Suela natural" solo existe para el Criollo
      color:
        name === 'tipoMate' && value !== 'Criollo' && prev.color === 'Suela natural'
          ? ''
          : prev.color,
    }));
  };

  const handlePersonalizadoSelect = (value: 'si' | 'no') => {
    setForm((prev) => ({ ...prev, conPersonalizado: value }));
  };

  const handleRefFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande (máximo 15 MB).');
      return;
    }

    setRefFileName(file.name);

    if (file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setRefPreview(objectUrl);
    } else {
      setRefPreview(null);
    }

    setUploadingRef(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/corporate-gifts/upload-logo', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      setForm((prev) => ({ ...prev, fotoReferenciaUrl: data.url }));
      toast.success('¡Foto de referencia subida con éxito!');
    } catch (err: unknown) {
      console.error('Error subiendo foto de referencia:', err);
      toast.error('No se pudo subir la foto. Podés continuar y enviárnosla luego por WhatsApp.');
    } finally {
      setUploadingRef(false);
    }
  };

  const handleRemoveRef = () => {
    setRefPreview(null);
    setRefFileName('');
    setForm((prev) => ({ ...prev, fotoReferenciaUrl: '' }));
    if (refFileInputRef.current) {
      refFileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !form.nombre.trim() ||
      !form.email.trim() ||
      !form.telefono.trim() ||
      !form.empresa.trim() ||
      !form.cantidad.trim() ||
      !form.tipoRegalo.trim() ||
      !form.tipoMate.trim() ||
      !form.color.trim()
    ) {
      toast.error('Por favor completá todos los campos obligatorios marcados con *');
      return;
    }

    if (uploadingRef) {
      toast.error('Esperá a que termine de subirse el archivo');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      ...form,
      conPersonalizado:
        form.conPersonalizado === 'si' ? true : form.conPersonalizado === 'no' ? false : null,
    };

    try {
      const response = await fetch('/api/v1/corporate-gifts/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

        {/* Cantidad estimada (Obligatoria) */}
        <div>
          <label htmlFor="cantidad" className="mb-1 block text-sm font-medium text-gray-700">
            Cantidad estimada *
          </label>
          <select
            id="cantidad"
            name="cantidad"
            required
            value={form.cantidad}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar cantidad *</option>
            <option value="20">20 unidades</option>
            <option value="30">30 unidades</option>
            <option value="40">40 unidades</option>
            <option value="50">50 unidades</option>
            <option value="51-100">51 a 100 unidades</option>
            <option value="100-500">100 a 500 unidades</option>
            <option value="500+">500 o más unidades</option>
          </select>
        </div>

        {/* Tipo de regalo / Kit (Obligatorio) */}
        <div>
          <label htmlFor="tipoRegalo" className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de Producto / Kit de Interés *
          </label>
          <select
            id="tipoRegalo"
            name="tipoRegalo"
            required
            value={form.tipoRegalo}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar producto *</option>
            <option value="Mate">Mate</option>
            <option value="Mate + Bombilla">Mate + Bombilla</option>
            <option value="Mate + Yerbero">Mate + Yerbero</option>
            <option value="Kit Completo (Mate + Bombilla + Yerbero)">
              Kit Completo (Mate + Bombilla + Yerbero)
            </option>
            <option value="Otro">Otro (especificar en comentarios)</option>
          </select>
        </div>

        {/* Tipo de mate (Obligatorio) */}
        <div>
          <label htmlFor="tipoMate" className="mb-1 block text-sm font-medium text-gray-700">
            Modelo de Mate *
          </label>
          <select
            id="tipoMate"
            name="tipoMate"
            required
            value={form.tipoMate}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar modelo de mate *</option>
            <option value="Criollo">Criollo</option>
            <option value="Camionero">Camionero</option>
            <option value="Torpedo">Torpedo</option>
            <option value="Imperial">Imperial</option>
            <option value="A definir / No estoy seguro">A definir / No estoy seguro</option>
          </select>
        </div>

        {/* Color del mate (Obligatorio) */}
        <div>
          <label htmlFor="color" className="mb-1 block text-sm font-medium text-gray-700">
            Color del mate *
          </label>
          <select
            id="color"
            name="color"
            required
            value={form.color}
            onChange={handleChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/30 focus:outline-none"
          >
            <option value="">Seleccionar color *</option>
            <option value="Negro">Negro</option>
            <option value="Marrón">Marrón</option>
            {form.tipoMate === 'Criollo' && <option value="Suela natural">Suela natural</option>}
          </select>
        </div>

        {/* Foto o modelo de referencia */}
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-4 transition-colors hover:border-[#254642]/50 sm:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-800">
              ¿Tenés una foto o modelo de referencia?
            </label>
            <span className="text-xs text-gray-400">Opcional</span>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Si viste un mate que te gustó en nuestras redes o tenés una foto del modelo que querés,
            adjuntala acá para que sepamos exactamente qué buscás.
          </p>

          <input
            type="file"
            ref={refFileInputRef}
            onChange={handleRefFileChange}
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,application/pdf"
            className="hidden"
          />

          {!refPreview && !form.fotoReferenciaUrl && !uploadingRef && (
            <button
              type="button"
              onClick={() => refFileInputRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:border-[#D4AF37] hover:bg-[#F5F2E9]/40"
            >
              <Upload className="h-4 w-4 text-[#254642]" />
              Adjuntar foto o modelo de referencia
            </button>
          )}

          {uploadingRef && (
            <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin text-[#254642]" />
              <span>Subiendo foto de referencia...</span>
            </div>
          )}

          {(refPreview || form.fotoReferenciaUrl) && !uploadingRef && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-2.5">
              <div className="flex min-w-0 items-center gap-3">
                {refPreview ? (
                  <img
                    src={refPreview}
                    alt="Foto de referencia"
                    className="h-12 w-12 rounded border border-gray-200 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-gray-50 text-[#254642]">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-gray-800">
                    {refFileName || 'Foto de referencia adjunta'}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Foto adjuntada con éxito
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => refFileInputRef.current?.click()}
                  className="rounded px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveRef}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  title="Eliminar foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fecha de entrega requerida */}
        <div className="sm:col-span-2">
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

      {/* Pregunta sobre Personalización */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-[#F5F2E9]/50 p-5">
        <label className="mb-2 block text-sm font-semibold text-[#254642]">
          ¿Querés los productos personalizados con el logo grabado de tu empresa?
        </label>
        <p className="mb-3 text-xs text-gray-500">
          Grabado láser de alta precisión en virola o cuero con el logo o frase corporativa.
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handlePersonalizadoSelect('si')}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
              form.conPersonalizado === 'si'
                ? 'border-[#254642] bg-[#254642] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 ${form.conPersonalizado === 'si' ? 'text-[#D4AF37]' : 'text-gray-400'}`}
            />
            Sí, quiero personalizarlo
          </button>

          <button
            type="button"
            onClick={() => handlePersonalizadoSelect('no')}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm font-medium transition-all ${
              form.conPersonalizado === 'no'
                ? 'border-[#254642] bg-[#254642] text-white shadow-sm'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
            }`}
          >
            No, mates lisos (sin grabado)
          </button>
        </div>

        {/* Si eligió "Sí": lo mandamos a diseñar en el personalizador */}
        {form.conPersonalizado === 'si' && (
          <div className="mt-5">
            <a
              href="/customize"
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2.5 rounded-lg border-2 border-[#D4AF37] bg-white px-4 py-3.5 text-center font-bold text-[#254642] shadow-sm transition hover:bg-[#D4AF37] hover:text-[#254642]"
            >
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              <span className="text-base">Personalizá tu mate acá</span>
              <ExternalLink className="h-4 w-4 text-gray-500" />
            </a>
            <p className="mt-2 text-center text-xs text-gray-500">
              Se abre en una pestaña nueva, así no perdés lo que ya completaste.
            </p>
          </div>
        )}
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
          disabled={isSubmitting || uploadingRef}
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
