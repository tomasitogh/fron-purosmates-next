import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1/auth';

// Types
export interface User {
    email: string;
    role: string;
    name?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

// Thunk para login
export const loginUser = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }) => {
        const { data } = await axios.post(`${API_URL}/auth/authenticate`, { email, password });
        const accessToken = data.access_token;

        // Decodificar el token JWT para obtener el rol
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));

        const userData = {
            email: tokenPayload.sub,
            role: tokenPayload.role || tokenPayload.authorities?.[0]?.replace('ROLE_', '') || 'USER',
            token: accessToken
        };

        return userData;
    }
);

// Thunk para registro
export const registerUser = createAsyncThunk(
    'auth/register',
    async ({
        firstname,
        lastname,
        email,
        phoneNumber,
        password
    }: {
        firstname: string;
        lastname: string;
        email: string;
        phoneNumber: string;
        password: string;
    }) => {
        const { data } = await axios.post(`${API_URL}/auth/register`, {
            firstname,
            lastname,
            email,
            phoneNumber,
            password,
            role: 'USER'
        });
        return data;
    }
);

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        token: null,
        loading: false,
        error: null
    } as AuthState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
            // Limpiar cookies en lugar de localStorage
            Cookies.remove('token');
            Cookies.remove('user');
            // También limpiar localStorage por compatibilidad
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            }
        },
        setAuthFromStorage: (state, action: PayloadAction<{ user: User; token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        }
    },
    extraReducers: (builder) => {
        builder
            // Login
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = {
                    email: action.payload.email,
                    role: action.payload.role
                };
                state.token = action.payload.token;

                // Guardar en cookies (accesible server-side)
                Cookies.set('token', action.payload.token, { expires: 7 }); // 7 días
                Cookies.set('user', JSON.stringify(state.user), { expires: 7 });

                // También guardar en localStorage por compatibilidad
                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', action.payload.token);
                    localStorage.setItem('user', JSON.stringify(state.user));
                }
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al iniciar sesión';
            })
            // Register
            .addCase(registerUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Error al registrarse';
            });
    }
});

export const { logout, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
