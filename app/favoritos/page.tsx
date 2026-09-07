'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchFavorites } from '@/redux/favoritesSlice';
import { normalizeProduct, Product } from '@/redux/productSlice';
import ProductImagePreview from '@/components/ProductImagePreview';
import FavoriteButton from '@/components/FavoriteButton';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export default function FavoritosPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, getToken } = useAuth();
  const { ids, loading: favoritesLoading } = useAppSelector((state) => state.favorites);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      dispatch(fetchFavorites(getToken));
    }
  }, [authLoading, isAuthenticated, dispatch, getToken]);

  useEffect(() => {
    if (ids.length === 0 || !isAuthenticated) return;

    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        const allProducts = data.map(normalizeProduct);
        const favoriteProducts = allProducts.filter((p: Product) => ids.includes(p.id));
        setProducts(favoriteProducts);
      } catch {
        // silently fail
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [ids, isAuthenticated]);

  if (authLoading) {
    return (
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#254642] border-t-transparent" />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <Heart className="h-16 w-16 text-[#254642]" strokeWidth={1.5} />
        <h1 className="mt-6 text-3xl font-bold text-[#254642]">Tus favoritos</h1>
        <p className="mt-3 max-w-md text-gray-600">
          Iniciá sesión para ver y guardar tus productos favoritos.
        </p>
        <Link
          href="/shop"
          className="mt-8 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
        >
          Explorar la tienda
        </Link>
      </section>
    );
  }

  const isLoading = favoritesLoading || loadingProducts;

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#254642]">Tus favoritos</h1>
          <p className="mt-2 text-gray-600">
            {ids.length === 0
              ? 'Todavía no guardaste ningún producto como favorito.'
              : `${ids.length} producto${ids.length === 1 ? '' : 's'} guardado${ids.length === 1 ? '' : 's'}`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#254642] border-t-transparent" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4">
            {products.map((product) => {
              const variants = product.variants ?? [];
              const hasStock = variants.some((v) => v.stock > 0);
              const outOfStock = !hasStock;

              return (
                <div
                  key={product.id}
                  className={`flex cursor-pointer flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md ${outOfStock ? 'border border-gray-300 opacity-60' : ''}`}
                  onClick={() => router.push(`/shop?producto=${product.slug || product.name}`)}
                >
                  <div className="relative aspect-square w-full bg-gray-100">
                    {outOfStock && (
                      <div className="absolute top-2 left-2 z-10 rounded-md bg-red-600 px-2 py-1 text-xs font-bold text-white">
                        Sin Stock
                      </div>
                    )}
                    <FavoriteButton productId={product.id} />
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
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        Sin Imagen
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <h3 className="truncate text-sm font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {product.category?.description}
                    </p>
                    <div className="mt-auto pt-2">
                      <span className="text-lg font-bold text-[#254642]">
                        ${product.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Heart className="h-12 w-12 text-gray-300" strokeWidth={1.5} />
            <p className="mt-4 text-lg text-gray-500">No tenés productos guardados todavía.</p>
            <Link
              href="/shop"
              className="mt-6 rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-[#254642] transition hover:bg-[#DAA520]"
            >
              Explorar la tienda
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
