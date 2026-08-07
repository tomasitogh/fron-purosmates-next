import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Upload, Pencil } from 'lucide-react';
import { uploadFiles, clearUploadedFiles } from '@/redux/fileSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';
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
  getToken: TokenGetter;
}

export default function ImageUploader({
  images = [],
  onChange,
  required = false,
  getToken,
}: ImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<ProductImage[]>(images);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const {
    uploadedUrls,
    loading: uploading,
    error,
  } = useSelector((state: RootState) => state.files);

  // Update previewImages when files are uploaded successfully
  useEffect(() => {
    if (uploadedUrls.length > 0) {
      const newImages: ProductImage[] = uploadedUrls.map((url) => ({
        url,
        scale: 1,
        x: 0,
        y: 0,
      }));
      const updatedImages = [...previewImages, ...newImages];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreviewImages(updatedImages);
      onChange(updatedImages);
      dispatch(clearUploadedFiles());
    }
  }, [uploadedUrls, previewImages, onChange, dispatch]);

  // Update local state when prop changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreviewImages(images);
  }, [images]);

  // Show errors
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearUploadedFiles());
    }
  }, [error, dispatch]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    dispatch(uploadFiles({ files: imageFiles, getToken }));
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
      ...transform,
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
        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${dragActive ? 'border-[#254642] bg-[#254642]/5' : 'border-gray-300 hover:border-gray-400'} ${required && previewImages.length === 0 ? 'border-red-300' : ''} ${uploading ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={handleChange}
          disabled={uploading}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            {uploading ? (
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#254642]"></div>
            ) : (
              <Upload className="h-12 w-12 text-gray-400" />
            )}
          </div>
          <div>
            <p className="text-lg font-medium text-gray-700">
              {uploading ? 'Subiendo imágenes...' : 'Arrastra imágenes aquí'}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {uploading ? 'Espera un momento' : 'o haz clic para seleccionar archivos'}
            </p>
          </div>
          {required && previewImages.length === 0 && (
            <p className="text-sm text-red-600">* Debes subir al menos una imagen</p>
          )}
        </div>
      </div>

      {/* Preview Grid */}
      {previewImages.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">
            Imágenes ({previewImages.length})
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {previewImages.map((image, index) => (
              <div
                key={image.url || index}
                className="group relative aspect-square overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100"
              >
                <ProductImagePreview
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  transform={{
                    scale: image.scale || 1,
                    x: image.x || 0,
                    y: image.y || 0,
                  }}
                  fill={true}
                />

                {/* Controls Overlay */}
                <div className="absolute right-0 bottom-0 left-0 flex flex-wrap items-center justify-center gap-1 bg-black/50 p-1 transition-opacity sm:gap-2 sm:p-2">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className="flex-shrink-0 rounded-full bg-white p-1 shadow-sm transition hover:bg-gray-100 sm:p-1.5"
                    title="Editar encuadre"
                  >
                    <Pencil className="h-3 w-3 text-[#254642] sm:h-3.5 sm:w-3.5" />
                  </button>

                  <div className="flex gap-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index - 1)}
                        className="flex-shrink-0 rounded-full bg-white p-1 shadow-sm transition hover:bg-gray-100 sm:p-1.5"
                        title="Mover a la izquierda"
                      >
                        <span className="text-[10px] font-bold text-gray-600 sm:text-xs">←</span>
                      </button>
                    )}

                    {index < previewImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveImage(index, index + 1)}
                        className="flex-shrink-0 rounded-full bg-white p-1 shadow-sm transition hover:bg-gray-100 sm:p-1.5"
                        title="Mover a la derecha"
                      >
                        <span className="text-[10px] font-bold text-gray-600 sm:text-xs">→</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="flex-shrink-0 rounded-full bg-red-500 p-1 text-white shadow-sm transition hover:bg-red-600 sm:p-1.5"
                    title="Eliminar imagen"
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  </button>
                </div>

                {/* Main Image Indicator */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 rounded bg-[#254642] px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm">
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
          key={previewImages[editingIndex].url}
          imageUrl={previewImages[editingIndex].url}
          initialTransform={{
            scale: previewImages[editingIndex].scale || 1,
            x: previewImages[editingIndex].x || 0,
            y: previewImages[editingIndex].y || 0,
          }}
          onSave={handleSaveTransform}
          onCancel={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
}
