'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { RootState } from "@/redux/store";
import { addToCart } from '@/redux/cartSlice';
import toast from 'react-hot-toast';
import FilterTabs from '@/components/FilterTabs';
import { useUser } from '@clerk/nextjs';
import AuthModal from '@/components/AuthModal';
import Image from 'next/image';
import ProductImagePreview from '@/components/ProductImagePreview';
import { slugify } from '@/lib/slugify';
import ProductModal, { Product } from '@/components/ProductModal';

interface ShopContentProps {
  initialProducts: Product[];
  initialCategories: any[];
}

export default function ShopContent({ initialProducts, initialCategories }: ShopContentProps) {
  console.log('ShopContent initialProducts:', initialProducts);
  console.log('ShopContent initialCategories:', initialCategories);
  const dispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn, isLoaded } = useUser();
  const isAuthenticated = isLoaded && isSignedIn;

  const [filteredMates, setFilteredMates] = useState<Product[]>(initialProducts);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [wantsCustomization, setWantsCustomization] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customizationStates, setCustomizationStates] = useState<Record<number, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const searchText = useMemo(() => {
    return (searchParams.get('q') || '').trim().toLowerCase();
  }, [searchParams]);

  const categoryFromUrl = useMemo(() => {
    return searchParams.get('category') || null;
  }, [searchParams]);

  const productSlugFromUrl = useMemo(() => {
    return searchParams.get('producto') || null;
  }, [searchParams]);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedType([categoryFromUrl]);
    }
  }, [categoryFromUrl]);

  // Estado derivado para el producto seleccionado basado en la URL
  const selectedProduct = useMemo(() => {
    if (!productSlugFromUrl) return null;
    return initialProducts.find(p => (p.slug || slugify(p.name)) === productSlugFromUrl) || null;
  }, [productSlugFromUrl, initialProducts]);

  // Resetear estados auxiliares cuando cambia el producto seleccionado
  useEffect(() => {
    if (selectedProduct) {
      setWantsCustomization(false);
      setSelectedImageIndex(0);
      setTimeout(() => scrollToImage(0), 0);
    }
  }, [selectedProduct?.id]);


  useEffect(() => {
    if (initialProducts.length > 0) {
      const prices = initialProducts.map(p => p.price);
      const min = Math.floor(Math.min(...prices));
      const max = Math.ceil(Math.max(...prices));
      setMinPrice(min);
      setMaxPrice(max);
      setPriceRange([min, max]);
    }
  }, [initialProducts]);

  useEffect(() => {
    let list = selectedType.length === 0
      ? initialProducts
      : initialProducts.filter(p => selectedType.includes(p.category?.description?.toLowerCase() || ''));

    if (searchText) {
      list = list.filter(p => p.name.toLowerCase().includes(searchText));
    }

    list = list.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    setFilteredMates(list);
  }, [selectedType, searchText, priceRange, initialProducts]);

  // Función helper para scrollear a una imagen específica
  const scrollToImage = (index: number) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const width = container.clientWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
    }
  };

  const handleAddToCart = (product: any, withCustomization: boolean = false) => {
    dispatch(addToCart({ ...product, qty: 1, hasCustomization: withCustomization }) as any);
    toast.success(`Agregado: ${product.name}${withCustomization ? ' (Personalizado)' : ''}`);
  };

  const openProductModal = (product: Product) => {
    const slug = product.slug || slugify(product.name);
    // Actualizar URL directamente sin navegar (shallow routing)
    const newUrl = `/?producto=${slug}`;
    router.push(newUrl, { scroll: false });
    // setSelectedProduct removed - derived from URL
    // setWantsCustomization(false); // Handled by useEffect
    // setSelectedImageIndex(0); // Handled by useEffect
    // setTimeout(() => scrollToImage(0), 0); // Handled by useEffect
  };

  const closeProductModal = () => {
    // Remover el query param 'producto' de la URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('producto');
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
    // setSelectedProduct(null) removed - derived from URL
    // setWantsCustomization(false); // Handled by useEffect (modal unmounts)
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Filtros</h3>
              <FilterTabs
                categories={initialCategories
                  .map(c => c.description)
                  .sort((a, b) => {
                    const order = ['mate', 'bombilla', 'accesorio'];
                    const indexA = order.indexOf(a.toLowerCase());
                    const indexB = order.indexOf(b.toLowerCase());
                    // If both are in the known list, sort by index
                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    // If only A is known, it comes first
                    if (indexA !== -1) return -1;
                    // If only B is known, it comes first
                    if (indexB !== -1) return 1;
                    // Otherwise sort alphabetically
                    return a.localeCompare(b);
                  })}
                selectedType={selectedType}
                onFilterChange={setSelectedType}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="!text-2xl font-bold text-gray-900">
                {searchText ? `Resultados para "${searchText}"` : 'Todos los Productos'}
              </h1>
              <p className="text-gray-600 mt-1">{filteredMates.length} productos encontrados</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredMates.map((product, index) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer max-w-[281px] mx-auto w-full flex flex-col h-full"
                  onClick={() => openProductModal(product)}
                >
                  <div className="relative w-full aspect-square bg-gray-200">
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
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{product.category?.description}</p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 flex-1">
                      <div className="flex flex-col w-full gap-3 h-full">
                        <div className="flex items-center justify-between">
                          <span className="text-lg sm:text-xl font-bold text-[#254642]">
                            ${(product.price + (customizationStates[product.id] ? (product.customizationCost || 0) : 0)).toLocaleString('es-AR')}
                          </span>
                        </div>

                        {product.isCustomizable && (
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              id={`card-customization-${product.id}`}
                              checked={!!customizationStates[product.id]}
                              onChange={(e) => {
                                setCustomizationStates(prev => ({
                                  ...prev,
                                  [product.id]: e.target.checked
                                }));
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                            />
                            <label
                              htmlFor={`card-customization-${product.id}`}
                              className="text-sm text-gray-600 cursor-pointer select-none"
                            >
                              Personalizar (+${product.customizationCost?.toLocaleString('es-AR')})
                            </label>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product, !!customizationStates[product.id]);
                          }}
                          className="bg-[#254642] text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg hover:bg-[#254642]/90 transition w-full font-semibold mt-auto"
                        >
                          {customizationStates[product.id] ? 'Agregar Personalizado' : 'Agregar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredMates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={closeProductModal}
        />
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
