'use client';

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFiles, clearUploadedFiles } from '@/redux/fileSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

interface SingleImageUploaderProps {
  imageUrl: string;
  onChange: (url: string) => void;
  getToken: TokenGetter;
}

export default function SingleImageUploader({
  imageUrl,
  onChange,
  getToken,
}: SingleImageUploaderProps) {
  const dispatch = useDispatch<AppDispatch>();
  const {
    uploadedUrls,
    loading: uploading,
    error,
  } = useSelector((state: RootState) => state.files);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cuando el upload termina, avisar al padre con la URL de Cloudinary
  useEffect(() => {
    if (uploadedUrls.length > 0) {
      onChange(uploadedUrls[0]);
      dispatch(clearUploadedFiles());
    }
  }, [uploadedUrls, onChange, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUploadedFiles());
    }
  }, [error, dispatch]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    dispatch(uploadFiles({ files: [file], getToken }));
  };

  return (
    <div>
      <div className="relative mb-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
        {imageUrl ? (
          <>
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#254642] border-t-transparent" />
                <span className="text-sm">Subiendo imagen...</span>
              </div>
            ) : (
              'Sin imagen'
            )}
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <div className="flex gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#254642] py-2 text-sm font-medium text-[#254642] hover:bg-[#254642]/5 disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Subiendo...' : imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
        </button>
        {imageUrl && !uploading && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50"
            title="Quitar imagen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
