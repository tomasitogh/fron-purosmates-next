'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllProductsAdmin, Product, type ProductVariant } from '@/redux/productSlice';
import { fetchCategories } from '@/redux/categorySlice';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  clearAdminMessages,
  ProductData,
} from '@/redux/adminSlice';
import FilterTabs from '@/components/FilterTabs';
import ImageUploader from '@/components/ImageUploader';
import ProductImagePreview from '@/components/ProductImagePreview';
import VariantsGrid from '@/components/admin/VariantsGrid';
import VariantImageAssigner, {
  type VariantImageAssignerImage,
} from '@/components/admin/VariantImageAssigner';
import toast from 'react-hot-toast';
import { Package } from 'lucide-react';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

// E4: helpers de módulo (puros, sin closure deps) para el resumen de variantes
// en la card de admin.
function formatVariantsTooltip(variants: ProductVariant[]): string {
  if (!variants || variants.length === 0) return '';
  return variants
    .map((v) => {
      const label = v.name || v.sku;
      return `${label} (stock: ${v.stock})`;
    })
    .join('\n');
}

/**
 * E6: merge por URL entre las imágenes previas (que ya tienen `variantId`
 * asignado) y las que vienen de `ImageUploader` (que no lo tienen).
 * `ImageUploader` reemplaza el array completo cuando edita; este helper
 * preserva el `variantId` de las imágenes cuya URL sigue en la lista.
 * - Imágenes nuevas (URL no estaba antes): entran con `variantId: undefined`.
 * - Imágenes borradas (URL no está en el nuevo): se eliminan y, con ellas,
 *   su asignación a variant. Si esa variant tenía esa imagen asignada, queda
 *   huérfana — el admin la reasigna con el dropdown de abajo.
 */
function mergeImagesPreservingVariant(
  prev: VariantImageAssignerImage[],
  next: VariantImageAssignerImage[]
): VariantImageAssignerImage[] {
  const prevByUrl = new Map(prev.map((img) => [img.url, img]));
  return next.map((img) => {
    const before = prevByUrl.get(img.url);
    if (!before) {
      return { ...img, variantId: img.variantId ?? null };
    }
    return { ...img, variantId: before.variantId };
  });
}

function formatVariantSummary(product: Product): { text: string; tooltip: string } {
  const totalStock = product.totalStock ?? product.stock;
  const variants = product.variants ?? [];
  if (variants.length === 0) {
    // Fallback para respuestas sin variantes (producto legacy o backend
    // sin A4). No se muestra tooltip porque no hay SKUs que listar.
    return { text: `Stock: ${totalStock}`, tooltip: '' };
  }
  const activeCount = variants.filter((v) => v.active).length;
  const variantLabel = activeCount === 1 ? 'variante activa' : 'variantes activas';
  return {
    text: `Stock total: ${totalStock} (${activeCount} ${variantLabel})`,
    tooltip: formatVariantsTooltip(variants),
  };
}

interface AdminProductsProps {
  getToken: TokenGetter;
}

export default function AdminProducts({ getToken }: AdminProductsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: products,
    loading: productsLoading,
    error: productsError,
  } = useSelector((state: RootState) => state.products);
  const { items: categories } = useSelector((state: RootState) => state.categories);
  const {
    loading: adminLoading,
    error: adminError,
    successMessage,
  } = useSelector((state: RootState) => state.admin);

  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    price: string;
    categoryId: string;
    images: VariantImageAssignerImage[];
    active: boolean;
    isCustomizable: boolean;
    customizationCost: string;
  }>({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    images: [],
    active: true,
    isCustomizable: false,
    customizationCost: '',
  });

  // E7: estado local de variants. Cada variant tiene `name` libre.
  // `excludedSkus` permite que el admin oculte filas sin perder los datos
  // (la fila se esconde, no se borra del estado; al guardar el backend
  // la borra porque el SKU no aparece en el DTO).
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [excludedSkus, setExcludedSkus] = useState<Set<string>>(new Set());

  // Variants que efectivamente se mandan al backend (filtro por excludedSkus).
  const variantsToSend = useMemo(
    () => variants.filter((v) => !excludedSkus.has(v.sku)),
    [variants, excludedSkus]
  );

  useEffect(() => {
    dispatch(fetchAllProductsAdmin(getToken));
    dispatch(fetchCategories());
  }, [dispatch, getToken]);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (selectedType.length === 0) {
      return products;
    }
    return products.filter((product) => selectedType.includes(product.category?.description || ''));
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
      categoryId: '',
      images: [],
      active: true,
      isCustomizable: false,
      customizationCost: '',
    });
    setVariants([]); // E7: reset
    setExcludedSkus(new Set()); // E7: reset
    setSelectedProduct(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      categoryId: String(product.category?.id ?? ''),
      images: product.images || [],
      active: product.active !== undefined ? product.active : true,
      isCustomizable: product.isCustomizable || false,
      customizationCost: product.customizationCost ? product.customizationCost.toString() : '',
    });
    // E7: popular con las variants del producto. No podemos saber cuáles
    // fueron excluidas por un admin previo, así que arrancamos con set vacío
    // (todas visibles).
    setVariants(product.variants ?? []);
    setExcludedSkus(new Set());
    setSelectedProduct(product);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
    setIsEditing(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

    // E7: validación — al menos 1 variante con nombre (el stock puede ser 0).
    if (variantsToSend.length === 0) {
      toast.error('Agregá al menos una variante con nombre');
      return;
    }
    // Bloquear submit si hay variants sin nombre (estado intermedio).
    const incompleteVariants = variantsToSend.filter((v) => !v.name?.trim());
    if (incompleteVariants.length > 0) {
      toast.error('Todas las variantes deben tener un nombre. Completá las que faltan o borralas.');
      return;
    }
    // Bloquear nombres repetidos: el backend deriva el SKU a partir del
    // nombre y tiene UNIQUE (product_id, sku). Dos variantes con el mismo
    // nombre (o uno que solo difiera en mayúsculas/acentos) resolvían al
    // mismo SKU y el guardado fallaba con un 409 críptico.
    const seenVariantNames = new Map<string, string>();
    for (const v of variantsToSend) {
      const key = (v.name || '').trim().toLocaleLowerCase('es-AR');
      if (!key) continue;
      if (seenVariantNames.has(key)) {
        toast.error(
          `Ya existe una variante con el nombre «${v.name}». Cada variante debe tener un nombre distinto.`
        );
        return;
      }
      seenVariantNames.set(key, v.name);
    }

    const productData: ProductData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: parseInt(formData.categoryId),
      images: formData.images,
      active: formData.active,
      isCustomizable: formData.isCustomizable,
      customizationCost: formData.isCustomizable ? parseFloat(formData.customizationCost) : 0,
      variants: variantsToSend,
    };

    try {
      if (isEditing && selectedProduct) {
        await dispatch(
          updateProduct({
            productId: selectedProduct.id,
            productData,
            getToken,
          })
        ).unwrap();
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
      // E3: el backend (B2 updateProduct) hace replace-all de variantes. Si no
      // mandamos `variants` y `attributeDefinitions`, los wipea. Por eso mandamos
      // los datos existentes del producto y solo cambiamos `active`.
      const productData: ProductData = {
        name: product.name,
        description: product.description,
        price: product.price,
        categoryId: product.category?.id ?? 0, // fix mini-commit: shape flat
        images: product.images || [],
        active: newActiveState,
        isCustomizable: product.isCustomizable,
        customizationCost: product.customizationCost,
        variants: product.variants ?? [],
      };

      await dispatch(
        updateProduct({
          productId: product.id,
          productData,
          getToken,
        })
      ).unwrap();

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
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
          <span className="text-sm text-gray-500">Cargando productos...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="w-full md:w-auto">
          <FilterTabs
            categories={
              categories?.map(
                (c: { description?: string; name?: string }) => c.description || c.name || ''
              ) || []
            }
            selectedType={selectedType}
            onFilterChange={handleFilterChange}
          />
        </div>
        <button
          onClick={openCreateModal}
          className="rounded-lg bg-[#254642] px-5 py-2.5 text-sm font-medium whitespace-nowrap text-white transition hover:bg-[#1d3530]"
        >
          + Agregar Producto
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className={`overflow-hidden rounded-xl border border-gray-100 bg-white transition hover:shadow-md ${product.active === false ? 'border-gray-300 opacity-60' : ''}`}
          >
            <div className="relative">
              <div className="flex aspect-square h-auto w-full items-center justify-center overflow-hidden bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <ProductImagePreview
                    src={product.images[0].url}
                    alt={product.name}
                    transform={{
                      scale: product.images[0].scale || 1,
                      x: product.images[0].x || 0,
                      y: product.images[0].y || 0,
                    }}
                    fill={true}
                  />
                ) : (
                  <span className="text-gray-400">Sin imagen</span>
                )}
              </div>
              {product.active === false && (
                <div className="absolute top-2 right-2 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  INACTIVO
                </div>
              )}
              {(product.totalStock ?? product.stock) === 0 && (
                <div className="absolute top-2 left-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  SIN STOCK
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">{product.name}</h3>
              <p className="mb-2 line-clamp-2 text-sm text-gray-600">{product.description}</p>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-bold text-green-600">
                  ${product.price ? product.price.toLocaleString('es-AR') : '0'}
                </span>
                {(() => {
                  // E4: resumen de variantes con tooltip de SKUs/stocks
                  const { text, tooltip } = formatVariantSummary(product);
                  return (
                    <span
                      className="cursor-help text-sm text-gray-600"
                      title={tooltip || undefined}
                    >
                      {text}
                    </span>
                  );
                })()}
              </div>
              <div className="mb-4 text-xs text-gray-500">
                Categoría: {product.category?.description || 'Sin categoría'}
              </div>

              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 shadow-sm transition hover:bg-gray-200"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 shadow-sm transition hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
                <button
                  onClick={() => handleToggleActive(product)}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium shadow-sm transition ${
                    product.active === false
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
        <div className="rounded-xl border border-gray-100 bg-white py-16 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-500">No hay productos</p>
          <p className="mt-1 text-sm text-gray-400">
            {selectedType.length > 0
              ? 'No se encontraron productos en esta categoría'
              : 'Creá tu primer producto con el botón de arriba'}
          </p>
        </div>
      )}

      {/* Modal para crear/editar producto */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="animate-in fade-in zoom-in-95 relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white duration-200">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-1 text-gray-400 transition-colors hover:text-gray-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="p-6">
              <h2 className="mb-6 text-2xl font-bold">
                {isEditing ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Imágenes del Producto *
                    </label>
                    <ImageUploader
                      images={formData.images}
                      onChange={(images) => {
                        // E6: merge por URL para preservar el `variantId` de
                        // las imágenes que ya estaban. `ImageUploader` reemplaza
                        // el array completo cuando sube/edita; si copiáramos
                        // tal cual, perderíamos la asignación imagen→variant.
                        setFormData((prev) => ({
                          ...prev,
                          images: mergeImagesPreservingVariant(prev.images, images),
                        }));
                      }}
                      required={true}
                      getToken={getToken}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
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
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Categoría *
                    </label>
                    <select
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-[#254642] focus:outline-none"
                    >
                      <option value="">Selecciona una categoría</option>
                      {categories.map(
                        (category: { id: number; name?: string; description?: string }) => (
                          <option key={category.id} value={category.id}>
                            {category.name || category.description}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg bg-gray-50 p-4">
                    <input
                      type="checkbox"
                      name="active"
                      id="active"
                      checked={formData.active}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded text-[#254642] focus:ring-[#254642]"
                    />
                    <label htmlFor="active" className="text-sm font-medium text-gray-700">
                      Producto activo (visible para usuarios)
                    </label>
                  </div>
                </div>

                <div className="mt-4 space-y-4 rounded-lg bg-blue-50 p-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="isCustomizable"
                      id="isCustomizable"
                      checked={formData.isCustomizable}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isCustomizable" className="text-sm font-medium text-gray-700">
                      Producto Personalizable
                    </label>
                  </div>

                  {formData.isCustomizable && (
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Costo de Personalización
                      </label>
                      <input
                        type="number"
                        name="customizationCost"
                        value={formData.customizationCost}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {/* E7: ya no hay editor de definiciones de atributos.
                   Las variants tienen `name` libre, las creás directo abajo. */}

                {/* E7: variantes. El admin tipea nombre + stock por variante. */}
                <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                  <VariantsGrid
                    value={variants}
                    onChange={setVariants}
                    excludedSkus={excludedSkus}
                    onExcludedSkusChange={setExcludedSkus}
                  />
                </div>

                {/* E6: asignación de imágenes a variantes. Aparece DESPUÉS de las
                   variants para que el admin ya tenga SKUs para asignar. */}
                {variants.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                    <VariantImageAssigner
                      images={formData.images}
                      variants={variants}
                      onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
                    />
                  </div>
                ) : null}

                <div className="mt-6 flex space-x-4">
                  <button
                    type="submit"
                    disabled={adminLoading}
                    className="flex-1 rounded-lg bg-[#254642] px-4 py-2 text-white shadow-sm transition hover:bg-[#254642]/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {adminLoading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'} Producto
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 shadow-sm transition hover:bg-gray-200"
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
