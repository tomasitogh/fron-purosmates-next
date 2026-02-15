import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Upload, Pencil } from 'lucide-react';
import { uploadFiles, clearUploadedFiles } from '@/redux/fileSlice';
import { AppDispatch, RootState } from '@/redux/store';
import toast from 'react-hot-toast';
import ProductImageEditor from './ProductImageEditor';
import ProductImagePreview from './ProductImagePreview';

export interface ProductImage {
    url: string;
    scale?: number;
    x?: number;
    y?: number;
}

interface ImageUploaderProps {
    images?: ProductImage[];
    onChange: (images: ProductImage[]) => void;
    required?: boolean;
    token: string;
}

export default function ImageUploader({
    images = [],
    onChange,
    required = false,
    token
}: ImageUploaderProps) {
    const [dragActive, setDragActive] = useState(false);
    const [previewImages, setPreviewImages] = useState<ProductImage[]>(images);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    const dispatch = useDispatch<AppDispatch>();
    const { uploadedUrls, loading: uploading, error } = useSelector((state: RootState) => state.files);

    // Update previewImages when files are uploaded successfully
    useEffect(() => {
        if (uploadedUrls.length > 0) {
            const newImages: ProductImage[] = uploadedUrls.map(url => ({
                url,
                scale: 1,
                x: 0,
                y: 0
            }));
            const updatedImages = [...previewImages, ...newImages];
            setPreviewImages(updatedImages);
            onChange(updatedImages);
            dispatch(clearUploadedFiles());
        }
    }, [uploadedUrls, previewImages, onChange, dispatch]);

    // Update local state when prop changes
    useEffect(() => {
        setPreviewImages(images);
    }, [images]);

    // Show errors
    useEffect(() => {
        if (error) {
            toast.error('Error al subir las imágenes: ' + error);
            dispatch(clearUploadedFiles());
        }
    }, [error, dispatch]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            handleFiles(files);
        }
    };

    const handleFiles = async (files: File[]) => {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));

        if (imageFiles.length === 0) return;

        dispatch(uploadFiles({ files: imageFiles, token }));
    };

    const removeImage = (index: number) => {
        const newImages = previewImages.filter((_, i) => i !== index);
        setPreviewImages(newImages);
        onChange(newImages);
    };

    const moveImage = (fromIndex: number, toIndex: number) => {
        const newImages = [...previewImages];
        const [moved] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, moved);
        setPreviewImages(newImages);
        onChange(newImages);
    };

    const handleSaveTransform = (transform: { scale: number; x: number; y: number }) => {
        if (editingIndex === null) return;

        const newImages = [...previewImages];
        newImages[editingIndex] = {
            ...newImages[editingIndex],
            ...transform
        };
        setPreviewImages(newImages);
        onChange(newImages);
        setEditingIndex(null);
    };

    return (
        <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${dragActive ? 'border-[#2d5d52] bg-[#2d5d52]/5' : 'border-gray-300 hover:border-gray-400'}
          ${required && previewImages.length === 0 ? 'border-red-300' : ''}
          ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif"
                    onChange={handleChange}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                    <div className="flex justify-center">
                        {uploading ? (
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2d5d52]"></div>
                        ) : (
                            <Upload className="w-12 h-12 text-gray-400" />
                        )}
                    </div>
                    <div>
                        <p className="text-lg font-medium text-gray-700">
                            {uploading ? 'Subiendo imágenes...' : 'Arrastra imágenes aquí'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {uploading ? 'Espera un momento' : 'o haz clic para seleccionar archivos'}
                        </p>
                    </div>
                    {required && previewImages.length === 0 && (
                        <p className="text-sm text-red-600">
                            * Debes subir al menos una imagen
                        </p>
                    )}
                </div>
            </div>

            {/* Preview Grid */}
            {previewImages.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Imágenes ({previewImages.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {previewImages.map((image, index) => (
                            <div
                                key={index}
                                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
                            >
                                <ProductImagePreview
                                    src={image.url}
                                    alt={`Preview ${index + 1}`}
                                    transform={{
                                        scale: image.scale || 1,
                                        x: image.x || 0,
                                        y: image.y || 0
                                    }}
                                    fill={true}
                                />

                                {/* Controls Overlay */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 flex items-center justify-center gap-2 p-2 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => setEditingIndex(index)}
                                        className="bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100 transition flex-shrink-0"
                                        title="Editar encuadre"
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-[#2d5d52]" />
                                    </button>

                                    <div className="flex gap-1">
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, index - 1)}
                                                className="bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100 transition flex-shrink-0"
                                                title="Mover a la izquierda"
                                            >
                                                <span className="text-xs font-bold text-gray-600">←</span>
                                            </button>
                                        )}

                                        {index < previewImages.length - 1 && (
                                            <button
                                                type="button"
                                                onClick={() => moveImage(index, index + 1)}
                                                className="bg-white p-1.5 rounded-full shadow-sm hover:bg-gray-100 transition flex-shrink-0"
                                                title="Mover a la derecha"
                                            >
                                                <span className="text-xs font-bold text-gray-600">→</span>
                                            </button>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="bg-red-500 text-white p-1.5 rounded-full shadow-sm hover:bg-red-600 transition flex-shrink-0"
                                        title="Eliminar imagen"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                {/* Main Image Indicator */}
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-[#2d5d52] text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm z-10 font-medium">
                                        Principal
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Editor Modal */}
            {editingIndex !== null && previewImages[editingIndex] && (
                <ProductImageEditor
                    imageUrl={previewImages[editingIndex].url}
                    initialTransform={{
                        scale: previewImages[editingIndex].scale || 1,
                        x: previewImages[editingIndex].x || 0,
                        y: previewImages[editingIndex].y || 0
                    }}
                    onSave={handleSaveTransform}
                    onCancel={() => setEditingIndex(null)}
                />
            )}
        </div>
    );
}
