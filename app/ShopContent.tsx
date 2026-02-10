'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/cartSlice';
import FilterTabs from '@/components/FilterTabs';
import { useAuth } from '@/context/AuthContext';
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
  const { isAuthenticated } = useAuth();

  const [filteredMates, setFilteredMates] = useState<Product[]>(initialProducts);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100000);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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
            <div className="relative h-96 bg-gray-200 rounded-lg mb-4 overflow-hidden">
              {selectedProduct.images?.[0] && (
                <ProductImagePreview
                  src={selectedProduct.images[0].url}
                  alt={selectedProduct.name}
                  transform={{
                    scale: selectedProduct.images[0].scale || 1,
                    x: selectedProduct.images[0].x || 0,
                    y: selectedProduct.images[0].y || 0
                  }}
                  fill
                  className="rounded-lg"
                />
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
