import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/products`;

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: {
        url: string;
        scale?: number;
        x?: number;
        y?: number;
    }[];
    active: boolean;
    category?: {
        id: number;
        description: string;
    };
    isCustomizable?: boolean;
    customizationCost?: number;
}

interface ProductState {
    items: Product[];
    loading: boolean;
    error: string | null;
}

const initialState: ProductState = {
    items: [],
    loading: false,
    error: null
};

// Thunk para obtener productos activos (para clientes)
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
    const { data } = await axios.get(API_URL);
    return data as Product[];
});

// Thunk para obtener TODOS los productos (activos e inactivos - solo admin)
export const fetchAllProductsAdmin = createAsyncThunk(
    'products/fetchAllProductsAdmin',
    async (token: string) => {
        const { data } = await axios.get(`${API_URL}/admin/all`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return data as Product[];
    }
);

const productSlice = createSlice({
    name: "products",
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
    }
});

export default productSlice.reducer;
