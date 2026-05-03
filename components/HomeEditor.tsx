'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { getBanners, createBanner, updateBanner, deleteBanner, getHomeCategories, updateCategoryHome, createHomeCategory, deleteHomeCategory, Banner, HomeCategory } from '@/lib/actions/home.actions';
import ImageUploader from '@/components/ImageUploader';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

export default function HomeEditor() {
    const [activeTab, setActiveTab] = useState<'banners' | 'categories'>('banners');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<HomeCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Banner | HomeCategory | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const { getToken } = useClerkAuth();
    const [token, setToken] = useState<string | null>(null);
    const initialized = useRef(false);

    const [formData, setFormData] = useState({
        altText: '',
        link: '',
        description: '',
        showOnHome: true,
        active: true,
        displayOrder: 0,
        imageUrl: '',
    });

    const [uploadedImages, setUploadedImages] = useState<{ url: string; scale?: number; x?: number; y?: number }[]>([]);
    
    const refreshData = async () => {
        const [bannersData, categoriesData] = await Promise.all([
            getBanners(),
            getHomeCategories(),
        ]);
        setBanners(bannersData);
        setCategories(categoriesData);
    };
    
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        
        const init = async () => {
            const clerkToken = await getToken();
            setToken(clerkToken);
            
            const [bannersData, categoriesData] = await Promise.all([
                getBanners(),
                getHomeCategories(),
            ]);
            setBanners(bannersData);
            setCategories(categoriesData);
            setLoading(false);
        };
        
        init();
    }, [getToken]);

    const openCreateModal = () => {
        setFormData({
            altText: '',
            link: '',
            description: '',
            showOnHome: true,
            active: true,
            displayOrder: activeTab === 'banners' ? banners.length : categories.length,
            imageUrl: '',
        });
        setUploadedImages([]);
        setEditingItem(null);
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const openEditModal = (item: Banner | HomeCategory) => {
        if (activeTab === 'banners') {
            const banner = item as Banner;
            setFormData({
                altText: banner.altText || '',
                link: banner.link || '',
                description: '',
                showOnHome: true,
                active: banner.active,
                displayOrder: banner.displayOrder,
                imageUrl: banner.imageUrl || '',
            });
            setUploadedImages([{ url: banner.imageUrl }]);
        } else {
            const cat = item as HomeCategory;
            setFormData({
                altText: '',
                link: (cat as any).link || '',
                description: cat.description,
                showOnHome: cat.showOnHome,
                active: cat.active,
                displayOrder: cat.displayOrder,
                imageUrl: cat.imageUrl || '',
            });
            setUploadedImages([{ url: cat.imageUrl || '' }]);
        }
        setEditingItem(item);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setIsEditing(false);
        setUploadedImages([]);
    };

    const handleImageChange = (images: { url: string; scale?: number; x?: number; y?: number }[]) => {
        setUploadedImages(images);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            toast.error('Sesión no válida');
            return;
        }

        if (uploadedImages.length === 0 || !uploadedImages[0].url) {
            toast.error('La imagen es obligatoria');
            return;
        }

        const imageUrl = uploadedImages[0].url;

        try {
            if (activeTab === 'banners') {
                if (isEditing && editingItem) {
                    await updateBanner(editingItem.id, {
                        imageUrl,
                        altText: formData.altText,
                        link: formData.link,
                        active: formData.active,
                        displayOrder: formData.displayOrder,
                    }, token);
                } else {
                    await createBanner({
                        imageUrl,
                        altText: formData.altText,
                        link: formData.link,
                        displayOrder: formData.displayOrder,
                    }, token);
                }
            } else {
                if (!formData.description) {
                    toast.error('El nombre es obligatorio');
                    return;
                }
                if (isEditing && editingItem) {
                    await updateCategoryHome(editingItem.id, {
                        description: formData.description,
                        imageUrl,
                        link: formData.link,
                        showOnHome: formData.showOnHome,
                        active: formData.active,
                        displayOrder: formData.displayOrder,
                    }, token);
                } else {
                    await createHomeCategory({
                        description: formData.description,
                        imageUrl,
                        link: formData.link,
                        showOnHome: true,
                        displayOrder: formData.displayOrder,
                    }, token);
                }
            }

            toast.success(isEditing ? 'Actualizado' : 'Creado');
            closeModal();
            refreshData();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al guardar');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar?')) return;
        if (!token) return;

        try {
            if (activeTab === 'banners') {
                await deleteBanner(id, token);
            } else {
                await deleteHomeCategory(id, token);
            }
            toast.success('Eliminado');
            refreshData();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al eliminar');
        }
    };

    const handleToggle = async (item: Banner | HomeCategory) => {
        if (!token) return;

        try {
            if (activeTab === 'banners') {
                await updateBanner(item.id, { active: !item.active }, token);
            } else {
                await updateCategoryHome(item.id, { active: !item.active }, token);
            }
            refreshData();
        } catch (error) {
            console.error('Error:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-gray-500">Cargando...</div>
            </div>
        );
    }

    const items = activeTab === 'banners' ? banners : categories;

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('banners')}
                    className={`px-4 py-2 font-medium rounded-lg transition ${activeTab === 'banners'
                        ? 'bg-[#254642] text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Banners ({banners.length})
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 font-medium rounded-lg transition ${activeTab === 'categories'
                        ? 'bg-[#254642] text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    Categorías Home ({categories.length})
                </button>
            </div>

            {activeTab === 'banners' && (
                <button
                    onClick={openCreateModal}
                    className="bg-[#254642] text-white px-6 py-2 rounded-lg hover:bg-[#254642]/90 transition font-medium shadow-sm mb-6"
                >
                    + Agregar Banner
                </button>
            )}

            {activeTab === 'categories' && (
                <button
                    onClick={openCreateModal}
                    className="bg-[#254642] text-white px-6 py-2 rounded-lg hover:bg-[#254642]/90 transition font-medium shadow-sm mb-6"
                >
                    + Agregar Categoría
                </button>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item: any) => (
                    <div
                        key={item.id}
                        className={`bg-white rounded-lg shadow-md overflow-hidden ${!item.active ? 'opacity-60' : ''}`}
                    >
                        <div className="relative h-40 bg-gray-100">
                            <img
                                src={item.imageUrl}
                                alt={item.description || item.altText || 'Banner'}
                                className="w-full h-full object-cover"
                            />
                            {!item.active && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                    INACTIVO
                                </div>
                            )}
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-1">
                                {item.description || item.altText || `Banner #${item.displayOrder + 1}`}
                            </h3>
                            <div className="flex space-x-2 mt-3">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm"
                                >
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded hover:bg-red-100 transition text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                            <button
                                onClick={() => handleToggle(item)}
                                className={`w-full mt-2 px-3 py-2 rounded transition text-sm font-medium ${item.active
                                    ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                }`}
                            >
                                {item.active ? 'Desactivar' : 'Activar'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {items.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No hay {activeTab} configurados</p>
                    <p className="text-sm text-gray-400 mt-1">Agrega uno para mostrar en el home</p>
                </div>
            )}

            {isModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) closeModal();
                    }}
                >
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">
                                {isEditing ? 'Editar' : 'Crear'} {activeTab === 'banners' ? 'Banner' : 'Categoría'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Imagen *
                                        </label>
                                        <ImageUploader
                                            images={uploadedImages}
                                            onChange={handleImageChange}
                                            required={true}
                                            token={token || ''}
                                        />
                                    </div>

                                    {activeTab === 'banners' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Texto Alternativo
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.altText}
                                                    onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Link (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.link}
                                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                    placeholder="/shop"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Nombre *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.description}
                                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Link (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.link}
                                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                                    placeholder="http://localhost:3000/shop?category=accesorio"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Orden de Mostrado
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.displayOrder}
                                            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                            className="w-5 h-5 text-[#254642] rounded focus:ring-[#254642]"
                                        />
                                        <label className="text-sm font-medium text-gray-700">
                                            Visible en el sitio
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-6 flex space-x-4">
                                    <button
                                        type="submit"
                                        className="flex-1 bg-[#254642] text-white px-4 py-2 rounded-lg hover:bg-[#254642]/90 transition shadow-sm"
                                    >
                                        {isEditing ? 'Actualizar' : 'Crear'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition shadow-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}