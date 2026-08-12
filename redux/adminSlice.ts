import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { revalidateStorefront } from '@/lib/actions/revalidate.actions';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';
import type { ProductVariant } from './productSlice';

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`
  : 'http://localhost:8080/products';
const ORDERS_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/orders`
  : 'http://localhost:8080/api/v1/orders';
const STOCK_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products/stock/bulk`
  : 'http://localhost:8080/products/stock/bulk';

// Types
export interface OrderItem {
  id: number;
  quantity: number;
  price: number;
  hasCustomization?: boolean;
  // --- Variante (H1) — snapshot del backend C5 ---
  // `variantAttributes` viene como Map<String,String> en el JSON (Jackson
  // serializa Map nativamente, no necesita parse).
  variantId?: number;
  variantSku?: string;
  variantAttributes?: Record<string, string>;
  variantImageUrl?: string;
  // Snapshot del producto (ProductSummaryDTO del backend) para mostrar en UI
  product?: {
    id?: number;
    name: string;
    imageUrl?: string;
    customizationCost?: number;
  };
}

export interface Order {
  id: number;
  status: string;
  paymentStatus?: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
  user?: {
    name: string;
    email: string;
    phoneNumber?: string;
  };
  guestFirstname?: string;
  guestLastname?: string;
  guestEmail?: string;
  guestPhone?: string;
}

export interface ProductData {
  name: string;
  description: string;
  price: number;
  /**
   * @deprecated Removido del form en E3. El stock vive en `variants[].stock`.
   * El backend ignora este campo desde A5. Queda opcional en el type para
   * no romper consumidores viejos; nuevo código no lo setea.
   */
  stock?: number;
  // El backend (`ProductPayload`) espera `categoryId: Long` flat. Antes E3-fix
  // el form mandaba `category: {id: N}` (shape viejo, no matcheaba) y el
  // backend tiraba 400 en cada submit. Ahora se manda `categoryId` flat.
  categoryId: number;
  images: {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
    // E6: dirección imagen→variant. Null = imagen genérica.
    variantId?: number | null;
  }[];
  active: boolean;
  isCustomizable?: boolean;
  customizationCost?: number;
  // --- Variantes (D2 + E3 + E7) ---
  // E7: las variants son independientes con `name` libre. El backend crea
  // un default variant si la lista viene vacía.
  variants?: ProductVariant[];
}

interface AdminState {
  orders: Order[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export interface StockUpdateItem {
  sku: string;
  quantity: number;
}

export interface StockUpdateResponse {
  updated: number;
  notFoundSkus: string[];
}

export const fetchAllOrders = createAsyncThunk(
  'admin/fetchAllOrders',
  async (getToken: TokenGetter) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.get(ORDERS_API_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    );
    return data;
  }
);

// Thunk para actualizar un pedido (admin)
export const updateOrder = createAsyncThunk(
  'admin/updateOrder',
  async ({
    orderId,
    status,
    paymentStatus,
    total,
    getToken,
  }: {
    orderId: number;
    status: string;
    paymentStatus?: string;
    total: number;
    getToken: TokenGetter;
  }) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.put(
        `${ORDERS_API_URL}/${orderId}`,
        { status, paymentStatus, total },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      )
    );
    return data;
  }
);

// Thunk para eliminar un pedido (admin)
export const deleteOrder = createAsyncThunk(
  'admin/deleteOrder',
  async ({ orderId, getToken }: { orderId: number; getToken: TokenGetter }) => {
    await withAuthRetry(getToken, (token) =>
      axios.delete(`${ORDERS_API_URL}/${orderId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    return orderId;
  }
);

// Thunk para crear un producto
export const createProduct = createAsyncThunk(
  'admin/createProduct',
  async ({ productData, getToken }: { productData: ProductData; getToken: TokenGetter }) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.post(API_URL, productData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    revalidateStorefront(['/shop']).catch((e) => console.error('Error revalidating /shop:', e));
    return data;
  }
);

// Thunk para actualizar un producto
export const updateProduct = createAsyncThunk(
  'admin/updateProduct',
  async ({
    productId,
    productData,
    getToken,
  }: {
    productId: number;
    productData: ProductData;
    getToken: TokenGetter;
  }) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.put(`${API_URL}/${productId}`, productData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    revalidateStorefront(['/shop']).catch((e) => console.error('Error revalidating /shop:', e));
    return data;
  }
);

// Thunk para eliminar un producto
export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async ({ productId, getToken }: { productId: number; getToken: TokenGetter }) => {
    await withAuthRetry(getToken, (token) =>
      axios.delete(`${API_URL}/${productId}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    revalidateStorefront(['/shop']).catch((e) => console.error('Error revalidating /shop:', e));
    return productId;
  }
);

// Thunk para actualización masiva de stock
export const bulkUpdateStock = createAsyncThunk(
  'admin/bulkUpdateStock',
  async ({ updates, getToken }: { updates: StockUpdateItem[]; getToken: TokenGetter }) => {
    const { data } = await withAuthRetry(getToken, (token) =>
      axios.patch<StockUpdateResponse>(STOCK_API_URL, updates, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );
    return data;
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    orders: [],
    loading: false,
    error: null,
    successMessage: null,
  } as AdminState,
  reducers: {
    clearAdminMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(createProduct.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Producto creado exitosamente';
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al crear producto';
      })
      // Update Product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateProduct.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Producto actualizado exitosamente';
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar producto';
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteProduct.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = 'Producto eliminado exitosamente';
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al eliminar producto';
      })
      // Fetch Orders
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar pedidos';
      })
      // Update Order
      .addCase(updateOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(updateOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Pedido actualizado exitosamente';
        const index = state.orders.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar pedido';
      })
      // Delete Order
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = 'Pedido eliminado exitosamente';
        state.orders = state.orders.filter((order) => order.id !== action.payload);
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al eliminar pedido';
      })
      // Bulk Update Stock
      .addCase(bulkUpdateStock.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(bulkUpdateStock.fulfilled, (state, action) => {
        state.loading = false;
        const { updated, notFoundSkus } = action.payload;
        if (notFoundSkus.length > 0) {
          state.error = `SKUs no encontrados: ${notFoundSkus.join(', ')}`;
        }
        state.successMessage = `Stock actualizado para ${updated} variante(s)`;
      })
      .addCase(bulkUpdateStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al actualizar stock';
      });
  },
});

export const { clearAdminMessages } = adminSlice.actions;
export default adminSlice.reducer;
