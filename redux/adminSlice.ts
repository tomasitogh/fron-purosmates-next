import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/products`
    : 'http://localhost:8080/products';
const ORDERS_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/orders`
    : 'http://localhost:8080/api/v1/orders';

// Types
export interface Order {
    id: number;
    status: string;
    paymentStatus?: string;
    total: number;
    createdAt: string;
    items: any[];
    user?: {
        firstname: string;
        lastname: string;
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
    stock: number;
    category: {
        id: number;
    };
    images: {
        url: string;
        scale?: number;
        x?: number;
        y?: number;
    }[];
    active: boolean;
    isCustomizable?: boolean;
    customizationCost?: number;
}

interface AdminState {
    orders: Order[];
    loading: boolean;
    error: string | null;
    successMessage: string | null;
}

export const fetchAllOrders = createAsyncThunk(
    'admin/fetchAllOrders',
    async (token: string) => {
        const { data } = await axios.get(ORDERS_API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return data;
    }
);

// Thunk para actualizar un pedido (admin)
export const updateOrder = createAsyncThunk(
    'admin/updateOrder',
    async ({ orderId, status, paymentStatus, total, token }: {
        orderId: number;
        status: string;
        paymentStatus?: string;
        total: number;
        token: string;
    }) => {
        const { data } = await axios.put(`${ORDERS_API_URL}/${orderId}`, { status, paymentStatus, total }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return data;
    }
);

// Thunk para eliminar un pedido (admin)
export const deleteOrder = createAsyncThunk(
    'admin/deleteOrder',
    async ({ orderId, token }: { orderId: number; token: string }) => {
        await axios.delete(`${ORDERS_API_URL}/${orderId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return orderId;
    }
);

// Thunk para crear un producto
export const createProduct = createAsyncThunk(
    'admin/createProduct',
    async ({ productData, token }: { productData: ProductData; token: string }) => {
        const { data } = await axios.post(API_URL, productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return data;
    }
);

// Thunk para actualizar un producto
export const updateProduct = createAsyncThunk(
    'admin/updateProduct',
    async ({ productId, productData, token }: {
        productId: number;
        productData: ProductData;
        token: string;
    }) => {
        const { data } = await axios.put(`${API_URL}/${productId}`, productData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return data;
    }
);

// Thunk para eliminar un producto
export const deleteProduct = createAsyncThunk(
    'admin/deleteProduct',
    async ({ productId, token }: { productId: number; token: string }) => {
        await axios.delete(`${API_URL}/${productId}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        return productId;
    }
);

const adminSlice = createSlice({
    name: "admin",
    initialState: {
        orders: [],
        loading: false,
        error: null,
        successMessage: null
    } as AdminState,
    reducers: {
        clearAdminMessages: (state) => {
            state.error = null;
            state.successMessage = null;
        }
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
                const index = state.orders.findIndex(o => o.id === action.payload.id);
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
                state.orders = state.orders.filter(order => order.id !== action.payload);
            })
            .addCase(deleteOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al eliminar pedido';
            });
    }
});

export const { clearAdminMessages } = adminSlice.actions;
export default adminSlice.reducer;
