'use client';

import { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
import Image from 'next/image';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ProductImageEditorProps {
    imageUrl: string;
    initialTransform?: { scale: number; x: number; y: number };
    onSave: (transform: { scale: number; x: number; y: number }) => void;
    onCancel: () => void;
    aspectRatio?: number; // ancho / alto, default 1 (cuadrado)
}

export default function ProductImageEditor({
    imageUrl,
    initialTransform = { scale: 1, x: 0, y: 0 },
    onSave,
    onCancel,
    aspectRatio = 1
}: ProductImageEditorProps) {
    const [scale, setScale] = useState(initialTransform.scale);
    const containerRef = useRef<HTMLDivElement>(null);
    const containerWidth = 300;
    const containerHeight = 300 / aspectRatio;

    // Convert initialTransform from percentages to pixels for the gesture engine
    const [position, setPosition] = useState(() => ({
        x: (initialTransform.x * containerWidth) / 100,
        y: (initialTransform.y * containerHeight) / 100,
    }));

    // Calculate bounds based on scale
    const getBounds = (currentScale: number) => {
        const maxTranslateX = (containerWidth * (currentScale - 1)) / 2;
        const maxTranslateY = (containerHeight * (currentScale - 1)) / 2;

        return {
            left: -maxTranslateX,
            right: maxTranslateX,
            top: -maxTranslateY,
            bottom: maxTranslateY
        };
    };

    // Clamp position to bounds
    const clampPosition = (x: number, y: number, currentScale: number) => {
        const bounds = getBounds(currentScale);
        return {
            x: Math.min(Math.max(x, bounds.left), bounds.right),
            y: Math.min(Math.max(y, bounds.top), bounds.bottom)
        };
    };

    // Gestures configuration
    useGesture({
        onDrag: ({ offset: [dx, dy] }) => {
            setPosition({ x: dx, y: dy });
        },
        onPinch: ({ offset: [s], memo }) => {
            setScale(s);
            return memo;
        },
    }, {
        target: containerRef,
        drag: {
            from: () => [position.x, position.y],
            bounds: () => getBounds(scale),
            rubberband: false,
        },
        pinch: {
            scaleBounds: { min: 1, max: 3 },
            rubberband: true,
            from: () => [scale, 0],
        }
    });

    // Effect to clamp position when scale changes (e.g. via zoom buttons or pinch end)
    useEffect(() => {
        const clamped = clampPosition(position.x, position.y, scale);
        if (clamped.x !== position.x || clamped.y !== position.y) {
            setPosition(clamped);
        }
    }, [scale]);

    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 1));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-800">Editar Imagen</h3>
                    <button
                        onClick={onCancel}
                        className="text-gray-500 hover:text-gray-700 transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center gap-4 bg-gray-100 flex-1">
                    <p className="text-sm text-gray-500 mb-2">
                        Arrastra para mover • Pellizca o usa botones para zoom
                    </p>

                    {/* Editor Frame */}
                    <div
                        className="relative overflow-hidden border-4 border-white shadow-lg bg-white cursor-move touch-none"
                        style={{
                            width: '300px',
                            height: `${300 / aspectRatio}px`,
                        }}
                        ref={containerRef}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                                transformOrigin: 'center',
                                willChange: 'transform',
                            }}
                        >
                            <img
                                src={imageUrl}
                                alt="Edición"
                                draggable={false}
                                className="w-full h-full object-cover select-none pointer-events-none"
                            />
                        </div>

                        {/* Grid overlay for better alignment */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 grid grid-cols-3 grid-rows-3">
                            <div className="border border-gray-500/30 col-start-1 col-end-2 row-start-1 row-end-4" />
                            <div className="border border-gray-500/30 col-start-2 col-end-3 row-start-1 row-end-4" />
                            <div className="border border-gray-500/30 row-start-1 row-end-2 col-start-1 col-end-4" />
                            <div className="border border-gray-500/30 row-start-2 row-end-3 col-start-1 col-end-4" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-4 mt-4 bg-white px-4 py-2 rounded-full shadow-sm border">
                        <ZoomOut size={20} className="text-gray-500 cursor-pointer hover:text-gray-800" onClick={handleZoomOut} />
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.01"
                            value={scale}
                            onChange={(e) => setScale(parseFloat(e.target.value))}
                            className="w-32 accent-[#254642]"
                        />
                        <ZoomIn size={20} className="text-gray-500 cursor-pointer hover:text-gray-800" onClick={handleZoomIn} />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => {
                            const xPercent = (position.x / containerWidth) * 100;
                            const yPercent = (position.y / containerHeight) * 100;

                            onSave({ scale, x: xPercent, y: yPercent });
                        }}
                        className="px-6 py-2 bg-[#254642] text-white rounded-lg hover:bg-[#254642]/90 transition flex items-center gap-2 font-medium"
                    >
                        <Check size={18} />
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
    );
}
