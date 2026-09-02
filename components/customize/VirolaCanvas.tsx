'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Line, Path, Ring, Stage, TextPath, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  AVAILABLE_FONTS,
  DESIGN_SIZE,
  ENGRAVE_COLOR,
  INNER_RADIUS,
  LINE_STROKE_WIDTH,
  OUTER_RADIUS,
  TEXT_RADIUS,
  ringTextPathData,
  shapePoints,
} from './constants';
import type { DesignElement, ShapeElement } from './types';

export interface ElementPatch {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  angle?: number;
}

interface VirolaCanvasProps {
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
}

const MAX_CANVAS_PX = 520;

/** Radio mínimo (unidades de diseño) para confiar en el ángulo del puntero:
 *  evita saltos si el dedo se desliza hacia el centro (hueco) de la virola. */
const MIN_POINTER_RADIUS = 60;

/** Normaliza un ángulo en grados al rango [0, 360) */
function norm360(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Recorte al anillo: círculo exterior horario + interior ANTI-horario (hueco) */
function clipToRing(ctx: Konva.Context) {
  ctx.arc(0, 0, OUTER_RADIUS, 0, Math.PI * 2, false);
  ctx.arc(0, 0, INNER_RADIUS, 0, Math.PI * 2, true);
}

const RING_TEXT_PATH = ringTextPathData(TEXT_RADIUS);

interface VirolaTextElementProps {
  element: Extract<DesignElement, { type: 'text' }>;
  fontsReady: boolean;
  onSelect: (id: string) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
  pointerAngleDeg: (stage: Konva.Stage | null) => number | null;
}

function VirolaTextElement({
  element,
  fontsReady,
  onSelect,
  onUpdateElement,
  pointerAngleDeg,
}: VirolaTextElementProps) {
  const textRef = useRef<Konva.TextPath>(null);
  const [offsetX, setOffsetX] = useState(0);
  const textGrabOffsetRef = useRef(0);

  // Mide el ancho del texto curvo para centrarlo (offsetX = -textWidth / 2)
  useEffect(() => {
    if (!fontsReady || !textRef.current) return;
    const tw = textRef.current.textWidth;
    if (tw > 0) {
      setOffsetX(-tw / 2);
    }
  }, [fontsReady, element.text, element.fontFamily, element.fontSize]);

  const handleDragStart = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onSelect(element.id);
    node.position({ x: 0, y: 0 }); // el texto nunca se traslada: solo rota
    const pointerAngle = pointerAngleDeg(node.getStage());
    textGrabOffsetRef.current =
      pointerAngle == null ? 0 : norm360(pointerAngle - (element.angle + element.rotation));
  };

  const handleDragMove = (e: KonvaEventObject<DragEvent>) => {
    const node = e.target;
    node.position({ x: 0, y: 0 }); // pegado a la circunferencia durante TODO el drag
    const pointerAngle = pointerAngleDeg(node.getStage());
    if (pointerAngle == null) return;

    const nextRotation = norm360(pointerAngle - textGrabOffsetRef.current);
    if (nextRotation === norm360(element.angle + element.rotation)) return;

    node.rotation(nextRotation);
    onUpdateElement(element.id, { angle: norm360(nextRotation - element.rotation) });
  };

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    e.target.position({ x: 0, y: 0 });
  };

  return (
    <TextPath
      ref={textRef}
      id={element.id}
      draggable
      data={RING_TEXT_PATH}
      text={element.text}
      fontFamily={element.fontFamily}
      fontSize={element.fontSize}
      fill={ENGRAVE_COLOR}
      rotation={element.angle + element.rotation}
      offsetX={offsetX}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    />
  );
}

interface VirolaShapeElementProps {
  element: ShapeElement;
  onSelect: (id: string) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
}

function VirolaShapeElement({ element, onSelect, onUpdateElement }: VirolaShapeElementProps) {
  const common = {
    id: element.id,
    draggable: true,
    onClick: () => onSelect(element.id),
    onTap: () => onSelect(element.id),
    onDragStart: () => onSelect(element.id),
    onDragEnd: (e: KonvaEventObject<DragEvent>) =>
      onUpdateElement(element.id, { x: e.target.x(), y: e.target.y() }),
    onTransformEnd: (e: KonvaEventObject<Event>) => {
      const node = e.target;
      onUpdateElement(element.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        scale: node.scaleX(),
      });
    },
    x: element.x,
    y: element.y,
    rotation: element.rotation,
    scaleX: element.scale,
    scaleY: element.scale,
  };

  if (element.shape === 'circle') {
    return <Circle {...common} radius={20} fill={ENGRAVE_COLOR} />;
  }
  if (element.shape === 'line') {
    return (
      <Line
        {...common}
        points={[-20, 0, 20, 0]}
        stroke={ENGRAVE_COLOR}
        strokeWidth={LINE_STROKE_WIDTH}
        lineCap="round"
        hitStrokeWidth={24}
      />
    );
  }
  return <Line {...common} points={shapePoints(element.shape)} closed fill={ENGRAVE_COLOR} />;
}

interface VirolaPathElementProps {
  element: Extract<DesignElement, { type: 'path' }>;
  onSelect: (id: string) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
}

function VirolaPathElement({ element, onSelect, onUpdateElement }: VirolaPathElementProps) {
  return (
    <Path
      id={element.id}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragStart={() => onSelect(element.id)}
      onDragEnd={(e: KonvaEventObject<DragEvent>) =>
        onUpdateElement(element.id, { x: e.target.x(), y: e.target.y() })
      }
      data={element.d}
      fill={ENGRAVE_COLOR}
      fillRule="evenodd"
      x={element.x}
      y={element.y}
      rotation={element.rotation}
      scaleX={element.scale}
      scaleY={element.scale}
      offsetX={element.sourceWidth / 2}
      offsetY={element.sourceHeight / 2}
      onTransformEnd={(e: KonvaEventObject<Event>) => {
        const node = e.target;
        onUpdateElement(element.id, {
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          scale: node.scaleX(),
        });
      }}
    />
  );
}

/**
 * Canvas interactivo del personalizador.
 *
 * - El Stage es cuadrado y responsivo; internamente se dibuja en el "espacio de
 *   diseño" de 400x400 unidades (igual que el SVG exportado) mediante un Group
 *   raíz centrado y escalado.
 * - La guía (Ring + bordes) no escucha eventos: los toques la atraviesan.
 * - Todo el diseño vive en un Group con clipFunc que lo recorta al anillo.
 * - El texto vive SIEMPRE pegado a la curva: arrastrarlo lo hace deslizar por
 *   el anillo siguiendo al puntero (conversión a coordenadas polares), tanto
 *   durante el drag como al soltar. Su posición (x, y) jamás cambia: rota.
 */
export default function VirolaCanvas({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
}: VirolaCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stageSize, setStageSize] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  const scale = stageSize / DESIGN_SIZE;

  // Tamaño responsivo: cuadrado = ancho del contenedor (tope 520px)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => setStageSize(Math.min(container.clientWidth, MAX_CANVAS_PX));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Las 10 fuentes deben estar cargadas ANTES de medir/dibujar el texto curvo
  useEffect(() => {
    let cancelled = false;
    Promise.all(AVAILABLE_FONTS.map((f) => document.fonts.load(`20px "${f.family}"`)))
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Adjunta el Transformer (rotar/escalar) al elemento seleccionado,
  // excepto al texto curvo, que se maneja con sliders de la toolbar.
  const selectedElement = elements.find((el) => el.id === selectedId) ?? null;

  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;

    if (selectedElement && selectedElement.type !== 'text') {
      const node = transformer.getLayer()?.findOne(`#${selectedElement.id}`);
      transformer.nodes(node ? [node] : []);
    } else {
      transformer.nodes([]);
    }
  }, [selectedElement, elements]);

  const handleStagePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) onSelect(null);
  };

  /**
   * Ángulo polar del puntero en el espacio de diseño (0° = arriba, horario).
   * `getPointerPosition()` devuelve píxeles del Stage: se convierten al espacio
   * de diseño restando el centro y dividiendo por la escala del Group raíz.
   * Devuelve null si no hay puntero o está demasiado cerca del centro.
   */
  const pointerAngleDeg = (stage: Konva.Stage | null): number | null => {
    const pointer = stage?.getPointerPosition();
    if (!pointer || stageSize === 0) return null;
    const x = (pointer.x - stageSize / 2) / scale;
    const y = (pointer.y - stageSize / 2) / scale;
    if (Math.hypot(x, y) < MIN_POINTER_RADIUS) return null;
    return norm360((Math.atan2(y, x) * 180) / Math.PI + 90);
  };

  return (
    <div ref={containerRef} className="relative w-full" style={{ touchAction: 'none' }}>
      {stageSize > 0 && (
        <Stage
          width={stageSize}
          height={stageSize}
          onMouseDown={handleStagePointerDown}
          onTouchStart={handleStagePointerDown}
        >
          <Layer>
            <Group x={stageSize / 2} y={stageSize / 2} scaleX={scale} scaleY={scale}>
              {/* Guía visual: la virola (no escucha eventos) */}
              <Ring
                x={0}
                y={0}
                innerRadius={INNER_RADIUS}
                outerRadius={OUTER_RADIUS}
                fill="#ece6dc"
                listening={false}
              />
              <Circle
                x={0}
                y={0}
                radius={OUTER_RADIUS}
                stroke="#c8bfae"
                strokeWidth={1.5}
                listening={false}
              />
              <Circle
                x={0}
                y={0}
                radius={INNER_RADIUS}
                stroke="#c8bfae"
                strokeWidth={1.5}
                listening={false}
              />
              <Circle
                x={0}
                y={0}
                radius={TEXT_RADIUS}
                stroke="#ddd5c8"
                strokeWidth={1}
                dash={[4, 6]}
                listening={false}
              />

              {/* Diseño del usuario, recortado al anillo */}
              <Group clipFunc={clipToRing}>
                {elements.map((el) => {
                  if (el.type === 'text') {
                    return (
                      <VirolaTextElement
                        key={el.id}
                        element={el}
                        fontsReady={fontsReady}
                        onSelect={onSelect}
                        onUpdateElement={onUpdateElement}
                        pointerAngleDeg={pointerAngleDeg}
                      />
                    );
                  }
                  if (el.type === 'shape') {
                    return (
                      <VirolaShapeElement
                        key={el.id}
                        element={el}
                        onSelect={onSelect}
                        onUpdateElement={onUpdateElement}
                      />
                    );
                  }
                  return (
                    <VirolaPathElement
                      key={el.id}
                      element={el}
                      onSelect={onSelect}
                      onUpdateElement={onUpdateElement}
                    />
                  );
                })}
              </Group>
            </Group>

            <Transformer
              ref={transformerRef}
              keepRatio
              enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
              anchorSize={10}
              anchorCornerRadius={5}
              anchorStroke="#8a6d3b"
              borderStroke="#8a6d3b"
              borderDash={[4, 4]}
            />
          </Layer>
        </Stage>
      )}

      {elements.length === 0 && stageSize > 0 && (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-8 text-center text-sm text-stone-500">
          Tu diseño aparece acá.
          <br />
          Agregá texto, una forma o una imagen 👇
        </p>
      )}
    </div>
  );
}
