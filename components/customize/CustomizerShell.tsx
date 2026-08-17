'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { vectorizeImage } from '@/app/customize/actions';
import { generateSvgFromDesign } from '@/lib/customize/svg-generator';
import {
  AUTOSAVE_DEBOUNCE_MS,
  DEFAULT_FONT_FAMILY,
  DESIGN_STORAGE_KEY,
  TEXT_RADIUS,
} from './constants';
import type { DesignElement, ShapeKind, VirolaDesign } from './types';
import VirolaCanvas, { type ElementPatch } from './VirolaCanvas';
import CustomizeToolbar, { type SelectedElementPatch } from './CustomizeToolbar';

let idCounter = 0;
function nextId() {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter}`;
}

/**
 * Orquestador del personalizador: dueño del estado (el JSON del diseño),
 * del autoguardado en localStorage, de la subida de imágenes y de la
 * exportación del SVG. El canvas y la toolbar son "tontos": reciben
 * datos y avisan cambios.
 */
/**
 * Lee el diseño autoguardado. Se usa como inicializador lazy de useState:
 * como este componente se carga con `ssr: false`, SIEMPRE corre en el cliente
 * (localStorage existe) y no hay riesgo de mismatch de hidratación.
 */
function loadSavedDesign(): DesignElement[] {
  try {
    const raw = localStorage.getItem(DESIGN_STORAGE_KEY);
    if (raw) {
      const design = JSON.parse(raw) as VirolaDesign;
      if (design.version === 1 && Array.isArray(design.elements)) {
        return design.elements;
      }
    }
  } catch {
    // JSON corrupto o storage no disponible → empezar de cero
  }
  return [];
}

export default function CustomizerShell() {
  const [elements, setElements] = useState<DesignElement[]>(loadSavedDesign);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Autoguardado con debounce. Como el estado inicial ya viene del storage,
  // el primer guardado simplemente reescribe los mismos datos (sin pérdida).
  useEffect(() => {
    const timer = setTimeout(() => {
      const design: VirolaDesign = { version: 1, elements };
      try {
        localStorage.setItem(DESIGN_STORAGE_KEY, JSON.stringify(design));
      } catch {
        // storage lleno o no disponible: el diseño sigue vivo en memoria
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [elements]);

  const selectedElement = elements.find((el) => el.id === selectedId) ?? null;

  const patchElement = (id: string, patch: Partial<DesignElement>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as DesignElement) : el))
    );
  };

  // ---- Acciones de la toolbar ----

  const handleAddText = (text: string) => {
    const el: DesignElement = {
      id: nextId(),
      type: 'text',
      text,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontSize: 22,
      angle: 0,
      rotation: 0,
    };
    setElements((prev) => [...prev, el]);
    setSelectedId(el.id);
  };

  const handleAddShape = (shape: ShapeKind) => {
    // Aparece sobre la banda visible del anillo (abajo); en (0,0) quedaría
    // oculto por el recorte, porque el centro es el hueco de la virola.
    const el: DesignElement = {
      id: nextId(),
      type: 'shape',
      shape,
      x: 0,
      y: TEXT_RADIUS,
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

      // Escala inicial: dimensión menor ≈ alto de la banda (45) para que luzca
      // sobre la virola, limitando la mayor a 120 para que no desborde mucho.
      const fit = Math.min(
        45 / Math.min(result.width, result.height),
        120 / Math.max(result.width, result.height),
        1.5
      );

      const el: DesignElement = {
        id: nextId(),
        type: 'path',
        d: result.d,
        sourceWidth: result.width,
        sourceHeight: result.height,
        x: 0,
        y: TEXT_RADIUS, // nace sobre la banda visible, no en el hueco
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

  const handleDownloadSvg = () => {
    if (elements.length === 0) {
      toast.error('Agregá al menos un elemento al diseño.');
      return;
    }
    const svg = generateSvgFromDesign({ version: 1, elements });
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'grabado-virola.svg';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('SVG descargado. Abrilo en el navegador para validarlo.');
  };

  // Stub: en una fase posterior este JSON se envía a la API de Spring Boot
  const handleConfirm = () => {
    if (elements.length === 0) {
      toast.error('Agregá al menos un elemento al diseño.');
      return;
    }
    const design: VirolaDesign = { version: 1, elements };
    console.log('[customize] Diseño confirmado (pendiente enviar a Spring Boot):', design);
    toast.success('Diseño listo. La integración con el pedido llega en la próxima fase.');
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 justify-center">
        <VirolaCanvas
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUpdateElement={handleCanvasUpdate}
        />
      </div>
      <CustomizeToolbar
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
  );
}
