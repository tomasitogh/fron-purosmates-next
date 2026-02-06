import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/categories`;

interface Category {
    id: number;
    description: string;
    // Add other properties as needed
}

interface CategoryState {
    items: Category[];
    loading: boolean;
    error: string | null;
}

const initialState: CategoryState = {
    items: [],
    loading: false,
    error: null
};

// Thunk para obtener todas las categorías
export const fetchCategories = createAsyncThunk('categories/fetchCategories', async (token?: string) => {
    const config = token ? {
        headers: { 'Authorization': `Bearer ${token}` }
    } : {};

    // We can use the proxy URL if running on client side to avoid CORS, 
    // but for now keeping consistency with other slices which use direct URL for server actions or full URL
    // If this is client side fetch, ideally we use /api/v1/categories if configured, but let's stick to base url for now
    const { data } = await axios.get(API_URL, config);
    return (data.content || data) as Category[];
});

const categorySlice = createSlice({
    name: "categories",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCategories.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
                state.loading = false;
                state.items = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al cargar categorías';
            });
    }
});

export default categorySlice.reducer;
