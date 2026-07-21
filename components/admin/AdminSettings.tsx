'use client';

import { useEffect, useState, useRef } from 'react';
import { Trash2, MessageSquare, Bell, Image as ImageIcon, Filter, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllBanners, getAllHomeImages, getTestimonials, getAllCategories, createTestimonial, updateTestimonial, deleteTestimonial, Banner, HomeImage, Testimonial } from '@/lib/actions/home.actions';
import { revalidateStorefront } from '@/lib/actions/revalidate.actions';
import { TokenGetter, requireFreshToken } from '@/lib/apiClient';
import SingleImageUploader from './SingleImageUploader';

interface ProductCategory {
  id: number;
  description: string;
  active: boolean;
  displayOrder?: number;
}

interface AdminSettingsProps {
  getToken: TokenGetter;
}

export default function AdminSettings({ getToken }: AdminSettingsProps) {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeImages, setHomeImages] = useState<HomeImage[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bannerToEdit, setBannerToEdit] = useState<Banner | null>(null);
  const [homeImageToEdit, setHomeImageToEdit] = useState<HomeImage | null>(null);
  const [categoryToEdit, setCategoryToEdit] = useState<ProductCategory | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'banner' | 'homeImage' | 'category'>('banner');
  const [formData, setFormData] = useState({ altText: '', link: '', description: '', active: true });
  const [uploadedImage, setUploadedImage] = useState('');
  const [orderDraft, setOrderDraft] = useState<Record<number, number>>({});
  const [savingOrder, setSavingOrder] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    const init = async () => {
      try {
        const [bannersData, homeData, testimonialsData, catsData] = await Promise.all([
          getAllBanners(),
          getAllHomeImages(),
          getTestimonials(),
          getAllCategories()
        ]);
        
        setBanners(bannersData);
        setHomeImages(homeData);
        setTestimonials(testimonialsData);
        setCategories(catsData);
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openModal = (type: 'banner' | 'homeImage' | 'category', item?: any) => {
    setModalType(type);
    setUploadedImage('');
    
    if (type === 'banner' && item) {
      setBannerToEdit(item);
      setFormData({ altText: item.altText || '', link: item.link || '', description: '', active: item.active });
      setUploadedImage(item.imageUrl);
    } else if (type === 'homeImage' && item) {
      setHomeImageToEdit(item);
      setFormData({ altText: '', link: item.link || '', description: item.title || '', active: item.active });
      setUploadedImage(item.imageUrl);
    } else if (type === 'category' && item) {
      setCategoryToEdit(item);
      setFormData({ altText: '', link: '', description: item.description || '', active: item.active });
    } else {
      setBannerToEdit(null);
      setHomeImageToEdit(null);
      setCategoryToEdit(null);
      setFormData({ altText: '', link: '', description: '', active: true });
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBannerToEdit(null);
    setHomeImageToEdit(null);
    setCategoryToEdit(null);
  };

  const revalidate = (paths: string[]) =>
    revalidateStorefront(paths).catch((e) => console.error('Error revalidating:', e));

  const handleOrderChange = (id: number, value: string) => {
    if (value === '') {
      setOrderDraft(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    const parsed = parseInt(value, 10);
    if (parsed >= 1 && !Number.isNaN(parsed)) {
      setOrderDraft(prev => ({ ...prev, [id]: parsed }));
    }
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    try {
      const token = await requireFreshToken(getToken);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

      const withPos = banners.map((b, idx) => ({
        id: b.id,
        pos: orderDraft[b.id] ?? idx + 1
      }));
      withPos.sort((a, b) => a.pos - b.pos);
      const orderedIds = withPos.map(p => p.id);

      const res = await fetch(`${baseUrl}/banners/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderedIds)
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

      revalidate(['/']);
      const newBanners = await getAllBanners();
      setBanners(newBanners);
      setOrderDraft({});
      toast.success('Orden guardado');
    } catch (err) {
      console.error('Error saving order:', err);
      toast.error('Error al guardar el orden');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleSaveItem = async () => {
    setSaving(true);

    try {
      const token = await requireFreshToken(getToken);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

      if (modalType === 'banner') {
        const payload = { imageUrl: uploadedImage, altText: formData.altText, link: formData.link, active: formData.active, displayOrder: bannerToEdit ? bannerToEdit.displayOrder : banners.length };
        const url = bannerToEdit ? `${baseUrl}/banners/${bannerToEdit.id}` : `${baseUrl}/banners`;
        const method = bannerToEdit ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

        revalidate(['/']);
        const newBanners = await getAllBanners();
        setBanners(newBanners);

      } else if (modalType === 'homeImage') {
        const payload = { imageUrl: uploadedImage, link: formData.link, title: formData.description, active: formData.active };
        const url = homeImageToEdit ? `${baseUrl}/api/v1/home-images/${homeImageToEdit.id}` : `${baseUrl}/api/v1/home-images`;
        const method = homeImageToEdit ? 'PUT' : 'POST';

        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);

        revalidate(['/']);
        const newHomeImages = await getAllHomeImages();
        setHomeImages(newHomeImages);

      } else if (modalType === 'category') {
        const url = `${baseUrl}/categories/${categoryToEdit?.id}`;

        const saveRes = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ description: formData.description, active: formData.active }) });
        if (!saveRes.ok) throw new Error(`Error ${saveRes.status}: ${await saveRes.text()}`);

        revalidate(['/shop']);
        setCategories(await getAllCategories());
      }

      toast.success('Guardado correctamente');
      closeModal();
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: string, id: number) => {
    if (!confirm('¿Eliminar este elemento?')) return;

    try {
      const token = await requireFreshToken(getToken);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

      if (type === 'banner') {
        const res = await fetch(`${baseUrl}/banners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
        revalidate(['/']);
        setBanners(await getAllBanners());
      } else if (type === 'homeImage') {
        const res = await fetch(`${baseUrl}/api/v1/home-images/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
        revalidate(['/']);
        setHomeImages(await getAllHomeImages());
      }
      toast.success('Eliminado');
    } catch (err) {
      console.error('Error deleting:', err);
      toast.error('Error al eliminar');
    }
  };

  const toggleNotifications = async () => {
    if (typeof window !== 'undefined') {
      try {
        const OneSignal = (await import('react-onesignal')).default;
        await OneSignal.Slidedown.promptPush();
      } catch (err) {
        console.error('Error toggling notifications:', err);
        toast.error('Error al solicitar permisos');
      }
    }
  };

  const saveTestimonials = async () => {
    setSaving(true);
    try {
      const token = await requireFreshToken(getToken);
      const existing = await getTestimonials();
      const localIds = testimonials.filter(t => t.id).map(t => t.id!);
      for (const old of existing) {
        if (!localIds.includes(old.id!)) {
          await deleteTestimonial(old.id!, token);
        }
      }
      for (const t of testimonials) {
        if (t.id) {
          await updateTestimonial(t.id, { name: t.name, text: t.text, rating: t.rating }, token);
        } else {
          await createTestimonial({ name: t.name, text: t.text, rating: t.rating }, token);
        }
      }
      const updated = await getTestimonials();
      setTestimonials(updated);
      toast.success('Testimonios guardados');
    } catch (err) {
      console.error('Error saving testimonials:', err);
      toast.error('Error al guardar testimonios');
    } finally {
      setSaving(false);
    }
  };

  const handleTestimonialChange = (idx: number, field: keyof Testimonial, value: string | number) => {
    const newTestimonials = [...testimonials];
    newTestimonials[idx] = { ...newTestimonials[idx], [field]: value };
    setTestimonials(newTestimonials);
  };

  const addTestimonial = () => {
    setTestimonials([...testimonials, { name: '', text: '', rating: 5 }]);
  };

  const removeTestimonial = (idx: number) => {
    const newTestimonials = [...testimonials];
    newTestimonials.splice(idx, 1);
    setTestimonials(newTestimonials);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#254642] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Cargando ajustes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 1. BANNERS DEL CARRUSEL */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900">Banners del Carrusel</h2>
            </div>
            <div className="flex items-center gap-2">
              {banners.some(b => orderDraft[b.id] !== undefined) && (
                <button onClick={handleSaveOrder} disabled={savingOrder} className="text-xs px-3 py-1 bg-[#254642] text-white rounded-lg font-medium hover:bg-[#1d3530] disabled:opacity-50">
                  {savingOrder ? 'Guardando...' : 'Guardar orden'}
                </button>
              )}
              <button onClick={() => openModal('banner')} className="text-sm text-[#254642] font-medium hover:underline">
                + Agregar
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((banner, index) => (
                <div key={banner.id} className="relative aspect-[16/9] rounded-lg overflow-hidden bg-gray-100">
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-black/60 rounded px-2 py-1">
                    <span className="text-white text-xs font-bold">#</span>
                    <input
                      type="number"
                      min={1}
                      value={orderDraft[banner.id] ?? index + 1}
                      onChange={(e) => handleOrderChange(banner.id, e.target.value)}
                      className="w-10 px-1 py-0.5 text-xs text-center bg-white/90 border border-gray-300 rounded"
                    />
                  </div>
                  <img src={banner.imageUrl} alt={banner.altText} className="w-full h-full object-cover" />
                  {!banner.active && <div className="absolute inset-0 bg-black/50" />}
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex justify-between items-end">
                    <span className="text-white text-sm truncate">{banner.altText}</span>
                    <div className="flex gap-2">
                      <button onClick={() => openModal('banner', banner)} className="text-white text-xs bg-black/50 px-2 py-1 rounded">Editar</button>
                      <button onClick={() => handleDelete('banner', banner.id)} className="text-red-400 text-xs hover:text-red-600">Eliminar</button>
                    </div>
                  </div>
                </div>
              ))}
              {banners.length === 0 && <p className="text-gray-400 text-sm">No hay banners</p>}
            </div>
          </div>
        </section>

        {/* 2. FOTOS DEL HOME */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900">Fotos del Home</h2>
            </div>
            <button onClick={() => openModal('homeImage')} className="text-sm text-[#254642] font-medium hover:underline">
              + Agregar
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {homeImages.map((img) => (
                <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 flex justify-end gap-1">
                    <button onClick={() => openModal('homeImage', img)} className="text-white text-xs">Editar</button>
                    <button onClick={() => handleDelete('homeImage', img.id)} className="text-red-400 text-xs hover:text-red-600">X</button>
                  </div>
                </div>
              ))}
              {homeImages.length === 0 && <p className="text-gray-400 text-sm col-span-2 md:col-span-3">No hay imágenes</p>}
            </div>
          </div>
        </section>

        {/* 3. FILTROS DE TIENDA */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900">Filtros de Tienda</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <span className="font-medium text-gray-800">{cat.description}</span>
                  <div className="flex items-center gap-2">
                    {cat.active ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                    <button onClick={() => openModal('category', cat)} className="text-sm text-[#254642] hover:underline">Editar</button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="text-gray-400 text-sm">No hay categorías</p>}
            </div>
          </div>
        </section>

        {/* 4. TESTIMONIOS */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900">Testimonios</h2>
            </div>
            <button onClick={() => { addTestimonial(); }} className="text-sm text-[#254642] font-medium hover:underline">
              + Agregar
            </button>
          </div>
          <div className="p-6 space-y-4">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gray-100 bg-gray-50 relative">
                <button onClick={() => removeTestimonial(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500">Nombre</label>
                    <input type="text" value={t.name} onChange={(e) => handleTestimonialChange(idx, 'name', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" />
                    <div className="mt-2">
                      <label className="text-xs font-bold text-gray-500">Estrellas</label>
                      <select value={t.rating} onChange={(e) => handleTestimonialChange(idx, 'rating', parseInt(e.target.value))} className="w-full px-3 py-2 border rounded-lg text-sm">
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} estrellas</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-xs font-bold text-gray-500">Comentario</label>
                    <textarea value={t.text} rows={3} onChange={(e) => handleTestimonialChange(idx, 'text', e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm resize-none" />
                  </div>
                </div>
              </div>
            ))}
            {testimonials.length === 0 && <p className="text-gray-400 text-sm">No hay testimonios</p>}
            
            {testimonials.length > 0 && (
              <button onClick={saveTestimonials} disabled={saving} className="mt-2 px-4 py-2 bg-[#254642] text-white rounded-lg text-sm font-medium hover:bg-[#1d3530]">
                {saving ? 'Guardando...' : 'Guardar Testimonios'}
              </button>
            )}
          </div>
        </section>

        {/* 5. NOTIFICACIONES PUSH */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#254642]" />
              <h2 className="text-lg font-bold text-gray-900">Notificaciones Push</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-medium text-gray-800">Alertas de nuevas ventas</h3>
                <p className="text-sm text-gray-500">Recibir notificaciones cuando se realice una venta</p>
              </div>
              <button onClick={toggleNotifications} className="px-4 py-2 rounded-lg font-medium bg-[#254642] text-white hover:bg-[#1d3530] whitespace-nowrap">
                Configurar Notificaciones
              </button>
            </div>
          </div>
        </section>

      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {modalType === 'banner' ? 'Banner' : modalType === 'homeImage' ? 'Imagen Home' : 'Categoría'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-500 mb-1">Imagen</label>
                <SingleImageUploader
                  imageUrl={uploadedImage}
                  onChange={setUploadedImage}
                  getToken={getToken}
                />
              </div>
              
              {(modalType === 'banner' || modalType === 'homeImage') && (
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Link (opcional)</label>
                  <input type="text" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} className="w-full px-3 py-2 border rounded-lg" placeholder="/shop?category=mate" />
                </div>
              )}
              
              {modalType === 'homeImage' && (
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Título</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              )}
              
              {modalType === 'banner' && (
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Texto Alt</label>
                  <input type="text" value={formData.altText} onChange={(e) => setFormData({...formData, altText: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              )}
              
              {modalType === 'category' && (
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-1">Descripción</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                <label htmlFor="active" className="text-sm">Activo</label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancelar</button>
              <button onClick={handleSaveItem} disabled={saving} className="px-4 py-2 bg-[#254642] text-white rounded-lg">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
