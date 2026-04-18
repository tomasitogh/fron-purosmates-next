'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { Save, Upload, Plus, Trash2, Star, Image as ImageIcon, MessageSquare } from 'lucide-react';

interface Banner {
  src: string;
  alt: string;
  caption?: string;
}

interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

interface HomeConfig {
  banners: Banner[];
  categories: {
    mate: string;
    bombilla: string;
    accesorios: string;
    [key: string]: string;
  };
  testimonials: Testimonial[];
}

export default function AjustesPage() {
  const [config, setConfig] = useState<HomeConfig>({ 
    banners: [], 
    categories: { mate: '', bombilla: '', accesorios: '' },
    testimonials: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/home-config')
      .then((res) => res.json())
      .then((data) => {
        setConfig(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Error al cargar la configuración');
        setLoading(false);
      });
  }, []);

  const openCloudinaryWidget = (callback: (url: string) => void) => {
    if (typeof window === 'undefined' || !(window as any).cloudinary) {
      toast.error('Cloudinary no está cargado. Recarga la página.');
      return;
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

    if (!cloudName || !apiKey) {
      toast.error('Faltan configuraciones de Cloudinary (Cloud Name o API Key)');
      return;
    }

    const widget = (window as any).cloudinary.createUploadWidget(
      {
        cloudName,
        apiKey,
        uploadPreset,
        uploadSignature: async (callback: any, paramsToSign: any) => {
          try {
            const res = await fetch('/api/cloudinary/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ paramsToSign }),
            });
            const data = await res.json();
            callback(data.signature);
          } catch (err) {
            console.error('Error getting signature:', err);
          }
        },
        multiple: false,
        resourceType: 'image',
        cropping: true,
        croppingAspectRatio: 1.77,
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          callback(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/home-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success('Configuración guardada correctamente');
      } else {
        toast.error('Error al guardar la configuración');
      }
    } catch (err) {
      toast.error('Ocurrió un error');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerChange = (idx: number, field: keyof Banner, value: string) => {
    const newBanners = [...config.banners];
    newBanners[idx] = { ...newBanners[idx], [field]: value };
    setConfig({ ...config, banners: newBanners });
  };

  const handleCategoryChange = (key: string, value: string) => {
    setConfig({
      ...config,
      categories: { ...config.categories, [key]: value },
    });
  };

  const addTestimonial = () => {
    setConfig({
      ...config,
      testimonials: [...(config.testimonials || []), { name: '', text: '', rating: 5 }]
    });
  };

  const removeTestimonial = (idx: number) => {
    const newTestimonials = [...config.testimonials];
    newTestimonials.splice(idx, 1);
    setConfig({ ...config, testimonials: newTestimonials });
  };

  const handleTestimonialChange = (idx: number, field: keyof Testimonial, value: string | number) => {
    const newTestimonials = [...config.testimonials];
    newTestimonials[idx] = { ...newTestimonials[idx], [field]: value };
    setConfig({ ...config, testimonials: newTestimonials });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#254642]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Ajustes de la Tienda</h1>
            <p className="mt-2 text-sm text-gray-600">Personaliza la apariencia y el contenido de tu página de inicio.</p>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-sm text-white bg-[#254642] hover:bg-[#1a3230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#254642] transition-all disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center">
                <Save className="w-5 h-5 mr-2" />
                Guardar Cambios
              </span>
            )}
          </button>
        </div>

        <div className="space-y-12">
          {/* Banners */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Banners del Carrusel</h2>
            </div>
            <div className="p-6 space-y-8">
              {config.banners?.map((banner, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row gap-8 items-start p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all">
                  <div className="w-full md:w-2/5 shrink-0">
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner">
                      {banner.src ? (
                        <img src={banner.src} alt="Banner" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                          <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-xs font-medium uppercase tracking-widest">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openCloudinaryWidget((url) => handleBannerChange(idx, 'src', url))}
                      className="mt-4 w-full flex items-center justify-center px-4 py-2 border border-[#254642] text-[#254642] rounded-lg text-sm font-bold hover:bg-[#254642] hover:text-white transition-all gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      SUBIR IMAGEN
                    </button>
                  </div>
                  <div className="w-full md:w-3/5 space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Título / Texto Alt</label>
                      <input
                        type="text"
                        placeholder="Ej: Oferta de Invierno"
                        value={banner.alt || ''}
                        onChange={(e) => handleBannerChange(idx, 'alt', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#254642] focus:border-transparent transition-all outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Texto en Banner</label>
                      <input
                        type="text"
                        placeholder="Ej: Compra tu primer mate con 20% OFF"
                        value={banner.caption || ''}
                        onChange={(e) => handleBannerChange(idx, 'caption', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#254642] focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Categorías */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Imágenes de Categorías</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {['mate', 'bombilla', 'accesorios'].map((cat) => (
                <div key={cat} className="p-4 rounded-2xl border border-gray-100 hover:bg-gray-50 transition-all text-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{cat}</p>
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 mb-4 shadow-inner">
                    {config.categories?.[cat] ? (
                      <img src={config.categories[cat]} alt={cat} className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                        <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                        <span className="text-xs">VACÍO</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => openCloudinaryWidget((url) => handleCategoryChange(cat, url))}
                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all gap-2"
                  >
                    CAMBIAR
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Testimonios */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#254642]" />
                <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Testimonios</h2>
              </div>
              <button
                onClick={addTestimonial}
                className="inline-flex items-center px-3 py-1.5 border border-[#254642] text-xs font-bold rounded-lg text-[#254642] hover:bg-[#254642] hover:text-white transition-all"
              >
                <Plus className="w-4 h-4 mr-1" />
                AGREGAR
              </button>
            </div>
            <div className="p-6 space-y-6">
              {config.testimonials?.map((t, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-gray-100 bg-white shadow-sm relative group">
                  <button
                    onClick={() => removeTestimonial(idx)}
                    className="absolute top-4 right-4 p-2 text-red-400 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Nombre</label>
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#254642] focus:border-transparent outline-none text-sm"
                      />
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Estrellas</label>
                        <select
                          value={t.rating}
                          onChange={(e) => handleTestimonialChange(idx, 'rating', parseInt(e.target.value))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#254642] focus:border-transparent outline-none text-sm bg-white"
                        >
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrellas</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comentario</label>
                      <textarea
                        value={t.text}
                        rows={4}
                        onChange={(e) => handleTestimonialChange(idx, 'text', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#254642] focus:border-transparent outline-none text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!config.testimonials || config.testimonials.length === 0) && (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-gray-400 text-sm font-medium">No hay testimonios agregados.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

