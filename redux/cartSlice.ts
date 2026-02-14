import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Types
export interface CartItem {
    id: number;
    name: string;
    price: number;
    images: {
        url: string;
        scale?: number;
        x?: number;
        y?: number;
    }[];
    category?: {
        id: number;
        description: string;
    };
    stock: number;
    qty: number;
}

interface CartState {
    items: CartItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// Helper to get initial state from localStorage (client-side only)
const getInitialCart = (): CartItem[] => {
    if (typeof window === 'undefined') return [];
    try {
        return JSON.parse(localStorage.getItem("cart_items") || "[]");
    } catch {
        return [];
    }
};

const initialState: CartState = {
    items: getInitialCart(),
    status: 'idle',
    error: null
};

// Async Thunk for adding items
export const addToCart = createAsyncThunk(
    'cart/addToCart',
    async (product: Omit<CartItem, 'qty'>, { getState, rejectWithValue }) => {
        // Verificar si el producto tiene stock
        if (!product.stock || product.stock <= 0) {
            toast.error('Este producto no tiene stock disponible');
            return rejectWithValue('No stock available');
        }

        const state = getState() as { cart: CartState };
        const existingItem = state.cart.items.find(p => p.id === product.id);

        if (existingItem) {
            // Verificar que no se exceda el stock disponible
            if (existingItem.qty >= product.stock) {
                toast.error(`Solo hay ${product.stock} unidades disponibles de este producto`);
                return rejectWithValue('Stock limit reached');
            }
        }

        return product;
    }
);

// Async Thunk for creating order
export const createOrder = createAsyncThunk(
    'cart/createOrder',
    async ({ items, token }: { items: CartItem[]; token: string }, { rejectWithValue }) => {
        try {
            const orderItems = items.map(item => ({
                productId: item.id,
                quantity: item.qty
            }));

            const response = await axios.post(`${API_URL}/orders`, orderItems, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message);
        }
    }
);

// Async Thunk for creating MP Preference
export const createPreference = createAsyncThunk(
    'cart/createPreference',
    async ({ orderId, token }: { orderId: number; token: string }, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_URL}/mp/create_preference/${orderId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message);
        }
    }
);

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {

        decrementItem: (state, action: PayloadAction<number>) => {
            const id = action.payload;
            const existingItem = state.items.find(item => item.id === id);

            if (existingItem) {
                if (existingItem.qty > 1) {
                    existingItem.qty -= 1;
                } else {
                    state.items = state.items.filter(item => item.id !== id);
                }
            }
        },
        removeItem: (state, action: PayloadAction<number>) => {
            const id = action.payload;
            state.items = state.items.filter(item => item.id !== id);
        },
        clearCart: (state) => {
            state.items = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addToCart.fulfilled, (state, action) => {
                const product = action.payload;
                const existingItem = state.items.find(item => item.id === product.id);

                if (existingItem) {
                    existingItem.qty += 1;
                } else {
                    state.items.push({ ...product, qty: 1 });
                }
                state.status = 'succeeded';
            })
            .addCase(addToCart.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Create Order
            .addCase(createOrder.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createOrder.fulfilled, (state) => {
                state.status = 'succeeded';
                state.items = [];
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('cart_items');
                }
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            // Create Preference
            .addCase(createPreference.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createPreference.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(createPreference.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    }
});

export const { decrementItem, removeItem, clearCart } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

export const selectCartTotalQty = (state: { cart: CartState }) =>
    state.cart.items.reduce((acc, item) => acc + item.qty, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((acc, item) => acc + (item.price || 0) * item.qty, 0);

export const selectHasComboDiscount = (state: { cart: CartState }) => {
    const items = state.cart.items;
    const categories = new Set(items.map(item => item.category?.description || ''));
    return categories.has('mates') && categories.has('bombillas') && categories.has('accesorios');
};

export const selectCartDiscount = (state: { cart: CartState }) => {
    const hasCombo = selectHasComboDiscount(state);
    const subtotal = selectCartSubtotal(state);
    return hasCombo ? subtotal * 0.10 : 0;
};

export const selectCartTotalPrice = (state: { cart: CartState }) => {
    const subtotal = selectCartSubtotal(state);
    const discount = selectCartDiscount(state);
    return subtotal - discount;
};

export default cartSlice.reducer;
