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

export default function SingleImageUploader({ imageUrl, onChange, getToken }: SingleImageUploaderProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { uploadedUrls, loading: uploading, error } = useSelector((state: RootState) => state.files);
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
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-2 relative">
                {imageUrl ? (
                    <>
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                        {uploading && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 border-2 border-[#254642] border-t-transparent rounded-full animate-spin" />
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
                    className="flex-1 py-2 border border-[#254642] text-[#254642] rounded-lg text-sm font-medium hover:bg-[#254642]/5 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    <Upload className="w-4 h-4" />
                    {uploading ? 'Subiendo...' : imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                {imageUrl && !uploading && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="px-3 py-2 border border-red-200 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50"
                        title="Quitar imagen"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
