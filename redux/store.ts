import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import adminReducer from "./adminSlice";
import fileReducer from "./fileSlice";
import categoryReducer from "./categorySlice";
import productReducer from "./productSlice";
import authReducer from "./authSlice";

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        admin: adminReducer,
        files: fileReducer,
        categories: categoryReducer,
        products: productReducer,
        auth: authReducer,
    }
});

// Subscribe to store updates to persist cart items (client-side only)
if (typeof window !== 'undefined') {
    store.subscribe(() => {
        const state = store.getState();
        localStorage.setItem('cart_items', JSON.stringify(state.cart.items));
    });
}

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
