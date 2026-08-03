import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
// import { CategoryId } from '@/lib/constants'; // [DESHABILITADO] Solo se usaba para detectar combo Mate+Bombilla
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';
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
        // E6: dirección imagen→variant. Null en el cart porque se persiste
        // en el OrderItem como `variantImageUrl` snapshot.
        variantId?: number | null;
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
    // --- Variante (G1) ---
    variantId: number;
    variantSku: string;
    variantName?: string;
    variantStock: number;
    variantImageUrl?: string;
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
        // G1: la variant es la unidad de stock ahora. Si el producto no trae
        // variantId/variantStock, no se puede agregar (legacy flow no soportado).
        if (!product.variantId || product.variantStock == null) {
            return rejectWithValue('Falta variante del producto');
        }
        if (product.variantStock <= 0) {
            return rejectWithValue('No stock available');
        }

        const state = getState() as { cart: CartState };
        // G1: dedupe por variantId (no más por id+hasCustomization). La misma
        // variant con o sin customización son DOS líneas distintas del carrito
        // (customization es ortogonal).
        const existingItem = state.cart.items.find(
            p => p.variantId === product.variantId && !!p.hasCustomization === !!product.hasCustomization
        );

        if (existingItem) {
            if (existingItem.qty >= existingItem.variantStock) {
                return rejectWithValue('Stock limit reached');
            }
        }

        return product;
    }
);

// Async Thunk for creating order
export const createOrder = createAsyncThunk(
    'cart/createOrder',
    async ({ items, getToken, guestData, paymentMethod }: {
        items: CartItem[];
        getToken?: TokenGetter;
        guestData?: {
            guestFirstname?: string;
            guestLastname?: string;
            guestEmail?: string;
            guestPhone: string;
            shippingPreference?: string;
            locality?: string;
            address?: string;
            floorApartment?: string;
            extraIndications?: string;
        };
        paymentMethod?: string;
    }, { rejectWithValue }) => {
        try {
            // G3: cada item del carrito referencia una variant (no un product).
            // El backend (C2) acepta `variantId` en `OrderItemRequest`.
            const orderItems = items.map(item => ({
                variantId: item.variantId,
                quantity: item.qty,
                hasCustomization: item.hasCustomization
            }));

            const payload = {
                items: orderItems,
                ...guestData,
                paymentMethod
            };

            const doPost = async (token?: string) => {
                const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
                return axios.post(`${API_URL}/orders`, payload, config);
            };

            const response = getToken
                ? await withAuthRetry(getToken, (token) => doPost(token))
                : await doPost();
            return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                return rejectWithValue(error.response.data);
            }
            return rejectWithValue(error.message);
        }
    }
);

// [DESHABILITADO] Thunk de preferencia MercadoPago — no se usa hasta reactivar MP
// export const createPreference = createAsyncThunk(
//     'cart/createPreference',
//     async ({ orderId, getToken }: { orderId: number; getToken?: TokenGetter }, { rejectWithValue }) => {
//         try {
//             const doPost = async (token?: string) => {
//                 const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
//                 return axios.post(`${API_URL}/mp/create_preference/${orderId}`, {}, config);
//             };
//
//             const response = getToken
//                 ? await withAuthRetry(getToken, (token) => doPost(token))
//                 : await doPost();
//             return response.data;
//         } catch (error: any) {
//             if (error.response?.data) {
//                 return rejectWithValue(error.response.data);
//             }
//             return rejectWithValue(error.message);
//         }
//     }
// );

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        setCart: (state, action: PayloadAction<CartItem[]>) => {
            state.items = action.payload;
        },
        decrementItem: (state, action: PayloadAction<{ variantId: number; hasCustomization?: boolean }>) => {
            // G1: matchear por variantId (no por id) — cada variant es una
            // línea distinta del carrito. hasCustomization sigue siendo parte
            // del match porque es ortogonal a la variant.
            const { variantId, hasCustomization } = action.payload;
            const existingItem = state.items.find(item =>
                item.variantId === variantId && !!item.hasCustomization === !!hasCustomization
            );

            if (existingItem) {
                if (existingItem.qty > 1) {
                    existingItem.qty -= 1;
                } else {
                    state.items = state.items.filter(item =>
                        !(item.variantId === variantId && !!item.hasCustomization === !!hasCustomization)
                    );
                }
            }
        },
        removeItem: (state, action: PayloadAction<{ variantId: number; hasCustomization?: boolean }>) => {
            const { variantId, hasCustomization } = action.payload;
            state.items = state.items.filter(item =>
                !(item.variantId === variantId && !!item.hasCustomization === !!hasCustomization)
            );
        },
        clearCart: (state) => {
            state.items = [];
        },
        toggleCustomization: (state, action: PayloadAction<{ variantId: number; hasCustomization: boolean }>) => {
            // G1: la unidad de identidad en el cart es `variantId`, no `id`.
            // Mismo merge logic que antes (mover item a su versión con/sin
            // customización, fusionar si ya existe otra línea con ese estado).
            const { variantId, hasCustomization } = action.payload;
            const targetItemIndex = state.items.findIndex(i =>
                i.variantId === variantId && i.hasCustomization !== hasCustomization
            );

            if (targetItemIndex !== -1) {
                const targetItem = state.items[targetItemIndex];
                const newItemState = { ...targetItem, hasCustomization: hasCustomization };

                const existingMergeIndex = state.items.findIndex((i, idx) =>
                    idx !== targetItemIndex &&
                    i.variantId === variantId &&
                    i.hasCustomization === hasCustomization
                );

                if (existingMergeIndex !== -1) {
                    state.items[existingMergeIndex].qty += targetItem.qty;
                    state.items.splice(targetItemIndex, 1);
                } else {
                    state.items[targetItemIndex].hasCustomization = hasCustomization;
                }
            }
        },
    },
    extraReducers: (builder) => {
        builder
        .addCase(addToCart.fulfilled, (state, action) => {
            const product = action.payload;
            // G1: dedupe por variantId (no id). Misma variant + misma
            // customización = misma línea; incrementa qty. Si difieren, nueva línea.
            const existingItem = state.items.find(item =>
                item.variantId === product.variantId &&
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
            // [DESHABILITADO] Create Preference (MP) — no se usa hasta reactivar MP
            // .addCase(createPreference.pending, (state) => {
            //     state.status = 'loading';
            // })
            // .addCase(createPreference.fulfilled, (state) => {
            //     state.status = 'succeeded';
            // })
            // .addCase(createPreference.rejected, (state, action) => {
            //     state.status = 'failed';
            //     state.error = action.payload as string;
            // });
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

// [DESHABILITADO] Descuento combo — siempre retorna false hasta reactivar
export const selectHasComboDiscount = (state: { cart: CartState }) => {
    // const items = state.cart.items;
    // const categories = new Set(items.map(item => item.category?.id));
    // return categories.has(CategoryId.MATE) &&
    //     categories.has(CategoryId.BOMBILLA);
    return false;
};

// [DESHABILITADO] Descuento — siempre retorna 0 hasta reactivar
export const selectCartDiscount = (state: { cart: CartState }) => {
    // const hasCombo = selectHasComboDiscount(state);
    // const subtotal = selectCartSubtotal(state);
    // return hasCombo ? subtotal * 0.10 : 0;
    return 0;
};

export const selectCartTotalPrice = (state: { cart: CartState }) => {
    const subtotal = selectCartSubtotal(state);
    const discount = selectCartDiscount(state);
    return subtotal - discount;
};

export default cartSlice.reducer;
