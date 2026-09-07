'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { vectorizeImage } from '@/app/customize/actions';
import { generateSvgFromDesign } from '@/lib/customize/svg-generator';
import {
  AUTOSAVE_DEBOUNCE_MS,
  DEFAULT_FONT_FAMILY,
  DESIGN_STORAGE_KEY,
  LEATHER_STORAGE_KEY,
  TEXT_RADIUS,
} from './constants';
import type { CustomizeDesign, CustomizeSurface, DesignElement, ShapeKind } from './types';
import VirolaCanvas, { type ElementPatch } from './VirolaCanvas';
import LeatherCanvas from './LeatherCanvas';
import CustomizeToolbar, { type SelectedElementPatch } from './CustomizeToolbar';

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}`;
}

function loadSavedDesign(key: string): DesignElement[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const design = JSON.parse(raw) as CustomizeDesign;
      if (design.version === 1 && Array.isArray(design.elements)) {
        return design.elements;
      }
    }
  } catch {
    // JSON corrupto o storage no disponible
  }
  return [];
}

export default function CustomizerShell() {
  const [surface, setSurface] = useState<CustomizeSurface>('virola');
  const [virolaElements, setVirolaElements] = useState<DesignElement[]>(() =>
    loadSavedDesign(DESIGN_STORAGE_KEY)
  );
  const [leatherElements, setLeatherElements] = useState<DesignElement[]>(() =>
    loadSavedDesign(LEATHER_STORAGE_KEY)
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const elements = surface === 'virola' ? virolaElements : leatherElements;
  const setElements = surface === 'virola' ? setVirolaElements : setLeatherElements;

  // Autoguardado con debounce independiente para cada superficie
  useEffect(() => {
    const timer = setTimeout(() => {
      const key = surface === 'virola' ? DESIGN_STORAGE_KEY : LEATHER_STORAGE_KEY;
      const design: CustomizeDesign = { version: 1, surface, elements };
      try {
        localStorage.setItem(key, JSON.stringify(design));
      } catch {
        // storage lleno o no disponible
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [elements, surface]);

  const selectedElement = elements.find((el) => el.id === selectedId) ?? null;

  const patchElement = (id: string, patch: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as DesignElement) : el))
    );
  };

  const handleAddText = (text: string) => {
    const el: DesignElement = {
      id: nextId(),
      type: 'text',
      text,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontSize: surface === 'virola' ? 22 : 24,
      angle: 0,
      rotation: 0,
      x: surface === 'leather' ? -120 : 0,
      y: surface === 'leather' ? 0 : TEXT_RADIUS,
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const handleAddShape = (shape: ShapeKind) => {
    const el: DesignElement = {
      id: nextId(),
      type: 'shape',
      shape,
      x: surface === 'leather' ? 120 : 0,
      y: surface === 'leather' ? 0 : TEXT_RADIUS,
      rotation: 0,
      scale: 1,
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const handleUploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await vectorizeImage(formData);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const fit = Math.min(
        (surface === 'virola' ? 45 : 70) / Math.min(result.width, result.height),
        (surface === 'virola' ? 120 : 140) / Math.max(result.width, result.height),
        1.5
      );

      const el: DesignElement = {
        id: nextId(),
        type: 'path',
        d: result.d,
        sourceWidth: result.width,
        sourceHeight: result.height,
        x: surface === 'leather' ? -120 : 0,
        y: surface === 'leather' ? 0 : TEXT_RADIUS,
        rotation: 0,
        scale: fit,
      };
      setElements((prev) => [...prev, el]);
      setSelectedId(el.id);
      toast.success('Imagen vectorizada y agregada');
    } catch {
      toast.error('Error de conexión al procesar la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateSelected = (patch: SelectedElementPatch) => {
    if (!selectedId) return;
    patchElement(selectedId, patch as Partial<DesignElement>);
  };

  const handleCanvasUpdate = (id: string, patch: ElementPatch) => {
    patchElement(id, patch as Partial<DesignElement>);
  };

  const handleDeleteSelected = () => {
    if (!selectedId) return;
    setElements((prev) => prev.filter((el) => el.id !== selectedId));
    setSelectedId(null);
  };

  const handleDownloadSvg = async () => {
    if (elements.length === 0) {
      toast.error('Agregá al menos un elemento al diseño.');
      return;
    }
    const toastId = toast.loading('Preparando matriz SVG para grabado láser…');
    try {
      const svg = await generateSvgFromDesign({ version: 1, surface, elements });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grabado-${surface === 'virola' ? 'virola' : 'base-cuero'}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('SVG descargado exitosamente.');
    } catch {
      toast.error('No se pudo generar el SVG.');
    } finally {
      toast.dismiss(toastId);
    }
  };

  const handleConfirm = () => {
    if (elements.length === 0) {
      toast.error('Agregá al menos un elemento al diseño.');
      return;
    }
    const design: CustomizeDesign = { version: 1, surface, elements };
    console.log('[customize] Diseño confirmado:', design);
    toast.success('¡Diseño listo! Podés descargar la matriz SVG con el botón superior.');
  };

  return (
    <div className="space-y-4">
      {/* Selector de Superficie: Virola vs Base de Cuero */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setSurface('virola');
            setSelectedId(null);
          }}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-xs transition ${
            surface === 'virola'
              ? 'bg-[#254642] text-white shadow-sm ring-2 ring-[#254642]/30'
              : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-base">💍</span>
          <span>Virola de Metal</span>
          {virolaElements.length > 0 && (
            <span className="py-0.2 ml-1 rounded-full bg-[#D4AF37] px-1.5 text-[11px] font-extrabold text-[#254642]">
              {virolaElements.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setSurface('leather');
            setSelectedId(null);
          }}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold shadow-xs transition ${
            surface === 'leather'
              ? 'bg-[#A86632] text-white shadow-sm ring-2 ring-[#A86632]/30'
              : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
          }`}
        >
          <span className="text-base">🧉</span>
          <span>Base de Cuero (Suela)</span>
          {leatherElements.length > 0 && (
            <span className="py-0.2 ml-1 rounded-full bg-stone-900 px-1.5 text-[11px] font-extrabold text-white">
              {leatherElements.length}
            </span>
          )}
        </button>
      </div>

      {/* Indicador contextual de zona */}
      <div className="text-center text-xs text-stone-500">
        {surface === 'virola' ? (
          <p>Grabado láser circular sobre el anillo de metal superior.</p>
        ) : (
          <p>Grabado láser plano sobre la faja de cuero color suela (costura central de tiento).</p>
        )}
      </div>

      {/* Lienzo y Herramientas */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="flex min-w-0 flex-1 justify-center">
          {surface === 'virola' ? (
            <VirolaCanvas
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateElement={handleCanvasUpdate}
            />
          ) : (
            <LeatherCanvas
              elements={elements}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onUpdateElement={handleCanvasUpdate}
            />
          )}
        </div>

        <CustomizeToolbar
          surface={surface}
          selectedElement={selectedElement}
          uploading={uploading}
          onAddText={handleAddText}
          onAddShape={handleAddShape}
          onUploadImage={handleUploadImage}
          onUpdateSelected={handleUpdateSelected}
          onDeleteSelected={handleDeleteSelected}
          onDeselect={() => setSelectedId(null)}
          onDownloadSvg={handleDownloadSvg}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
}
