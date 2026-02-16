'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { RootState } from "@/redux/store";
import { addToCart } from '@/redux/cartSlice';
import toast from 'react-hot-toast';
import FilterTabs from '@/components/FilterTabs';
import { useSession } from 'next-auth/react';
import AuthModal from '@/components/AuthModal';
import Image from 'next/image';
import ProductImagePreview from '@/components/ProductImagePreview';
import { slugify } from '@/lib/slugify';

interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  images: {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
  }[];
  category: { id: number; description: string };
  stock: number;
  description?: string;
  isCustomizable?: boolean;
  customizationCost?: number;
}

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
  const { data: session } = useSession();
  const isAuthenticated = !!session;

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
      : initialProducts.filter(p => selectedType.includes(p.category?.description?.toLowerCase()));

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
              <h1 className="text-2xl font-bold text-gray-900">
                {searchText ? `Resultados para "${searchText}"` : 'Todos los Productos'}
              </h1>
              <p className="text-gray-600 mt-1">{filteredMates.length} productos encontrados</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {filteredMates.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer max-w-[281px] mx-auto w-full"
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
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Sin Imagen
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{product.category?.description}</p>
                    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="flex flex-col w-full gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-lg sm:text-xl font-bold text-[#2d5d52]">
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
                          className="bg-[#2d5d52] text-white px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base rounded-lg hover:bg-[#2d5d52]/90 transition w-full font-semibold"
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

      {/* Product Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closeProductModal}
        >
          <div
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button - Sticky/Absolute */}
            <button
              onClick={closeProductModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 z-10"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                {/* Left Column: Image Section */}
                <div className="flex flex-col gap-4 mt-12 lg:mt-0">
                  <div className="relative group max-w-[420px] lg:max-w-none w-4/5 lg:w-full mx-auto">
                    {/* Scrollable Container */}
                    <div
                      ref={scrollContainerRef}
                      className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth w-full aspect-square bg-gray-200 rounded-xl"
                      onScroll={(e) => {
                        const container = e.currentTarget;
                        const width = container.clientWidth;
                        const newIndex = Math.round(container.scrollLeft / width);
                        if (newIndex !== selectedImageIndex && selectedProduct.images && newIndex < selectedProduct.images.length) {
                          setSelectedImageIndex(newIndex);
                        }
                      }}
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {selectedProduct.images && selectedProduct.images.length > 0 ? (
                        selectedProduct.images.map((image: any, index: number) => (
                          <div key={index} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative bg-gray-200">
                            <ProductImagePreview
                              src={image.url}
                              alt={`${selectedProduct.name} ${index + 1}`}
                              transform={{
                                scale: image.scale || 1,
                                x: image.x || 0,
                                y: image.y || 0
                              }}
                              className="object-contain w-full h-full"
                              fill
                              priority={index === 0}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 snap-center flex-shrink-0">
                          Sin Imagen
                        </div>
                      )}
                    </div>

                    {/* Navigation Arrows (Desktop/Hover) */}
                    {selectedProduct.images && selectedProduct.images.length > 1 && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = selectedImageIndex === 0 ? selectedProduct.images.length - 1 : selectedImageIndex - 1;
                            scrollToImage(newIndex);
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const newIndex = selectedImageIndex === selectedProduct.images.length - 1 ? 0 : selectedImageIndex + 1;
                            scrollToImage(newIndex);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 justify-center lg:justify-start">
                      {selectedProduct.images.map((image: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => scrollToImage(index)}
                          className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                            ? 'border-[#2d5d52] opacity-100 ring-2 ring-[#2d5d52] ring-offset-1'
                            : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                          <ProductImagePreview
                            src={image.url}
                            alt={`${selectedProduct.name} ${index + 1}`}
                            transform={{
                              scale: image.scale || 1,
                              x: image.x || 0,
                              y: image.y || 0
                            }}
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Details Section */}
                <div className="flex flex-col h-full lg:pt-4">
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">{selectedProduct.name}</h2>
                    <p className="text-[#2d5d52] font-medium tracking-wide flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#2d5d52] rounded-full"></span>
                      {selectedProduct.category?.description || 'Producto'}
                    </p>
                  </div>

                  <div className="flex-grow">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Descripción</h4>
                    <p className="text-gray-600 leading-relaxed max-h-[200px] overflow-y-auto scrollbar-hide">
                      {selectedProduct.description || 'Este producto no tiene una descripción detallada todavía.'}
                    </p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Precio</p>
                        <span className="text-4xl font-black text-[#2d5d52]">
                          ${selectedProduct.price.toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                    {/* Customization Checkbox - Only if product is customizable */}
                    {selectedProduct.isCustomizable && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="modal-customization"
                            checked={wantsCustomization}
                            onChange={(e) => setWantsCustomization(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <label htmlFor="modal-customization" className="font-medium text-gray-900 cursor-pointer select-none">
                              Quiero personalizar este producto
                            </label>
                            <p className="text-sm text-gray-500 mt-1">
                              Agrega un grabado o detalle personalizado por <span className="font-bold text-blue-600">+${selectedProduct.customizationCost?.toLocaleString('es-AR')}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-bold text-gray-900 text-xl mt-4">
                      <span>Total:</span>
                      <span>${(selectedProduct.price + (wantsCustomization ? (selectedProduct.customizationCost || 0) : 0)).toLocaleString('es-AR')}</span>
                    </div>

                    <button
                      onClick={() => {
                        handleAddToCart(selectedProduct, wantsCustomization);
                        closeProductModal();
                      }}
                      className="w-full bg-[#2d5d52] text-white py-3 rounded-lg hover:bg-[#2d5d52]/90 transition font-semibold mt-4"
                    >
                      Agregar al Carrito
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
