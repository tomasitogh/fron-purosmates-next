import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of the user state
interface User {
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// NOTA: El JWT de Clerk NO se guarda acá. Los tokens de Clerk vencen a los
// ~60 segundos, por lo que cachearlos en Redux/estado produce errores 401.
// El token se obtiene fresco por request vía useAuth() -> getToken (Clerk).

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      if (typeof window !== 'undefined') {
        // Limpieza de claves legacy de la época pre-Clerk
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    },
    setUser: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
    },
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
