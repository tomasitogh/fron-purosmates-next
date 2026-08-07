'use client';

import { useState, useRef, useEffect } from 'react';
import { useGesture } from '@use-gesture/react';
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
  aspectRatio = 1,
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
      bottom: maxTranslateY,
    };
  };

  // Clamp position to bounds
  const clampPosition = (x: number, y: number, currentScale: number) => {
    const bounds = getBounds(currentScale);
    return {
      x: Math.min(Math.max(x, bounds.left), bounds.right),
      y: Math.min(Math.max(y, bounds.top), bounds.bottom),
    };
  };

  // Gestures configuration
  useGesture(
    {
      onDrag: ({ offset: [dx, dy] }) => {
        setPosition({ x: dx, y: dy });
      },
      onPinch: ({ offset: [s], memo }) => {
        setScale(s);
        return memo;
      },
    },
    {
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
      },
    }
  );

  // Effect to clamp position when scale changes (e.g. via zoom buttons or pinch end)
  useEffect(() => {
    const clamped = clampPosition(position.x, position.y, scale);
    if (clamped.x !== position.x || clamped.y !== position.y) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPosition(clamped);
    }
  }, [scale]);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.1, 1));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b bg-gray-50 p-4">
          <h3 className="text-lg font-bold text-gray-800">Editar Imagen</h3>
          <button onClick={onCancel} className="text-gray-500 transition hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-4 bg-gray-100 p-6">
          <p className="mb-2 text-sm text-gray-500">
            Arrastra para mover • Pellizca o usa botones para zoom
          </p>

          {/* Editor Frame */}
          <div
            className="relative cursor-move touch-none overflow-hidden border-4 border-white bg-white shadow-lg"
            style={{
              width: '300px',
              height: `${300 / aspectRatio}px`,
            }}
            ref={containerRef}
          >
            {}
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
                className="pointer-events-none h-full w-full object-cover select-none"
              />
            </div>

            {/* Grid overlay for better alignment */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
              <div className="col-start-1 col-end-2 row-start-1 row-end-4 border border-gray-500/30" />
              <div className="col-start-2 col-end-3 row-start-1 row-end-4 border border-gray-500/30" />
              <div className="col-start-1 col-end-4 row-start-1 row-end-2 border border-gray-500/30" />
              <div className="col-start-1 col-end-4 row-start-2 row-end-3 border border-gray-500/30" />
            </div>
          </div>

          {/* Controls */}
          <div className="mt-4 flex items-center gap-4 rounded-full border bg-white px-4 py-2 shadow-sm">
            <ZoomOut
              size={20}
              className="cursor-pointer text-gray-500 hover:text-gray-800"
              onClick={handleZoomOut}
            />
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-32 accent-[#254642]"
            />
            <ZoomIn
              size={20}
              className="cursor-pointer text-gray-500 hover:text-gray-800"
              onClick={handleZoomIn}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t bg-gray-50 p-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-gray-700 transition hover:bg-gray-200"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              const xPercent = (position.x / containerWidth) * 100;
              const yPercent = (position.y / containerHeight) * 100;

              onSave({ scale, x: xPercent, y: yPercent });
            }}
            className="flex items-center gap-2 rounded-lg bg-[#254642] px-6 py-2 font-medium text-white transition hover:bg-[#254642]/90"
          >
            <Check size={18} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
