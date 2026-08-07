import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { TokenGetter, withAuthRetry } from '@/lib/apiClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/files`;

const MAX_IMAGE_WIDTH = 2048;
const MAX_TARGET_SIZE_MB = 2;
const SKIP_COMPRESSION_THRESHOLD_BYTES = 500 * 1024; // 500KB

interface FileState {
  uploadedUrls: string[];
  loading: boolean;
  error: string | null;
}

const initialState: FileState = {
  uploadedUrls: [],
  loading: false,
  error: null,
};

async function compressImage(file: File): Promise<File> {
  if (file.size <= SKIP_COMPRESSION_THRESHOLD_BYTES) {
    return file;
  }
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: MAX_TARGET_SIZE_MB,
      maxWidthOrHeight: MAX_IMAGE_WIDTH,
      useWebWorker: true,
    });
    console.log(`Compressed ${file.name}: ${file.size} -> ${compressedFile.size} bytes`);
    return compressedFile;
  } catch (error) {
    console.error('Compression failed, using original:', error);
    return file;
  }
}

// Thunk para subir múltiples archivos
export const uploadFiles = createAsyncThunk(
  'files/uploadMultiple',
  async ({ files, getToken }: { files: File[]; getToken: TokenGetter }) => {
    const compressedFiles = await Promise.all(files.map(compressImage));

    const formData = new FormData();
    compressedFiles.forEach((file) => {
      formData.append('files', file);
    });

    const { data } = await withAuthRetry(getToken, (token) =>
      axios.post(`${API_URL}/upload-multiple`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })
    );
    console.log('Upload response:', data);

    // Convertir las URLs relativas a URLs absolutas
    const fileUrls = data.fileUrls.map((url: string) =>
      url.startsWith('http') ? url : `${API_BASE_URL}${url}`
    );
    return fileUrls as string[];
  }
);

const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    clearUploadedFiles: (state) => {
      state.uploadedUrls = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadFiles.fulfilled, (state, action: PayloadAction<string[]>) => {
        state.loading = false;
        state.uploadedUrls = action.payload;
      })
      .addCase(uploadFiles.rejected, (state, action) => {
        state.loading = false;
        const errorMsg = action.error.message || '';

        if (
          errorMsg.includes('413') ||
          errorMsg.includes('too large') ||
          errorMsg.includes('Maximum')
        ) {
          state.error = 'Archivo demasiado grande. Intentá comprimirlo o usar uno más pequeño.';
        } else if (errorMsg.includes('500') || errorMsg.includes('Internal Server')) {
          state.error = 'Error del servidor. Intentá de nuevo en unos segundos.';
        } else if (errorMsg.includes('Network') || errorMsg.includes('ERR_FAILED')) {
          state.error = 'Error de conexión. Verificá tu internet.';
        } else {
          state.error = action.error.message || 'Error al subir archivos';
        }
      });
  },
});

export const { clearUploadedFiles } = fileSlice.actions;
export default fileSlice.reducer;
