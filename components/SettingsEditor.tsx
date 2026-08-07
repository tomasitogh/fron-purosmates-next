'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Script from 'next/script';
import { Eye, EyeOff, Plus } from 'lucide-react';
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getAllHomeImages,
  createHomeImage,
  updateHomeImage,
  deleteHomeImage,
  getAllCategories,
  createProductCategory,
  updateProductCategory,
  Banner,
  HomeImage,
  ProductCategory,
} from '@/lib/actions/home.actions';

export default function SettingsEditor() {
  const { user, isLoaded } = useUser();
  const { getToken } = useClerkAuth();
  const [token, setToken] = useState<string | null>(null);

  const [banners, setBanners] = useState<Banner[]>([]);
  const [homeImages, setHomeImages] = useState<HomeImage[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [pollingRef, setPollingRef] = useState<NodeJS.Timeout | null>(null);
  const lastOrderId = useRef<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'banners' | 'homeImages' | 'categories'>(
    'banners'
  );
  const [editingItem, setEditingItem] = useState<Banner | HomeImage | ProductCategory | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{
    altText: string;
    link: string;
    description: string;
    active: boolean;
  }>({ altText: '', link: '', description: '', active: true });
  const [uploadedImages, setUploadedImages] = useState<{ url: string }[]>([]);

  const initializeSettings = useCallback(async () => {
    const clerkToken = await getToken();
    setToken(clerkToken);

    try {
      const [bannersData, homeData, catsData] = await Promise.all([
        getBanners(),
        getAllHomeImages(),
        getAllCategories(),
      ]);

      setBanners(bannersData);
      setHomeImages(homeData);
      setCategories(catsData as ProductCategory[]);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      toast.error('Error al cargar datos');
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const role = (user.publicMetadata as any)?.role;
      if (role?.toString().toLowerCase() !== 'admin') return;
      initializeSettings();
    }
  }, [isLoaded, user, initializeSettings]);

  useEffect(() => {
    if (notificationsEnabled) {
      const poll = async () => {
        try {
          const res = await fetch('/api/v1/orders/latest');
          const data = await res.json();
          if (data?.id && data.id > lastOrderId.current) {
            new Notification('Nueva venta en Puros Mates', {
              body: `Pedido #${data.id} - $${data.total?.toLocaleString('es-AR')}`,
              icon: '/logo-purosmates.png',
            });
            lastOrderId.current = data.id;
          }
        } catch (e) {}
      };
      poll();
      const interval = setInterval(poll, 15000);
      setPollingRef(interval);
      return () => clearInterval(interval);
    }
  }, [notificationsEnabled]);

  interface EditableItem {
    id: number;
    imageUrl?: string;
    altText?: string;
    title?: string;
    link?: string;
    active?: boolean;
    description?: string;
  }

  const openModal = (item?: EditableItem | null, section?: typeof activeSection) => {
    const type = section || activeSection;
    setActiveSection(type);
    setEditingItem((item as any) || null);
    setIsEditing(!!item);
    setUploadedImages(item && item.imageUrl ? [{ url: item.imageUrl }] : []);
    setFormData({
      altText: item?.altText || '',
      link: item?.link || '',
      description: item?.description || item?.title || '',
      active: item?.active !== false,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setIsEditing(false);
    setUploadedImages([]);
    setFormData({ altText: '', link: '', description: '', active: true });
  };

  const handleImageChange = (images: any[]) => {
    setUploadedImages(images);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    try {
      const imageUrl = uploadedImages[0]?.url || '';

      if (activeSection === 'categories') {
        if (!formData.description) {
          toast.error('El nombre es obligatorio');
          return;
        }
        if (isEditing && editingItem) {
          await updateProductCategory(
            editingItem.id,
            {
              description: formData.description,
              active: formData.active,
            },
            token
          );
        } else {
          await createProductCategory(formData.description, token);
        }
      } else if (activeSection === 'banners') {
        if (!imageUrl && !isEditing) {
          toast.error('La imagen es obligatoria');
          return;
        }
        const bannerItem = editingItem as Banner | null;
        if (isEditing && bannerItem) {
          await updateBanner(
            bannerItem.id,
            {
              imageUrl: imageUrl || bannerItem.imageUrl,
              altText: formData.altText,
              link: formData.link,
              active: formData.active,
            },
            token
          );
        } else {
          await createBanner(
            {
              imageUrl,
              altText: formData.altText,
              link: formData.link,
            },
            token
          );
        }
      } else {
        if (!imageUrl && !isEditing) {
          toast.error('La imagen es obligatoria');
          return;
        }
        const homeItem = editingItem as HomeImage | null;
        if (isEditing && homeItem) {
          await updateHomeImage(
            homeItem.id,
            {
              title: formData.description,
              imageUrl: imageUrl || homeItem.imageUrl,
              link: formData.link,
              active: formData.active,
            },
            token
          );
        } else {
          await createHomeImage(
            {
              title: formData.description,
              imageUrl,
              link: formData.link,
            },
            token
          );
        }
      }

      toast.success(isEditing ? 'Actualizado' : 'Creado');
      closeModal();
      initializeSettings();
    } catch (err: unknown) {
      console.error('Error:', err);
      toast.error('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    if (!confirm('¿Eliminar?')) return;

    try {
      if (activeSection === 'banners') {
        await deleteBanner(id, token);
      } else if (activeSection === 'homeImages') {
        await deleteHomeImage(id, token);
      }
      initializeSettings();
      toast.success('Eliminado');
    } catch (err) {
      toast.error('Error al eliminar');
    }
  };

  const handleToggleActive = async (item: Banner) => {
    if (!token) return;
    try {
      if (activeSection === 'banners') {
        await updateBanner(item.id, { active: !item.active }, token);
      }
      initializeSettings();
    } catch (err) {
      toast.error('Error al actualizar');
    }
  };

  const toggleNotifications = async () => {
    if (!notificationsEnabled) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notificaciones activadas');
      } else {
        toast.error('Permiso denegado');
      }
    } else {
      setNotificationsEnabled(false);
      if (pollingRef) clearInterval(pollingRef);
      toast.success('Notificaciones desactivadas');
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#254642]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />

      {/* Banners - Primera sección */}
      <section className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <h3 className="font-bold">Banners del Carrusel</h3>
          <button
            onClick={() => openModal(null, 'banners')}
            className="flex items-center gap-1 text-sm font-medium text-[#254642] hover:underline"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {banners.map((b) => (
              <div
                key={b.id}
                className="relative aspect-video overflow-hidden rounded-lg bg-gray-100"
              >
                <img src={b.imageUrl} alt={b.altText} className="h-full w-full object-cover" />
                {!b.active && <div className="absolute inset-0 bg-black/50" />}
                <div className="absolute right-0 bottom-0 left-0 flex justify-end gap-1 bg-gradient-to-t from-black/70 p-1">
                  <button
                    onClick={() => handleToggleActive(b)}
                    className="rounded bg-black/50 px-1 text-xs text-white"
                  >
                    {b.active ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => openModal(b, 'banners')}
                    className="rounded bg-black/50 px-1 text-xs text-white"
                  >
                    Editar
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="text-xs text-red-400">
                    X
                  </button>
                </div>
              </div>
            ))}
            {banners.length === 0 && (
              <div className="col-span-4 py-8 text-center text-sm text-gray-400">
                No hay banners. Agregá el primero haciendo clic en "Agregar"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Fotos Home - Segunda sección */}
      <section className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <h3 className="font-bold">Fotos del Home</h3>
          <button
            onClick={() => openModal(null, 'homeImages')}
            className="flex items-center gap-1 text-sm font-medium text-[#254642] hover:underline"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {homeImages.map((img) => (
              <div
                key={img.id}
                className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100"
              >
                <img src={img.imageUrl} alt={img.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <button
                    onClick={() => openModal(img, 'homeImages')}
                    className="rounded bg-black/60 px-2 py-1 text-xs text-white"
                  >
                    E
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className="rounded bg-black/60 px-2 py-1 text-xs text-red-400"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
            {homeImages.length === 0 && (
              <div className="col-span-6 py-8 text-center text-sm text-gray-400">
                No hay imágenes. Agregá la primera haciendo clic en "Agregar"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Categorías / Filtros Tienda - Tercera sección */}
      <section className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
          <h3 className="font-bold">Filtros de Tienda</h3>
          <button
            onClick={() => openModal(null, 'categories')}
            className="flex items-center gap-1 text-sm font-medium text-[#254642] hover:underline"
          >
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border p-3 transition hover:bg-gray-50"
              >
                <span className="truncate text-sm font-medium">{c.description}</span>
                <div className="ml-2 flex items-center gap-2">
                  {c.active ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  )}
                  <button
                    onClick={() => openModal(c, 'categories')}
                    className="text-xs text-[#254642] hover:underline"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-4 py-8 text-center text-sm text-gray-400">
                No hay filtros. Agregá el primero haciendo clic en "Agregar"
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Notificaciones Push - Cuarta sección */}
      <section className="overflow-hidden rounded-xl border bg-white shadow">
        <div className="border-b bg-gray-50 px-4 py-3">
          <h3 className="font-bold">Notificaciones Push</h3>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <h4 className="font-medium">Alertas de nuevas ventas</h4>
            <p className="text-xs text-gray-500">
              Recibir notificaciones cuando se realice una venta
            </p>
          </div>
          <button
            onClick={toggleNotifications}
            className={`rounded px-4 py-2 text-sm font-medium ${notificationsEnabled ? 'bg-red-100 text-red-700' : 'bg-[#254642] text-white'}`}
          >
            {notificationsEnabled ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-4">
            <h3 className="mb-3 text-lg font-bold">
              {isEditing ? 'Editar' : 'Agregar'}{' '}
              {activeSection === 'banners'
                ? 'Banner'
                : activeSection === 'homeImages'
                  ? 'Foto Home'
                  : 'Filtro'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="space-y-3">
                {(activeSection === 'banners' || activeSection === 'homeImages') && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">Imagen</label>
                    <div className="mb-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
                      {uploadedImages[0]?.url ? (
                        <img
                          src={uploadedImages[0].url}
                          alt=""
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                          Sin imagen
                        </div>
                      )}
                    </div>
                    {typeof window !== 'undefined' && (window as any).cloudinary && (
                      <button
                        type="button"
                        onClick={() =>
                          (window as any).cloudinary.openUploadWidget(
                            {
                              cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                              uploadPreset:
                                process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
                                'unsigned_preset',
                              sources: ['local'],
                              multiple: false,
                            },
                            (err: unknown, res: unknown) => {
                              const result = res as {
                                event?: string;
                                info?: { secure_url?: string };
                              };
                              if (!err && result.event === 'success' && result.info?.secure_url) {
                                setUploadedImages([{ url: result.info.secure_url }]);
                              }
                            }
                          )
                        }
                        className="w-full rounded border border-[#254642] py-2 text-sm font-medium text-[#254642]"
                      >
                        Subir imagen
                      </button>
                    )}
                  </div>
                )}

                {(activeSection === 'banners' || activeSection === 'homeImages') && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">
                      Link (opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="/shop?category=mate"
                    />
                  </div>
                )}

                {activeSection === 'homeImages' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">Título</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {activeSection === 'banners' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">Texto Alt</label>
                    <input
                      type="text"
                      value={formData.altText}
                      onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                      className="w-full rounded border px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {activeSection === 'categories' && (
                  <div>
                    <label className="mb-1 block text-xs font-bold text-gray-500">
                      Nombre del Filtro
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded border px-3 py-2 text-sm"
                      placeholder="ej: Mates, Bombillas, etc."
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <label htmlFor="active" className="text-sm">
                    Activo
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded bg-[#254642] px-4 py-2 text-sm text-white"
                >
                  {saving ? '...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
