'use client';

import { useRef, useState } from 'react';
import {
  Check,
  Circle,
  Download,
  ImagePlus,
  Loader2,
  Minus,
  Square,
  Star,
  Trash2,
  Triangle,
  Type,
} from 'lucide-react';
import { AVAILABLE_FONTS } from './constants';
import type { DesignElement, ShapeKind } from './types';

export interface SelectedElementPatch {
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  angle?: number;
  rotation?: number;
  scale?: number;
}

interface CustomizeToolbarProps {
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
}

const SHAPE_BUTTONS: { kind: ShapeKind; label: string; Icon: typeof Minus }[] = [
  { kind: 'line', label: 'Línea', Icon: Minus },
  { kind: 'triangle', label: 'Triángulo', Icon: Triangle },
  { kind: 'square', label: 'Cuadrado', Icon: Square },
  { kind: 'circle', label: 'Círculo', Icon: Circle },
  { kind: 'star', label: 'Estrella', Icon: Star },
];

// Nota: `p-0` es OBLIGATORIO en botones solo-ícono de tamaño fijo.
// globals.css heredó del template de Vite un `button { padding: 0.6em 1.2em }`
// en @layer base que, sin p-0, deja ~10px útiles y comprime el ícono.
const iconBtn =
  'flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-stone-200 bg-white p-0 text-stone-700 transition-colors active:bg-stone-100';

/**
 * Panel de controles del personalizador.
 * Mobile: barra pegada abajo. Desktop: columna lateral (md:).
 * Tiene dos modos: "agregar" (default) y "editar" (cuando hay un elemento seleccionado).
 */
export default function CustomizeToolbar({
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
}: CustomizeToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newText, setNewText] = useState('TU TEXTO');

  const editingText = selectedElement?.type === 'text' ? selectedElement : null;
  const editingTransform =
    selectedElement && selectedElement.type !== 'text' ? selectedElement : null;

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

                <label className="block text-xs font-medium text-stone-500">
                  Posición en el anillo: {Math.round(editingText.angle)}°
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={editingText.angle}
                    onChange={(e) => onUpdateSelected({ angle: Number(e.target.value) })}
                    className="mt-1 w-full accent-stone-800"
                  />
                </label>
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
            <div className="flex gap-2">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                maxLength={40}
                className="min-w-0 flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
                placeholder="Escribí tu texto"
              />
              <button
                type="button"
                onClick={() => newText.trim() && onAddText(newText.trim())}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-white active:bg-stone-700"
              >
                <Type size={16} />
                Texto
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className={iconBtn}
                title="Subir imagen"
              >
                {uploading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <ImagePlus size={20} />
                )}
                <span className="text-[10px]">Imagen</span>
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
                  className={iconBtn}
                  title={label}
                >
                  <Icon size={20} />
                  <span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- Acciones finales (siempre visibles) ---- */}
        <div className="mt-4 flex gap-2 border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={onDownloadSvg}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-700 active:bg-stone-100"
          >
            <Download size={16} />
            Descargar SVG
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-stone-800 px-4 py-3 text-sm font-semibold text-white active:bg-stone-700"
          >
            <Check size={16} />
            Confirmar
          </button>
        </div>
      </div>
    </aside>
  );
}
