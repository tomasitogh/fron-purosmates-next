'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProductsAdmin, Product } from '@/redux/productSlice';
import { fetchCategories } from '@/redux/categorySlice';
import { createProduct, updateProduct, deleteProduct, clearAdminMessages, ProductData } from '@/redux/adminSlice';
import FilterTabs from '@/components/FilterTabs';
import ImageUploader from '@/components/ImageUploader';
import ProductImagePreview from '@/components/ProductImagePreview';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

interface AdminProductsProps {
  getToken: TokenGetter;
}

export default function AdminProducts({ getToken }: AdminProductsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { items: products, loading: productsLoading, error: productsError } = useSelector((state: RootState) => state.products);
  const { items: categories } = useSelector((state: RootState) => state.categories);
  const { loading: adminLoading, error: adminError, successMessage } = useSelector((state: RootState) => state.admin);

  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    images: [] as { url: string; scale?: number; x?: number; y?: number }[],
    active: true,
    isCustomizable: false,
    customizationCost: '',
  });

  useEffect(() => {
    dispatch(fetchAllProductsAdmin(getToken));
    dispatch(fetchCategories());
  }, [dispatch, getToken]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedType.length === 0) {
      return products;
    }
    return products.filter((product) =>
      selectedType.includes(product.category?.description || '')
    );
  }, [selectedType, products]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearAdminMessages());
    }
    if (adminError) {
      toast.error(`Error: ${adminError}`);
      dispatch(clearAdminMessages());
    }
    if (productsError) {
      toast.error(`Error al cargar productos: ${productsError}`);
    }
  }, [successMessage, adminError, productsError, dispatch]);

  const handleFilterChange = (type: string[]) => {
    setSelectedType(type);
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      categoryId: '',
      images: [],
      active: true,
      isCustomizable: false,
      customizationCost: '',
    });
    setSelectedProduct(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock.toString(),
      categoryId: String(product.category?.id ?? ''),
      images: product.images || [],
      active: product.active !== undefined ? product.active : true,
      isCustomizable: product.isCustomizable || false,
      customizationCost: product.customizationCost ? product.customizationCost.toString() : '',
    });
    setSelectedProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if ((e.target as HTMLInputElement).type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.images || formData.images.length === 0) {
      toast.error('Debes subir al menos una imagen del producto');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    const productData: ProductData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock),
      category: {
        id: parseInt(formData.categoryId),
      },
      images: formData.images,
      active: formData.active,
      isCustomizable: formData.isCustomizable,
      customizationCost: formData.isCustomizable ? parseFloat(formData.customizationCost) : 0,
    };

    try {
      if (isEditing && selectedProduct) {
        await dispatch(updateProduct({
          productId: selectedProduct.id,
          productData,
          getToken
        })).unwrap();
      } else {
        await dispatch(createProduct({ productData, getToken })).unwrap();
      }

      dispatch(fetchAllProductsAdmin(getToken));
      closeModal();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleToggleActive = async (product: Product) => {
    const currentState = product.active !== false;
    const newActiveState = !currentState;
    const action = newActiveState ? 'activar' : 'inactivar';

    if (!confirm(`¿Estás seguro de que deseas ${action} este producto?`)) {
      return;
    }

    try {
      const productData: ProductData = {
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: {
          id: product.category?.id ?? 0,
        },
        images: product.images || [],
        active: newActiveState,
      };

      await dispatch(updateProduct({
        productId: product.id,
        productData,
        getToken
      })).unwrap();

      dispatch(fetchAllProductsAdmin(getToken));

      toast.success(`Producto ${newActiveState ? 'activado' : 'inactivado'} exitosamente`);
    } catch (error: unknown) {
      console.error('Error:', error);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`Error al ${action} el producto: ` + msg);
    }
  };

  const handleDelete = async (productId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      await dispatch(deleteProduct({ productId, getToken })).unwrap();
      dispatch(fetchAllProductsAdmin(getToken));
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (productsLoading && !products) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#254642] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="w-full md:w-auto">
          <FilterTabs
            categories={categories?.map((c: { description?: string; name?: string }) => c.description || c.name || '') || []}
            selectedType={selectedType}
            onFilterChange={handleFilterChange}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#254642] text-white px-5 py-2.5 rounded-lg hover:bg-[#1d3530] transition font-medium whitespace-nowrap text-sm"
        >
          + Agregar Producto
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition ${product.active === false ? 'opacity-60 border-gray-300' : ''}`}
          >
            <div className="relative">
              <div className="h-auto w-full aspect-square bg-gray-200 flex items-center justify-center overflow-hidden">
                {product.images && product.images.length > 0 ? (
                  <ProductImagePreview
                    src={product.images[0].url}
                    alt={product.name}
                    transform={{
                      scale: product.images[0].scale || 1,
                      x: product.images[0].x || 0,
                      y: product.images[0].y || 0
                    }}
                    fill={true}
                  />
                ) : (
                  <span className="text-gray-400">Sin imagen</span>
                )}
              </div>
              {product.active === false && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  INACTIVO
                </div>
              )}
              {product.stock === 0 && (
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                  SIN STOCK
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                {product.name}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {product.description}
              </p>
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-600 font-bold">
                  ${product.price ? product.price.toLocaleString('es-AR') : '0'}
                </span>
                <span className="text-sm text-gray-600">
                  Stock: {product.stock}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-4">
                Categoría: {product.category?.description || 'Sin categoría'}
              </div>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm shadow-sm"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition text-sm shadow-sm"
                  >
                    Eliminar
                  </button>
                </div>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`w-full px-3 py-2 rounded-lg transition text-sm font-medium shadow-sm ${product.active === false
                    ? 'bg-green-50 text-green-700 hover:bg-green-100'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                    }`}
                >
                  {product.active === false ? '✓ Activar' : '✕ Inactivar'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay productos</p>
          <p className="text-gray-400 text-sm mt-1">
            {selectedType.length > 0
              ? 'No se encontraron productos en esta categoría'
              : 'Creá tu primer producto con el botón de arriba'}
          </p>
        </div>
      )}

      {/* Modal para crear/editar producto */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Imágenes del Producto *
                    </label>
                    <ImageUploader
                      images={formData.images}
                      onChange={(images) => setFormData(prev => ({ ...prev, images }))}
                      required={true}
                      getToken={getToken}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Precio *
                      </label>
                      <input
                        type="number"
                        name="price"
                        required
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stock *
                      </label>
                      <input
                        type="number"
                        name="stock"
                        required
                        min="0"
                        value={formData.stock}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría *
                    </label>
                    <select
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#254642]"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map((category: { id: number; name?: string; description?: string }) => (
                        <option key={category.id} value={category.id}>
                          {category.name || category.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      name="active"
                      id="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-[#254642] rounded focus:ring-[#254642]"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                      Producto activo (visible para usuarios)
                    </label>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isCustomizable"
                      id="isCustomizable"
                      checked={formData.isCustomizable}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isCustomizable" className="text-sm font-medium text-gray-700">
                      Producto Personalizable
                    </label>
                  </div>

                  {formData.isCustomizable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Costo de Personalización
                      </label>
                      <input
                        type="number"
                        name="customizationCost"
                        value={formData.customizationCost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="flex-1 bg-[#254642] text-white px-4 py-2 rounded-lg hover:bg-[#254642]/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {adminLoading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Producto
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
