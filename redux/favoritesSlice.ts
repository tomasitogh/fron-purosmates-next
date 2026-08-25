import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

interface FavoritesState {
  ids: number[];
  loading: boolean;
  error: string | null;
}

const initialState: FavoritesState = {
  ids: [],
  loading: false,
  error: null,
};

export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async (getToken: TokenGetter, { rejectWithValue }) => {
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.get(`${API_BASE_URL}/api/v1/users/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return data.map((p: any) => p.id) as number[];
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al cargar favoritos');
    }
  }
);

export const toggleFavorite = createAsyncThunk(
  'favorites/toggleFavorite',
  async (
    { productId, getToken }: { productId: number; getToken: TokenGetter },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await withAuthRetry(getToken, (token) =>
        axios.post(`${API_BASE_URL}/api/v1/users/favorites/${productId}`, null, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );
      return { productId, isFavorite: data.isFavorite as boolean };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Error al actualizar favorito');
    }
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.ids = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.ids = action.payload;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        const { productId, isFavorite } = action.payload;
        if (isFavorite) {
          state.ids.push(productId);
        } else {
          state.ids = state.ids.filter((id) => id !== productId);
        }
      });
  },
});

export const { clearFavorites } = favoritesSlice.actions;
export default favoritesSlice.reducer;
