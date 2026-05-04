'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
    getBanners, createBanner, updateBanner, deleteBanner, 
    getAllHomeImages, createHomeImage, updateHomeImage, deleteHomeImage,
    getAllCategories, createProductCategory, updateProductCategory, deleteProductCategory,
    Banner, HomeImage, ProductCategory 
} from '@/lib/actions/home.actions';
import ImageUploader from '@/components/ImageUploader';
import { useAuth as useClerkAuth } from '@clerk/nextjs';

export default function HomeEditor() {
    const [activeTab, setActiveTab] = useState<'banners' | 'home-categories' | 'product-categories'>('banners');
    const [banners, setBanners] = useState<Banner[]>([]);
    const [homeCategories, setHomeCategories] = useState<HomeImage[]>([]);
    const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);

    const { getToken } = useClerkAuth();
    const [token, setToken] = useState<string | null>(null);
    const initialized = useRef(false);

    const [formData, setFormData] = useState({
        altText: '',
        link: '',
        description: '',
        active: true,
    });
    const [uploadedImages, setUploadedImages] = useState<{ url: string }[]>([]);

    const refreshData = async () => {
        const [bannersData, homeData, prodCatsData] = await Promise.all([
            getBanners(),
            getAllHomeImages(),
            getAllCategories(),
        ]);
        setBanners(bannersData);
        setHomeCategories(homeData);
        setProductCategories(prodCatsData as any);
    };

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        
        const init = async () => {
            const clerkToken = await getToken();
            setToken(clerkToken);
            await refreshData();
            setLoading(false);
        };
        init();
    }, []);

    const openCreateModal = () => {
        setEditingItem(null);
        setIsEditing(false);
        setFormData({ altText: '', link: '', description: '', active: true });
        setUploadedImages([]);
        setIsModalOpen(true);
    };

    const openEditModal = (item: any) => {
        setEditingItem(item);
        setIsEditing(true);
        
        if (activeTab === 'product-categories') {
            setFormData({
                altText: '',
                link: '',
                description: item.description,
                active: item.active,
            });
        } else if (activeTab === 'banners') {
            setFormData({
                altText: item.altText || '',
                link: item.link || '',
                description: '',
                active: item.active,
            });
            setUploadedImages([{ url: item.imageUrl }]);
        } else {
            setFormData({
                altText: '',
                link: item.link || '',
                description: item.title || '',
                active: item.active,
            });
            setUploadedImages([{ url: item.imageUrl }]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setIsEditing(false);
    };

    const handleImageChange = (images: any[]) => {
        setUploadedImages(images);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            const imageUrl = uploadedImages[0]?.url || '';

            if (activeTab === 'product-categories') {
                if (!formData.description) {
                    toast.error('El nombre es obligatorio');
                    return;
                }
                if (isEditing) {
                    await updateProductCategory(editingItem.id, {
                        description: formData.description,
                        active: formData.active,
                    }, token);
                } else {
                    await createProductCategory(formData.description, token);
                }
            } else if (activeTab === 'banners') {
                if (!imageUrl && !isEditing) {
                    toast.error('La imagen es obligatoria');
                    return;
                }
                if (isEditing) {
                    await updateBanner(editingItem.id, {
                        imageUrl: imageUrl || editingItem.imageUrl,
                        altText: formData.altText,
                        link: formData.link,
                        active: formData.active,
                    }, token);
                } else {
                    await createBanner({
                        imageUrl,
                        altText: formData.altText,
                        link: formData.link,
                    }, token);
                }
            } else {
                if (!imageUrl && !isEditing) {
                    toast.error('La imagen es obligatoria');
                    return;
                }
                if (isEditing) {
                    await updateHomeImage(editingItem.id, {
                        title: formData.description,
                        imageUrl: imageUrl || editingItem.imageUrl,
                        link: formData.link,
                        active: formData.active,
                    }, token);
                } else {
                    const payload = {
                        title: formData.description || undefined,
                        imageUrl: imageUrl || '',
                        link: formData.link || '',
                    };
                    console.log('Creating home image with:', payload);
                    await createHomeImage(payload, token);
                }
            }

            toast.success(isEditing ? 'Actualizado' : 'Creado');
            closeModal();
            refreshData();
        } catch (error: any) {
            console.error('Error:', error);
            const msg = error?.response?.data?.message || error?.message || '';
            if (msg.includes('duplicate') || msg.includes('Duplicate')) {
                toast.error('Ya existe una categoría con ese nombre');
            } else {
                toast.error('Error al guardar');
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar?')) return;
        if (!token) return;

        try {
            if (activeTab === 'banners') {
                await deleteBanner(id, token);
            } else if (activeTab === 'home-categories') {
                await deleteHomeImage(id, token);
            } else {
                await deleteProductCategory(id, token);
            }
            toast.success('Eliminado');
            refreshData();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const handleToggle = async (item: any) => {
        if (!token) return;
        try {
            if (activeTab === 'banners') {
                await updateBanner(item.id, { active: !item.active }, token);
            } else if (activeTab === 'home-categories') {
                await updateHomeImage(item.id, { active: !item.active }, token);
            } else {
                await updateProductCategory(item.id, { active: !item.active }, token);
            }
            refreshData();
        } catch (error) {
            toast.error('Error al actualizar');
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    const tabs = [
        { key: 'banners', label: `Banners (${banners.length})` },
        { key: 'home-categories', label: `Fotos Home (${homeCategories.length})` },
        { key: 'product-categories', label: `Filtros Tienda (${productCategories.length})` },
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Administrador</h1>

            <div className="flex gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key as any)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                            activeTab === tab.key 
                            ? 'bg-[#254642] text-white' 
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab !== 'product-categories' && (
                <button
                    onClick={openCreateModal}
                    className="bg-[#254642] text-white px-4 py-2 rounded-lg hover:bg-[#254642]/90 mb-6"
                >
                    + Agregar {activeTab === 'banners' ? 'Banner' : 'Categoría'}
                </button>
            )}

            {activeTab === 'product-categories' && (
                <div className="mb-6">
                    <button
                        onClick={openCreateModal}
                        className="bg-[#254642] text-white px-4 py-2 rounded-lg hover:bg-[#254642]/90"
                    >
                        + Agregar Filtro
                    </button>
                </div>
            )}

            {activeTab === 'product-categories' && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nombre</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Estado</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {productCategories.map((cat: any) => (
                                <tr key={cat.id}>
                                    <td className="px-4 py-3 text-sm font-medium">{cat.description}</td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 text-xs rounded ${cat.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {cat.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleToggle(cat)} className="text-[#254642] hover:underline mr-3">
                                            {cat.active ? 'Desactivar' : 'Activar'}
                                        </button>
                                        <button onClick={() => handleDelete(cat.id)} className="text-red-600 hover:underline">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {productCategories.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No hay filtros. Agregá uno para mostrar en la tienda.
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'banners' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {banners.map((banner: any) => (
                        <div key={banner.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="relative h-40 bg-gray-100">
                                <img src={banner.imageUrl} alt={banner.altText} className="w-full h-full object-cover" />
                                {!banner.active && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                        INACTIVO
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{banner.altText}</p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => openEditModal(banner)} className="flex-1 bg-gray-100 text-sm py-1 rounded hover:bg-gray-200">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(banner.id)} className="flex-1 bg-red-50 text-red-600 text-sm py-1 rounded hover:bg-red-100">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'home-categories' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {homeCategories.map((cat: any) => (
                        <div key={cat.id} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="relative h-40 bg-gray-100">
                                <img src={cat.imageUrl} alt={cat.description} className="w-full h-full object-cover" />
                                {!cat.active && (
                                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                                        INACTIVO
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-sm font-medium truncate">{cat.description}</p>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => openEditModal(cat)} className="flex-1 bg-gray-100 text-sm py-1 rounded hover:bg-gray-200">
                                        Editar
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="flex-1 bg-red-50 text-red-600 text-sm py-1 rounded hover:bg-red-100">
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h2 className="text-lg font-bold mb-4">
                            {isEditing ? 'Editar' : 'Crear'} {' '}
                            {activeTab === 'banners' ? 'Banner' : activeTab === 'home-categories' ? 'Categoría' : 'Filtro'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {activeTab === 'product-categories' ? (
                                <div>
                                    <label className="block text-sm font-medium mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Ej: Mate, Bombilla"
                                        required
                                        className="w-full px-3 py-2 border rounded"
                                    />
                                    <div className="flex items-center gap-2 mt-3">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        <span className="text-sm">Activo</span>
                                    </div>
                                </div>
                            ) : activeTab === 'home-categories' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Imagen *</label>
                                        <ImageUploader
                                            images={uploadedImages}
                                            onChange={handleImageChange}
                                            required={!isEditing}
                                            token={token || ''}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Título (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Ej: Ofertas del mes"
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Link (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            placeholder="/shop?category=mate"
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Imagen {!isEditing && '*'}</label>
                                        <ImageUploader
                                            images={uploadedImages}
                                            onChange={handleImageChange}
                                            required={!isEditing}
                                            token={token || ''}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Texto alternativo</label>
                                        <input
                                            type="text"
                                            value={formData.altText}
                                            onChange={(e) => setFormData({ ...formData, altText: e.target.value })}
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Link (opcional)</label>
                                        <input
                                            type="text"
                                            value={formData.link}
                                            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                            placeholder="/shop?category=mate"
                                            className="w-full px-3 py-2 border rounded"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.active}
                                            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                        />
                                        <span className="text-sm">Visible</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
                                <button type="submit" className="flex-1 bg-[#254642] text-white py-2 rounded hover:bg-[#254642]/90">
                                    {isEditing ? 'Actualizar' : 'Crear'}
                                </button>
                                <button type="button" onClick={closeModal} className="flex-1 bg-gray-100 py-2 rounded hover:bg-gray-200">
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}