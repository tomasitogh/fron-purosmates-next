import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import toast from 'react-hot-toast';
import axios from 'axios';
import { CategoryId } from '@/lib/constants';
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
    isCustomizable?: boolean;
    customizationCost?: number;
    hasCustomization?: boolean;
}

interface CartState {
    items: CartItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

// Helper to get initial state (start empty to match server)
const initialState: CartState = {
    items: [],
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
        // Buscar item que coincida en ID y estado de personalización
        const existingItem = state.cart.items.find(p =>
            p.id === product.id &&
            !!p.hasCustomization === !!product.hasCustomization
        );

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
    async ({ items, token, guestData, paymentMethod }: {
        items: CartItem[];
        token?: string;
        guestData?: {
            guestFirstname?: string;
            guestLastname?: string;
            guestEmail?: string;
            guestPhone: string;
        };
        paymentMethod?: string;
    }, { rejectWithValue }) => {
        try {
            const orderItems = items.map(item => ({
                productId: item.id,
                quantity: item.qty,
                hasCustomization: item.hasCustomization
            }));

            const payload = {
                items: orderItems,
                ...guestData,
                paymentMethod
            };

            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const response = await axios.post(`${API_URL}/orders`, payload, config);
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
            const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

            const response = await axios.post(`${API_URL}/mp/create_preference/${orderId}`, {}, config);
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
        setCart: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
        },
        decrementItem: (state, action: PayloadAction<{ id: number; hasCustomization?: boolean }>) => {
            const { id, hasCustomization } = action.payload;
            const existingItem = state.items.find(item =>
                item.id === id && !!item.hasCustomization === !!hasCustomization
            );

            if (existingItem) {
                if (existingItem.qty > 1) {
                    existingItem.qty -= 1;
                } else {
                    state.items = state.items.filter(item =>
                        !(item.id === id && !!item.hasCustomization === !!hasCustomization)
                    );
                }
            }
        },
        removeItem: (state, action: PayloadAction<{ id: number; hasCustomization?: boolean }>) => {
            const { id, hasCustomization } = action.payload;
            state.items = state.items.filter(item =>
                !(item.id === id && !!item.hasCustomization === !!hasCustomization)
            );
        },
        clearCart: (state) => {
            state.items = [];
        },
        toggleCustomization: (state, action: PayloadAction<{ id: number; hasCustomization: boolean }>) => {
            // Nota: Esto es complejo porque cambiar la customización podría fusionar items
            // Por simplicidad, asumimos que se llama desde el carrito y actualizamos el flag
            // Idealmente, deberíamos verificar si al cambiarlo choca con otro item igual
            const { id, hasCustomization } = action.payload;
            const item = state.items.find(i => i.id === id && i.hasCustomization !== hasCustomization);
            // Buscamos el item que NO tiene el estado al que queremos cambiar (o sea el actual)
            // Esto es tricky si hay múltiples del mismo ID con diferente customización.
            // Mejor pasamos un identificador único de línea de carrito si fuera posible, pero usamos ID y estado actual logic

            // Revisión de la lógica:
            // Si el usuario hace toggle en una fila del carrito, esa fila tiene un estado actual.
            // Si quiero ACTIVAR (hasCustomization=true), busco el item con ID y hasCustomization=false.
            // Si quiero DESACTIVAR, busco el item con ID y hasCustomization=true.

            const targetItemIndex = state.items.findIndex(i =>
                i.id === id && i.hasCustomization !== hasCustomization
            );

            if (targetItemIndex !== -1) {
                const targetItem = state.items[targetItemIndex];
                const newItemState = { ...targetItem, hasCustomization: hasCustomization };

                // Verificar si ya existe un item con el NUEVO estado para fusionarlos
                const existingMergeIndex = state.items.findIndex((i, idx) =>
                    idx !== targetItemIndex &&
                    i.id === id &&
                    i.hasCustomization === hasCustomization
                );

                if (existingMergeIndex !== -1) {
                    // Fusionar
                    state.items[existingMergeIndex].qty += targetItem.qty;
                    // Eliminar el antiguo
                    state.items.splice(targetItemIndex, 1);
                } else {
                    // Solo actualizar flag
                    state.items[targetItemIndex].hasCustomization = hasCustomization;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(addToCart.fulfilled, (state, action) => {
                const product = action.payload;
                const existingItem = state.items.find(item =>
                    item.id === product.id &&
                    !!item.hasCustomization === !!product.hasCustomization
                );

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
                // LocalStorage clearing moved to component
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

export const { setCart, decrementItem, removeItem, clearCart, toggleCustomization } = cartSlice.actions;

// Selectors
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;

export const selectCartTotalQty = (state: { cart: CartState }) =>
    state.cart.items.reduce((acc, item) => acc + item.qty, 0);
export const selectCartSubtotal = (state: { cart: CartState }) =>
    state.cart.items.reduce((acc, item) => {
        const itemPrice = item.price + (item.hasCustomization && item.customizationCost ? item.customizationCost : 0);
        return acc + itemPrice * item.qty;
    }, 0);

export const selectHasComboDiscount = (state: { cart: CartState }) => {
    const items = state.cart.items;
    const categories = new Set(items.map(item => item.category?.id));
    return categories.has(CategoryId.MATE) &&
        categories.has(CategoryId.BOMBILLA) &&
        categories.has(CategoryId.ACCESORIO);
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
