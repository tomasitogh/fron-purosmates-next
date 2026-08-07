import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/products`;

// --- Tipos de variantes (D1 + E7) ---

export interface ProductVariant {
  id: number;
  sku: string;
  name: string;
  stock: number;
  imageUrl?: string;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  /**
   * @deprecated El backend ahora persiste stock por variante. Mantenemos este
   * campo para no romper la UI vieja (`ShopContent`, `cartSlice`,
   * `AdminProducts`) — el thunk lo popula desde `totalStock` de la respuesta.
   * Nuevo código debería usar `totalStock` o sumar el `stock` de las variantes.
   * Se borra en una fase posterior.
   */
  stock: number;
  /** Suma de stock de variantes activas (derivado en el backend). */
  totalStock?: number;
  images: {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
    // Dirección nueva: FK lógica a la variant. Null = imagen genérica.
    variantId?: number | null;
  }[];
  active: boolean;
  category?: {
    id: number;
    description: string;
  };
  isCustomizable?: boolean;
  customizationCost?: number;
  // --- Variantes (D1) ---
  variants: ProductVariant[];
  slug?: string;
}

interface ProductState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  items: [],
  loading: false,
  error: null,
};

/**
 * Shape crudo de la respuesta del backend antes de normalización. Es un
 * super-set de campos posibles para tolerar los dos shapes de `category` que
 * coexisten transitoriamente (nested object viejo, planos nuevos de B3) y
 * futuros cambios. Todo se valida con typeof/Array.isArray en el normalizador.
 */
interface RawProductResponse {
  id?: number | string;
  name?: string;
  description?: string;
  price?: number | string;
  totalStock?: number;
  stock?: number;
  images?: Product['images'];
  active?: boolean;
  category?: Product['category'];
  categoryId?: number | string;
  categoryName?: string;
  isCustomizable?: boolean;
  customizationCost?: number | string;
  variants?: ProductVariant[];
  slug?: string;
}

/**
 * Normaliza la respuesta cruda del backend al shape del `Product` del cliente.
 * Se encarga de:
 *   - Copiar `totalStock` → `stock` (compat con UI vieja).
 *   - Derivar `totalStock` desde la suma de `variants[].stock` si el backend no lo trae.
 *   - Default `variants` y `attributeDefinitions` a `[]` para que el resto del
 *     código pueda hacer `.map()` sin optional chaining.
 *   - Reconstruir el `category: {id, description}` desde los nuevos campos
 *     planos `categoryId` / `categoryName` (B3 cambió el shape).
 */
export function normalizeProduct(raw: RawProductResponse): Product {
  const variants: ProductVariant[] = Array.isArray(raw.variants) ? raw.variants : [];
  const computedTotal = variants.reduce((sum, v) => sum + (Number(v?.stock) || 0), 0);
  const totalStock: number = typeof raw.totalStock === 'number' ? raw.totalStock : computedTotal;

  const category: Product['category'] = raw.category
    ? raw.category
    : raw.categoryId != null
      ? { id: Number(raw.categoryId), description: raw.categoryName ?? '' }
      : undefined;

  return {
    id: Number(raw.id),
    name: raw.name ?? '',
    description: raw.description ?? '',
    price: Number(raw.price ?? 0),
    stock: totalStock, // back-compat: la UI vieja lee product.stock
    totalStock,
    images: Array.isArray(raw.images) ? raw.images : [],
    active: Boolean(raw.active ?? true),
    category,
    isCustomizable: Boolean(raw.isCustomizable),
    customizationCost: raw.customizationCost != null ? Number(raw.customizationCost) : undefined,
    variants,
    slug: raw.slug,
  };
}

// Thunk para obtener productos activos (para clientes)
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const { data } = await axios.get(API_URL);
  return (Array.isArray(data) ? data : []).map(normalizeProduct);
});

// Thunk para obtener TODOS los productos (activos e inactivos - solo admin)
export const fetchAllProductsAdmin = createAsyncThunk(
  'products/fetchAllProductsAdmin',
  async (getToken: TokenGetter) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.get(`${API_URL}/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    return (Array.isArray(data) ? data : []).map(normalizeProduct);
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchProducts (solo activos)
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar productos';
      })
      // fetchAllProductsAdmin (todos, activos e inactivos)
      .addCase(fetchAllProductsAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllProductsAdmin.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAllProductsAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar productos de admin';
      });
  },
});

export default productSlice.reducer;
