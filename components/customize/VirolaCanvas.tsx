'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

function shapeNode(el: ShapeElement, common: Record<string, unknown>): React.ReactNode {
  if (el.shape === 'circle') {
    return <Circle key={el.id} {...common} radius={20} fill={ENGRAVE_COLOR} />;
  }
  if (el.shape === 'line') {
    return (
      <Line
        key={el.id}
        {...common}
        points={[-20, 0, 20, 0]}
        stroke={ENGRAVE_COLOR}
        strokeWidth={LINE_STROKE_WIDTH}
        lineCap="round"
        hitStrokeWidth={24}
      />
    );
  }
  return (
    <Line key={el.id} {...common} points={shapePoints(el.shape)} closed fill={ENGRAVE_COLOR} />
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
  // Offset angular (grados) entre el puntero y el inicio del texto al MOMENTO de
  // agarrarlo. Mantiene fijo el punto de agarre: el glifo bajo el dedo no salta.
  const textGrabOffsetRef = useRef(0);

  // Centrado del texto curvo: mide el ancho de cada TextPath después de cargar
  // las fuentes y aplica offsetX = -textWidth/2 para centrarlo en el anillo.
  const textNodeRefs = useRef<Record<string, Konva.TextPath>>({});
  const [textOffsets, setTextOffsets] = useState<Record<string, number>>({});

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

  // Callback ref para capturar cada TextPath y medir su ancho
  const textPathRef = useCallback((node: Konva.TextPath | null, id: string) => {
    if (node) {
      textNodeRefs.current[id] = node;
    } else {
      delete textNodeRefs.current[id];
    }
  }, []);

  // Después de cargar fuentes, medir cada TextPath y calcular el offsetX
  // necesario para centrar el texto en el anillo.
  useEffect(() => {
    if (!fontsReady) return;

    let cancelled = false;
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const next: Record<string, number> = {};
      Object.entries(textNodeRefs.current).forEach(([id, node]) => {
        const tw = node.textWidth;
        if (tw > 0) next[id] = -tw / 2;
      });
      setTextOffsets(next);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [fontsReady, elements]);

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

  const handleTextDragStart = (
    el: Extract<DesignElement, { type: 'text' }>,
    e: KonvaEventObject<DragEvent>
  ) => {
    const node = e.target;
    onSelect(el.id);
    node.position({ x: 0, y: 0 }); // el texto nunca se traslada: solo rota
    const pointerAngle = pointerAngleDeg(node.getStage());
    textGrabOffsetRef.current =
      pointerAngle == null ? 0 : norm360(pointerAngle - (el.angle + el.rotation));
  };

  const handleTextDragMove = (
    el: Extract<DesignElement, { type: 'text' }>,
    e: KonvaEventObject<DragEvent>
  ) => {
    const node = e.target;
    node.position({ x: 0, y: 0 }); // pegado a la circunferencia durante TODO el drag
    const pointerAngle = pointerAngleDeg(node.getStage());
    if (pointerAngle == null) return;

    const nextRotation = norm360(pointerAngle - textGrabOffsetRef.current);
    if (nextRotation === norm360(el.angle + el.rotation)) return;

    // Feedback instantáneo (Konva dibuja antes de que React commite)…
    node.rotation(nextRotation);
    // …y el JSON sigue siendo la fuente de verdad (el slider de la toolbar
    // se actualiza en vivo con el mismo valor).
    onUpdateElement(el.id, { angle: norm360(nextRotation - el.rotation) });
  };

  const handleTextDragEnd = (_el: DesignElement, e: KonvaEventObject<DragEvent>) => {
    e.target.position({ x: 0, y: 0 });
  };

  const handleDragEnd = (el: DesignElement, e: KonvaEventObject<DragEvent>) => {
    if (el.type === 'text') return; // el texto usa los handlers polares de arriba
    onUpdateElement(el.id, { x: e.target.x(), y: e.target.y() });
  };

  const handleTransformEnd = (
    el: ShapeElement | Extract<DesignElement, { type: 'path' }>,
    e: KonvaEventObject<Event>
  ) => {
    const node = e.target;
    onUpdateElement(el.id, {
      x: node.x(),
      y: node.y(),
      rotation: node.rotation(),
      scale: node.scaleX(),
    });
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
                  const common = {
                    id: el.id,
                    draggable: true,
                    onClick: () => onSelect(el.id),
                    onTap: () => onSelect(el.id),
                    onDragStart: () => onSelect(el.id),
                    onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(el, e),
                  };

                  if (el.type === 'text') {
                    return (
                      <TextPath
                        key={fontsReady ? `${el.id}-f` : el.id}
                        ref={(node) => textPathRef(node, el.id)}
                        {...common}
                        data={ringTextPathData(TEXT_RADIUS)}
                        text={el.text}
                        fontFamily={el.fontFamily}
                        fontSize={el.fontSize}
                        fill={ENGRAVE_COLOR}
                        rotation={el.angle + el.rotation}
                        offsetX={textOffsets[el.id] ?? 0}
                        onDragStart={(e) => handleTextDragStart(el, e)}
                        onDragMove={(e) => handleTextDragMove(el, e)}
                        onDragEnd={(e) => handleTextDragEnd(el, e)}
                      />
                    );
                  }

                  if (el.type === 'shape') {
                    return shapeNode(el, {
                      ...common,
                      x: el.x,
                      y: el.y,
                      rotation: el.rotation,
                      scaleX: el.scale,
                      scaleY: el.scale,
                      onTransformEnd: (e: KonvaEventObject<Event>) => handleTransformEnd(el, e),
                    });
                  }

                  // Imagen vectorizada (path de potrace, origin en su centro)
                  return (
                    <Path
                      key={el.id}
                      {...common}
                      data={el.d}
                      fill={ENGRAVE_COLOR}
                      // CRÍTICO: potrace genera subpaths que dependen de evenodd
                      // para los "huecos" (letras, detalles internos). Con la
                      // regla default (nonzero) todo se rellena → chicle negro.
                      fillRule="evenodd"
                      x={el.x}
                      y={el.y}
                      rotation={el.rotation}
                      scaleX={el.scale}
                      scaleY={el.scale}
                      offsetX={el.sourceWidth / 2}
                      offsetY={el.sourceHeight / 2}
                      onTransformEnd={(e: KonvaEventObject<Event>) => handleTransformEnd(el, e)}
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
