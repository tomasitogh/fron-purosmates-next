'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFiles, clearUploadedFiles } from '@/redux/fileSlice';
import { AppDispatch } from '@/redux/store';
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
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('El archivo debe ser una imagen');
      return;
    }

    setUploading(true);
    try {
      const resultAction = await dispatch(uploadFiles({ files: [file], getToken }));
      if (uploadFiles.fulfilled.match(resultAction)) {
        if (resultAction.payload && resultAction.payload.length > 0) {
          onChange(resultAction.payload[0]);
        }
        dispatch(clearUploadedFiles());
      } else if (uploadFiles.rejected.match(resultAction)) {
        const errorMsg = resultAction.error.message || 'Error al subir la imagen';
        toast.error(errorMsg);
      }
    } catch (err: unknown) {
      console.error('Error uploading image:', err);
      toast.error('Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="relative mb-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt="" fill className="object-cover" />
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
