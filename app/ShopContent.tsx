'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { RootState } from "@/redux/store";
import { addToCart } from '@/redux/cartSlice';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';
import AuthModal from '@/components/AuthModal';
import ProductImagePreview from '@/components/ProductImagePreview';
import { slugify } from '@/lib/slugify';
import ProductModal, { Product } from '@/components/ProductModal';
import ShopFilters from '@/components/ShopFilters';
import { Filter } from 'lucide-react';

interface ShopContentProps {
  initialProducts: Product[];
  initialCategories: any[];
}

type SortOption = 'relevance' | 'newest' | 'price-asc' | 'price-desc';

export default function ShopContent({ initialProducts, initialCategories }: ShopContentProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [customizationStates, setCustomizationStates] = useState<Record<number, boolean>>({});
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const searchText = useMemo(() => {
    return (searchParams.get('q') || '').trim().toLowerCase();
  }, [searchParams]);

  const productSlugFromUrl = useMemo(() => {
    return searchParams.get('producto') || null;
  }, [searchParams]);

  const priceRangeMemo = useMemo(() => {
    if (initialProducts.length > 0) {
      const prices = initialProducts.map(p => p.price);
      return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))] as [number, number];
    }
    return [0, 100000] as [number, number];
  }, [initialProducts]);

  const activeCategories = useMemo(() => {
    return initialCategories
      .filter((c: any) => c.active)
      .map((c: any) => ({ id: c.id, description: c.description, active: c.active }));
  }, [initialCategories]);

  const filteredProducts = useMemo(() => {
    let list = [...initialProducts];

    if (selectedCategoryIds.length > 0) {
      list = list.filter(p =>
        p.category?.id && selectedCategoryIds.includes(p.category.id)
      );
    }

    if (searchText) {
      list = list.filter(p => p.name.toLowerCase().includes(searchText));
    }

    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      default:
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }

    return list;
  }, [initialProducts, selectedCategoryIds, searchText, priceRange, sortBy]);

  const selectedProduct = useMemo(() => {
    if (!productSlugFromUrl) return null;
    return initialProducts.find(p => (p.slug || slugify(p.name)) === productSlugFromUrl) || null;
  }, [productSlugFromUrl, initialProducts]);

  const handleApplyFilters = useCallback(() => {
    // Los estados ya se actualizaron automáticamente
  }, []);

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

  const handleAddToCart = (product: any, withCustomization: boolean = false) => {
    dispatch(addToCart({ ...product, qty: 1, hasCustomization: withCustomization }) as any);
    toast.success(`Agregado: ${product.name}${withCustomization ? ' (Personalizado)' : ''}`);
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block lg:w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ShopFilters
                categories={activeCategories}
                selectedCategories={selectedCategoryIds}
                onFilterChange={setSelectedCategoryIds}
                priceRange={priceRangeMemo}
                onPriceChange={setPriceRange}
                onApply={handleApplyFilters}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header with sort - desktop */}
            <div className="hidden sm:flex sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {searchText ? `Resultados para "${searchText}"` : 'Todos los Productos'}
                </h1>
                <p className="text-gray-600 mt-1">{filteredProducts.length} productos</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="newest">Recién agregados</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </div>
            </div>

            {/* Mobile filter button - sticky with more spacing */}
            <div className="sm:hidden sticky top-20 left-0 right-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6">
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#254642] text-white font-medium rounded-lg my-3"
              >
                <Filter size={20} />
                <span>Filtrar y Ordenar</span>
              </button>
            </div>

            {/* Mobile header */}
            <div className="sm:hidden mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                {searchText ? `Resultados para "${searchText}"` : 'Todos los Productos'}
              </h1>
              <p className="text-gray-600 text-sm">{filteredProducts.length} productos</p>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {filteredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col"
                  onClick={() => openProductModal(product)}
                >
                  <div className="relative w-full aspect-square bg-gray-100">
                    {product.images?.[0] ? (
                      <ProductImagePreview
                        src={product.images[0].url}
                        alt={product.name}
                        transform={{
                          scale: product.images[0].scale || 1,
                          x: product.images[0].x || 0,
                          y: product.images[0].y || 0
                        }}
                        fill
                        priority={index < 4}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin Imagen
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{product.category?.description}</p>
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
                      className="mt-2 w-full bg-[#254642] text-white py-2 rounded-lg text-sm font-medium"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
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
          onFilterChange={setSelectedCategoryIds}
          priceRange={priceRangeMemo}
          onPriceChange={setPriceRange}
          onApply={handleApplyFilters}
          isMobile
          onCloseMobile={() => setIsMobileFiltersOpen(false)}
          sortBy={sortBy}
          onSortChange={(value) => setSortBy(value as SortOption)}
        />
      )}

      {selectedProduct && (
        <ProductModal product={selectedProduct} onClose={closeProductModal} />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}