import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const API_URL = `${API_BASE_URL}/files`;

interface FileState {
    uploadedUrls: string[];
    loading: boolean;
    error: string | null;
}

const initialState: FileState = {
    uploadedUrls: [],
    loading: false,
    error: null
};

// Thunk para subir múltiples archivos
export const uploadFiles = createAsyncThunk(
    'files/uploadMultiple',
    async ({ files, token }: { files: File[], token: string }) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const { data } = await axios.post(`${API_URL}/upload-multiple`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        // Convertir las URLs relativas a URLs absolutas
        const fileUrls = data.fileUrls.map((url: string) =>
            url.startsWith('http') ? url : `${API_BASE_URL}${url}`
        );
        return fileUrls as string[];
    }
);

const fileSlice = createSlice({
    name: "files",
    initialState,
    reducers: {
        clearUploadedFiles: (state) => {
            state.uploadedUrls = [];
            state.error = null;
        }
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
                state.error = action.error.message || 'Error al subir archivos';
            });
    }
});

export const { clearUploadedFiles } = fileSlice.actions;
export default fileSlice.reducer;
