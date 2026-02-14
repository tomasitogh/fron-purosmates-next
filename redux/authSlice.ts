import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";


// Define the shape of the user state
interface User {
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

// Async thunks for local login/register removed as backend only supports OAuth2 (Google)

const initialState: AuthState = {
    user: null,
    token: null,
    loading: false,
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.error = null;
            if (typeof window !== 'undefined') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('authToken');
            }
        },
        setAuthFromStorage: (state, action: PayloadAction<{ user: User, token: string }>) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
        }
    },
    extraReducers: (builder) => {
        // No extra reducers needed for now as auth is handled by NextAuth + AuthContext sync
    }
});

export const { logout, setAuthFromStorage } = authSlice.actions;
export default authSlice.reducer;
