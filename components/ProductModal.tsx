'use client';

import { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '@/redux/cartSlice';
import toast from 'react-hot-toast';
import ProductImagePreview from './ProductImagePreview';
import { AppDispatch } from '@/redux/store';

export interface Product {
    id: number;
    name: string;
    slug?: string;
    price: number;
    images: {
        url: string;
        scale?: number;
        x?: number;
        y?: number;
    }[];
    category?: { id: number; description: string };
    stock: number;
    description?: string;
    isCustomizable?: boolean;
    customizationCost?: number;
}

interface ProductModalProps {
    product: Product;
    onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
    const dispatch = useDispatch<AppDispatch>();
    const [wantsCustomization, setWantsCustomization] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setWantsCustomization(false);
        setSelectedImageIndex(0);
        setTimeout(() => scrollToImage(0), 0);
    }, [product.id]);

    const scrollToImage = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const width = container.clientWidth;
            container.scrollTo({
                left: index * width,
                behavior: 'smooth'
            });
        }
    };

    const handleAddToCart = async () => {
        const result = await dispatch(addToCart({ ...product, qty: 1, hasCustomization: wantsCustomization } as any));
        if (addToCart.fulfilled.match(result)) {
            toast.success(`Agregado: ${product.name}${wantsCustomization ? ' (Personalizado)' : ''}`);
            onClose();
        } else {
            toast.error('Este producto no tiene stock disponible');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-200 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button - Sticky/Absolute */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 z-10"
                    aria-label="Cerrar"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Left Column: Image Section */}
                        <div className="flex flex-col gap-4 mt-8 lg:mt-0">
                            <div className="relative group max-w-[420px] lg:max-w-none w-4/5 lg:w-full mx-auto">
                                {/* Scrollable Container */}
                                <div
                                    ref={scrollContainerRef}
                                    className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth w-full aspect-square bg-gray-200 rounded-xl"
                                    onScroll={(e) => {
                                        const container = e.currentTarget;
                                        const width = container.clientWidth;
                                        const newIndex = Math.round(container.scrollLeft / width);
                                        if (newIndex !== selectedImageIndex && product.images && newIndex < product.images.length) {
                                            setSelectedImageIndex(newIndex);
                                        }
                                    }}
                                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                >
                                    {product.images && product.images.length > 0 ? (
                                        product.images.map((image: any, index: number) => (
                                            <div key={index} className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center relative bg-gray-200">
                                                <ProductImagePreview
                                                    src={image.url}
                                                    alt={`${product.name} ${index + 1}`}
                                                    transform={{
                                                        scale: image.scale || 1,
                                                        x: image.x || 0,
                                                        y: image.y || 0
                                                    }}
                                                    className="object-contain w-full h-full"
                                                    fill
                                                    priority={index === 0}
                                                />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 snap-center flex-shrink-0">
                                            Sin Imagen
                                        </div>
                                    )}
                                </div>

                                {/* Navigation Arrows (Desktop/Hover) */}
                                {product.images && product.images.length > 1 && (
                                    <>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newIndex = selectedImageIndex === 0 ? product.images.length - 1 : selectedImageIndex - 1;
                                                scrollToImage(newIndex);
                                            }}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newIndex = selectedImageIndex === product.images.length - 1 ? 0 : selectedImageIndex + 1;
                                                scrollToImage(newIndex);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-md text-gray-800 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity z-10 hidden sm:block"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Thumbnails */}
                            {product.images && product.images.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-2 justify-center lg:justify-start scrollbar-hide">
                                    {product.images.map((image: any, index: number) => (
                                        <button
                                            key={index}
                                            onClick={() => scrollToImage(index)}
                                            className={`relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === index
                                                ? 'border-[#254642] opacity-100 ring-2 ring-[#254642] ring-offset-1'
                                                : 'border-transparent opacity-60 hover:opacity-100'
                                                }`}
                                        >
                                            <ProductImagePreview
                                                src={image.url}
                                                alt={`${product.name} ${index + 1}`}
                                                transform={{
                                                    scale: image.scale || 1,
                                                    x: image.x || 0,
                                                    y: image.y || 0
                                                }}
                                                fill
                                                className="object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Details Section */}
                        <div className="flex flex-col h-full lg:pt-4">
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h2>
                                <p className="text-[#254642] font-medium tracking-wide flex items-center gap-2">
                                    <span className="w-2 h-2 bg-[#254642] rounded-full"></span>
                                    {product.category?.description || 'Producto'}
                                </p>
                            </div>

                            <div className="flex-grow">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Descripción</h4>
                                <p className="text-gray-600 leading-relaxed max-h-[200px] overflow-y-auto scrollbar-hide">
                                    {product.description || 'Este producto no tiene una descripción detallada todavía.'}
                                </p>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Precio</p>
                                        <span className="text-4xl font-black text-[#254642]">
                                            ${product.price?.toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                </div>
                                {/* Customization Checkbox - Only if product is customizable */}
                                {product.isCustomizable && (
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="modal-customization"
                                                checked={wantsCustomization}
                                                onChange={(e) => setWantsCustomization(e.target.checked)}
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor="modal-customization" className="font-medium text-gray-900 cursor-pointer select-none">
                                                    Quiero personalizar este producto
                                                </label>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Agrega un grabado o detalle personalizado por <span className="font-bold text-blue-600">+${product.customizationCost?.toLocaleString('es-AR')}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between font-bold text-gray-900 text-xl mt-4">
                                    <span>Total:</span>
                                    <span>${(product.price + (wantsCustomization ? (product.customizationCost || 0) : 0)).toLocaleString('es-AR')}</span>
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="w-full bg-[#254642] text-white py-3 rounded-lg hover:bg-[#254642]/90 transition font-semibold mt-4 shadow-lg active:scale-[0.98]"
                                >
                                    Agregar al Carrito
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
