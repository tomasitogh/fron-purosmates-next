'use client';

import { useRef, useState } from 'react';
import {
  Check,
  Download,
  Heart,
  ImagePlus,
  Loader2,
  Minus,
  Save,
  ShoppingCart,
  Star,
  Trash2,
  Type,
} from 'lucide-react';
import { AVAILABLE_FONTS } from './constants';
import type { CustomizeSurface, DesignElement, ShapeKind } from './types';

export interface SelectedElementPatch {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  angle?: number;
  rotation?: number;
  scale?: number;
}

interface CustomizeToolbarProps {
  surface?: CustomizeSurface;
  selectedElement: DesignElement | null;
  uploading: boolean;
  onAddText: (text: string) => void;
  onAddShape: (shape: ShapeKind) => void;
  onUploadImage: (file: File) => void;
  onUpdateSelected: (patch: SelectedElementPatch) => void;
  onDeleteSelected: () => void;
  onDeselect: () => void;
  onDownloadSvg: () => void;
  onConfirm: () => void;
  onAttachToOrder: () => void;
}

const SHAPE_BUTTONS: { kind: ShapeKind; label: string; Icon: typeof Heart }[] = [
  { kind: 'heart', label: 'Corazón', Icon: Heart },
  { kind: 'star', label: 'Estrella', Icon: Star },
  { kind: 'line', label: 'Línea', Icon: Minus },
];

// Nota: `p-2.5` es OBLIGATORIO para sobreescribir el `button { padding: 0.6em 1.2em }` de @layer base.
const gridBtn =
  'flex flex-col items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white p-2.5 text-stone-700 shadow-2xs transition hover:border-[#254642]/40 hover:bg-stone-50 active:scale-95 disabled:opacity-50';

/**
 * Panel de controles del personalizador.
 * Mobile: barra pegada abajo. Desktop: columna lateral (md:).
 * Tiene dos modos: "agregar" (default) y "editar" (cuando hay un elemento seleccionado).
 */
export default function CustomizeToolbar({
  surface = 'virola',
  selectedElement,
  uploading,
  onAddText,
  onAddShape,
  onUploadImage,
  onUpdateSelected,
  onDeleteSelected,
  onDeselect,
  onDownloadSvg,
  onConfirm,
  onAttachToOrder,
}: CustomizeToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState('');

  const editingText = selectedElement?.type === 'text' ? selectedElement : null;
  const editingTransform =
    selectedElement && selectedElement.type !== 'text' ? selectedElement : null;

  // Precomputados en scope normal (NO dentro del JSX): el transpilador SWC
  // falla al declarar la variable temporal cuando `x.prop ?? 0` va directo
  // dentro de un contenedor de expresión JSX (ReferenceError en runtime).
  const editingTextRotation = editingText ? (editingText.rotation ?? 0) : 0;
  const editingTextAngle = editingText ? (editingText.angle ?? 0) : 0;

  return (
    <aside className="w-full rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:w-80">
      <div className="space-y-4">
        {/* ---- Modo EDITAR elemento seleccionado ---- */}
        {selectedElement ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-stone-800">
                {editingText ? 'Editar texto' : 'Editar elemento'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-red-600 p-0 text-white shadow-sm active:bg-red-700"
                  aria-label="Eliminar elemento"
                  title="Eliminar elemento"
                >
                  <Trash2 size={20} strokeWidth={2.25} />
                </button>
                <button
                  type="button"
                  onClick={onDeselect}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border-0 bg-stone-800 p-0 text-white shadow-sm active:bg-stone-700"
                  aria-label="Listo"
                  title="Listo"
                >
                  <Check size={20} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {editingText && (
              <>
                <input
                  type="text"
                  value={editingText.text}
                  onChange={(e) => onUpdateSelected({ text: e.target.value })}
                  maxLength={40}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                  placeholder="Escribí tu texto"
                />

                <div>
                  <p className="mb-1.5 text-xs font-medium text-stone-500">Tipografía</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {AVAILABLE_FONTS.map((f) => (
                      <button
                        key={f.family}
                        type="button"
                        onClick={() => onUpdateSelected({ fontFamily: f.family })}
                        style={{ fontFamily: f.family }}
                        className={`truncate rounded-lg border px-1 py-2 text-xs ${
                          editingText.fontFamily === f.family
                            ? 'border-stone-800 bg-stone-800 text-white'
                            : 'border-stone-200 bg-white text-stone-700'
                        }`}
                        title={f.label}
                      >
                        Ag
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-xs font-medium text-stone-500">
                  Tamaño: {editingText.fontSize}
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={editingText.fontSize}
                    onChange={(e) => onUpdateSelected({ fontSize: Number(e.target.value) })}
                    className="mt-1 w-full accent-stone-800"
                  />
                </label>

                {surface === 'leather' ? (
                  <label className="block text-xs font-medium text-stone-500">
                    Rotación: {Math.round(editingTextRotation)}°
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      step={1}
                      value={editingTextRotation}
                      onChange={(e) => onUpdateSelected({ rotation: Number(e.target.value) })}
                      className="mt-1 w-full accent-stone-800"
                    />
                  </label>
                ) : (
                  <label className="block text-xs font-medium text-stone-500">
                    Posición en el anillo: {Math.round(editingTextAngle)}°
                    <input
                      type="range"
                      min={0}
                      max={360}
                      step={1}
                      value={editingTextAngle}
                      onChange={(e) => onUpdateSelected({ angle: Number(e.target.value) })}
                      className="mt-1 w-full accent-stone-800"
                    />
                  </label>
                )}
              </>
            )}

            {editingTransform && (
              <>
                <label className="block text-xs font-medium text-stone-500">
                  Tamaño: {editingTransform.scale.toFixed(2)}x
                  <input
                    type="range"
                    min={0.2}
                    max={3}
                    step={0.05}
                    value={editingTransform.scale}
                    onChange={(e) => onUpdateSelected({ scale: Number(e.target.value) })}
                    className="mt-1 w-full accent-stone-800"
                  />
                </label>
                <label className="block text-xs font-medium text-stone-500">
                  Rotación: {Math.round(editingTransform.rotation)}°
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={editingTransform.rotation}
                    onChange={(e) => onUpdateSelected({ rotation: Number(e.target.value) })}
                    className="mt-1 w-full accent-stone-800"
                  />
                </label>
                <p className="text-xs text-stone-400">
                  También podés arrastrarlo y usar los puntos de las esquinas sobre el canvas.
                </p>
              </>
            )}
          </div>
        ) : (
          /* ---- Modo AGREGAR ---- */
          <div className="space-y-4">
            {/* Input de texto y botón dinámico "Agregar texto" */}
            <div className="space-y-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newText.trim()) {
                      onAddText(newText.trim());
                      setNewText('');
                    }
                  }
                }}
                maxLength={40}
                className="w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm transition focus:border-[#254642] focus:ring-1 focus:ring-[#254642] focus:outline-none"
                placeholder="Escribí tu texto"
              />
              {newText.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (newText.trim()) {
                      onAddText(newText.trim());
                      setNewText('');
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#254642] p-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#1a3330] active:scale-[0.99]"
                >
                  <Type size={16} />
                  <span>Agregar texto</span>
                </button>
              )}
            </div>

            {/* Elementos decorativos (Imagen, Corazón, Estrella, Línea) */}
            <div>
              <p className="mb-2 text-xs font-medium text-stone-500">Elementos decorativos</p>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className={gridBtn}
                  title="Subir imagen"
                >
                  {uploading ? (
                    <Loader2 size={20} className="animate-spin text-[#254642]" />
                  ) : (
                    <ImagePlus size={20} className="text-[#254642]" />
                  )}
                  <span className="text-[11px] font-medium">Imagen</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,.heic,.heif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUploadImage(file);
                    e.target.value = '';
                  }}
                />
                {SHAPE_BUTTONS.map(({ kind, label, Icon }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => onAddShape(kind)}
                    className={gridBtn}
                    title={label}
                  >
                    <Icon size={20} className="text-[#254642]" />
                    <span className="text-[11px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ---- Acciones finales (visibles solo cuando no se está editando un elemento) ---- */}
            <div className="mt-4 flex flex-col gap-2.5 border-t border-stone-100 pt-4">
              <button
                type="button"
                onClick={onConfirm}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs font-semibold text-stone-700 shadow-2xs transition hover:bg-stone-100 active:scale-[0.99]"
              >
                <Save size={15} className="text-stone-500" />
                Guardar diseño
              </button>
              <button
                type="button"
                onClick={onAttachToOrder}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#254642] p-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#1a3330] active:scale-[0.99]"
              >
                <ShoppingCart size={17} className="text-[#D4AF37]" />
                Adjuntar personalizado en el pedido
              </button>
              <button
                type="button"
                onClick={onDownloadSvg}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white p-2.5 text-xs font-semibold text-stone-600 shadow-2xs transition hover:bg-stone-50 active:scale-[0.99]"
              >
                <Download size={15} />
                Descargar SVG
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
