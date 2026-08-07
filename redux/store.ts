import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import adminReducer from './adminSlice';
import fileReducer from './fileSlice';
import categoryReducer from './categorySlice';
import productReducer from './productSlice';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    admin: adminReducer,
    files: fileReducer,
    categories: categoryReducer,
    products: productReducer,
    auth: authReducer,
  },
});

// Persistence is handled in CartInitializer component

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
