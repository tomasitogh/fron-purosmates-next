'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/cartSlice';
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
}

interface ShopContentProps {
  initialProducts: Product[];
  initialCategories: any[];
}

export default function ShopContent({ initialProducts }: ShopContentProps) {
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  // Abrir modal automáticamente si hay un slug en la URL
  useEffect(() => {
    if (productSlugFromUrl && initialProducts.length > 0) {
      // Solo abrir si el modal no está ya abierto con ese producto
      if (!selectedProduct || (selectedProduct.slug || slugify(selectedProduct.name)) !== productSlugFromUrl) {
        const product = initialProducts.find(
          p => (p.slug || slugify(p.name)) === productSlugFromUrl
        );
        if (product) {
          setSelectedProduct(product);
          setSelectedImageIndex(0);
          // Resetear scroll
          setTimeout(() => scrollToImage(0), 0);
        }
      }
    }
  }, [productSlugFromUrl, initialProducts]);

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

  const handleAddToCart = (product: Product) => {
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    dispatch(addToCart(product) as any);
  };

  const openProductModal = (product: Product) => {
    const slug = product.slug || slugify(product.name);
    // Actualizar URL directamente sin navegar (shallow routing)
    const newUrl = `/?producto=${slug}`;
    router.push(newUrl, { scroll: false });
    setSelectedProduct(product);
    setSelectedImageIndex(0);
    // Resetear scroll
    setTimeout(() => scrollToImage(0), 0);
  };

  const closeProductModal = () => {
    // Remover el query param 'producto' de la URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete('producto');
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Filtros</h3>
              <FilterTabs selectedType={selectedType} onFilterChange={setSelectedType} />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchText ? `Resultados para "${searchText}"` : 'Todos los Productos'}
              </h2>
              <p className="text-gray-600 mt-1">{filteredMates.length} productos encontrados</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMates.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
                  onClick={() => openProductModal(product)}
                >
                  <div className="relative h-64 bg-gray-200">
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
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#2d5d52]">
                        ${product.price.toLocaleString('es-AR')}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        className="bg-[#2d5d52] text-white px-4 py-2 rounded-lg hover:bg-[#2d5d52]/90 transition"
                      >
                        Agregar
                      </button>
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
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={closeProductModal}
        >
          <div
            className="bg-white rounded-lg max-w-2xl w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
              <button
                onClick={closeProductModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-4 mb-4">
              <div className="relative group">
                {/* Scrollable Container */}
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth h-96 bg-gray-200 rounded-lg"
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
                    selectedProduct.images.map((image, index) => (
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
                        // Cycle backwards
                        const newIndex = selectedImageIndex === 0 ? selectedProduct.images.length - 1 : selectedImageIndex - 1;
                        scrollToImage(newIndex);
                      }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                      aria-label="Anterior"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Cycle forwards
                        const newIndex = selectedImageIndex === selectedProduct.images.length - 1 ? 0 : selectedImageIndex + 1;
                        scrollToImage(newIndex);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                      aria-label="Siguiente"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                  {selectedProduct.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToImage(index)}
                      className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
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
            <p className="text-gray-700 mb-4">{selectedProduct.description || 'Sin descripción'}</p>
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-[#2d5d52]">
                ${selectedProduct.price.toLocaleString('es-AR')}
              </span>
              <button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  closeProductModal();
                }}
                className="bg-[#2d5d52] text-white px-6 py-3 rounded-lg hover:bg-[#2d5d52]/90 transition"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
