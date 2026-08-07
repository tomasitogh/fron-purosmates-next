'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { addToCart } from '@/redux/cartSlice';
import toast from 'react-hot-toast';
import AuthModal from '@/components/AuthModal';
import ProductImagePreview from '@/components/ProductImagePreview';
import { slugify } from '@/lib/slugify';
import ProductModal, { Product } from '@/components/ProductModal';
import ShopFilters from '@/components/ShopFilters';
import { Filter } from 'lucide-react';
import { normalizeProduct } from '@/redux/productSlice';

interface ShopContentProps {
  initialProducts: Product[];
  initialCategories: any[];
}

type SortOption = 'relevance' | 'newest' | 'price-asc' | 'price-desc';

export default function ShopContent({ initialProducts, initialCategories }: ShopContentProps) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [customizationStates] = useState<Record<number, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [sidebarCategoryIds, setSidebarCategoryIds] = useState<number[]>([]);

  const activeCategories = useMemo(() => {
    return initialCategories
      .filter((c: any) => c.active)
      .map((c: any) => ({ id: c.id, description: c.description, active: c.active }));
  }, [initialCategories]);

  const categoriesParam = useMemo(() => {
    return (searchParams.get('categories') || '').trim().toLowerCase();
  }, [searchParams]);

  const categoryParam = useMemo(() => {
    return (searchParams.get('category') || '').trim().toLowerCase();
  }, [searchParams]);

  const normalizeText = (text: string) => {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  };

  const findCategoryBySlug = (slug: string) => {
    return activeCategories.find((c: any) => {
      const catDesc = c.description?.toLowerCase().trim();
      return normalizeText(catDesc) === slug || catDesc === slug;
    });
  };

  const urlCategoryIds = useMemo(() => {
    if (categoriesParam) {
      const slugs = categoriesParam
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const ids: number[] = [];
      for (const slug of slugs) {
        const matched = findCategoryBySlug(slug);
        if (matched) ids.push(matched.id);
      }
      return ids;
    }
    if (categoryParam) {
      const matched = findCategoryBySlug(categoryParam);
      return matched ? [matched.id] : [];
    }
    return [];
  }, [categoriesParam, categoryParam, activeCategories]);

  // Sync sidebar state from URL on mount and when URL changes (back/forward nav)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSidebarCategoryIds(urlCategoryIds);
  }, [urlCategoryIds]);

  const selectedCategoryIds = sidebarCategoryIds;

  const searchText = useMemo(() => {
    return (searchParams.get('q') || '').trim().toLowerCase();
  }, [searchParams]);

  const productSlugFromUrl = useMemo(() => {
    return searchParams.get('producto') || null;
  }, [searchParams]);

  const products = useMemo(() => {
    return (initialProducts || []).map(normalizeProduct);
  }, [initialProducts]);

  const priceRangeMemo = useMemo(() => {
    if (products.length > 0) {
      const prices = products.map((p) => p.price);
      return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number];
    }
    return [0, 100000] as [number, number];
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (selectedCategoryIds.length > 0) {
      list = list.filter((p) => p.category?.id && selectedCategoryIds.includes(p.category.id));
    }

    if (searchText) {
      list = list.filter((p) => p.name.toLowerCase().includes(searchText));
    }

    list = list.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    const sortFn = (() => {
      switch (sortBy) {
        case 'price-asc':
          return (a: Product, b: Product) => a.price - b.price;
        case 'price-desc':
          return (a: Product, b: Product) => b.price - a.price;
        default:
          return (a: Product, b: Product) => (b.id || 0) - (a.id || 0);
      }
    })();

    // H3: el stock total del product es la suma del stock de las variants.
    // D1 normalizer popula `product.stock` desde `totalStock` para backward
    // compat, pero usamos `totalStock ?? stock` para que el código sea
    // forward-compatible si en el futuro se elimina el campo deprecated.
    const inStock = list.filter((p) => (p.totalStock ?? p.stock) > 0);
    const outOfStock = list.filter((p) => {
      const s = p.totalStock ?? p.stock;
      return !s || s <= 0;
    });
    inStock.sort(sortFn);
    outOfStock.sort(sortFn);

    return [...inStock, ...outOfStock];
  }, [products, selectedCategoryIds, searchText, priceRange, sortBy]);

  const selectedProduct = useMemo(() => {
    if (!productSlugFromUrl) return null;
    return products.find((p) => (p.slug || slugify(p.name)) === productSlugFromUrl) || null;
  }, [productSlugFromUrl, products]);

  const handleCategoryFilterChange = (ids: number[]) => {
    setSidebarCategoryIds(ids);
  };

  const handleApplyFilters = (categoryIds: number[]) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('category'); // eliminar param viejo para evitar duplicados
    if (categoryIds.length > 0) {
      const catSlugs = categoryIds
        .map((id) =>
          activeCategories
            .find((c: any) => c.id === id)
            ?.description?.toLowerCase()
            .trim()
        )
        .filter(Boolean);
      params.set('categories', catSlugs.join(','));
    } else {
      params.delete('categories');
    }
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.replace(newUrl, { scroll: false });
  };

  const openProductModal = (product: Product) => {
    const slug = product.slug || slugify(product.name);
    router.push(`/shop?producto=${slug}`, { scroll: false });
  };

  const closeProductModal = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('producto');
    const newUrl = params.toString() ? `/shop?${params.toString()}` : '/shop';
    router.replace(newUrl, { scroll: false });
  };

  const handleAddToCart = async (product: Product, withCustomization: boolean = false) => {
    // G1: si el product tiene múltiples variants, no se puede agregar
    // directo — el usuario debe abrir el modal y elegir la variant.
    const hasMultipleVariants = (product.variants?.length ?? 0) > 1;
    if (hasMultipleVariants) {
      openProductModal(product);
      return;
    }
    // Single-variant (Bombilla) o legacy sin variants: agregar directo con la
    // única variant (o con placeholder variantId=0 si el backend no devuelve
    // ninguna, lo cual es edge case pre-A4).
    const onlyVariant = product.variants?.[0];
    const result = await dispatch(
      addToCart({
        ...product,
        hasCustomization: withCustomization,
        variantId: onlyVariant?.id ?? 0,
        variantSku: onlyVariant?.sku ?? '',
        variantName: onlyVariant?.name ?? '',
        variantStock: onlyVariant?.stock ?? 0,
        variantImageUrl: onlyVariant?.imageUrl,
      })
    );
    if (addToCart.fulfilled.match(result)) {
      toast.success(`Agregado: ${product.name}${withCustomization ? ' (Personalizado)' : ''}`);
    } else {
      toast.error('Este producto no tiene stock disponible');
    }
  };

  return (
    <>
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Sidebar - desktop only */}
          <aside className="hidden flex-shrink-0 lg:block lg:w-72">
            <div className="sticky top-24">
              <ShopFilters
                categories={activeCategories}
                selectedCategories={selectedCategoryIds}
                onFilterChange={handleCategoryFilterChange}
                priceRange={priceRangeMemo}
                onPriceChange={setPriceRange}
                onApply={handleApplyFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with sort - desktop */}
            <div className="mb-6 hidden justify-between gap-4 sm:flex sm:items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchText
                    ? `Resultados para "${searchText}"`
                    : categoryParam
                      ? activeCategories.find((c: any) => selectedCategoryIds.includes(c.id))
                          ?.description || 'Productos'
                      : 'Todos los Productos'}
                </h1>
                <p className="mt-1 text-gray-600">{filteredProducts.length} productos</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="newest">Recién agregados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </div>
            </div>

            {/* Mobile filter button - sticky with more spacing */}
            <div className="sticky top-20 right-0 left-0 z-30 -mx-4 px-4 sm:-mx-6 sm:hidden sm:px-6 lg:-mx-8">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="my-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#254642] py-3 font-medium text-white"
              >
                <Filter size={20} />
                <span>Filtrar y Ordenar</span>
              </button>
            </div>

            {/* Mobile header */}
            <div className="mb-4 sm:hidden">
              <h1 className="text-xl font-bold text-gray-900">
                {searchText
                  ? `Resultados para "${searchText}"`
                  : categoryParam
                    ? activeCategories.find((c: any) => selectedCategoryIds.includes(c.id))
                        ?.description || 'Productos'
                    : 'Todos los Productos'}
              </h1>
              <p className="text-sm text-gray-600">{filteredProducts.length} productos</p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {filteredProducts.map((product, index) => {
                // E7: "out of stock" = no hay NINGUNA variant con stock > 0.
                // Las variants con stock 0 están ocultas en el shop.
                const variants = product.variants ?? [];
                const hasStock = variants.some((v) => v.stock > 0);
                const outOfStock = !hasStock;
                return (
                  <div
                    key={product.id}
                    className={`flex cursor-pointer flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md ${outOfStock ? 'border border-gray-300 opacity-60' : ''}`}
                    onClick={() => openProductModal(product)}
                  >
                    <div className="relative aspect-square w-full bg-gray-100">
                      {outOfStock && (
                        <div className="absolute top-2 left-2 z-10 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
                          Sin Stock
                        </div>
                      )}
                      {product.images?.[0] ? (
                        <ProductImagePreview
                          src={product.images[0].url}
                          alt={product.name}
                          transform={{
                            scale: product.images[0].scale || 1,
                            x: product.images[0].x || 0,
                            y: product.images[0].y || 0,
                          }}
                          fill
                          priority={index < 4}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          Sin Imagen
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <h3 className="truncate text-sm font-semibold text-gray-900">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 capitalize">
                        {product.category?.description}
                      </p>
                      <div className="mt-auto pt-2">
                        <span className="text-lg font-bold text-[#254642]">
                          ${product.price.toLocaleString('es-AR')}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, !!customizationStates[product.id]);
                        }}
                        disabled={outOfStock}
                        className={`mt-2 w-full rounded-lg py-2 text-sm font-medium ${outOfStock ? 'cursor-not-allowed bg-gray-400 text-gray-200' : 'bg-[#254642] text-white'}`}
                      >
                        {outOfStock
                          ? 'Sin Stock'
                          : variants.length > 1
                            ? 'Elegir opciones'
                            : 'Agregar'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-lg text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <ShopFilters
          categories={activeCategories}
          selectedCategories={selectedCategoryIds}
          onFilterChange={handleCategoryFilterChange}
          priceRange={priceRangeMemo}
          onPriceChange={setPriceRange}
          onApply={handleApplyFilters}
          isMobile
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
          sortBy={sortBy}
          onSortChange={(value) => setSortBy(value as SortOption)}
        />
      )}

      {selectedProduct && <ProductModal product={selectedProduct} onClose={closeProductModal} />}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
