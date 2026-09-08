'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Line, Path, Rect, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  AVAILABLE_FONTS,
  LEATHER_BG_COLOR,
  LEATHER_BORDER_COLOR,
  LEATHER_ENGRAVE_COLOR,
  LEATHER_HEIGHT,
  LEATHER_WIDTH,
  LINE_STROKE_WIDTH,
  SEAM_BORDER_COLOR,
  SEAM_THREAD_COLOR,
  SEAM_WIDTH,
  shapePoints,
} from './constants';
import type { DesignElement, ShapeElement } from './types';

export interface ElementPatch {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  angle?: number;
  fontSize?: number;
}

interface LeatherCanvasProps {
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
}

const MAX_CANVAS_WIDTH = 640;

function shapeNode(el: ShapeElement, common: Record<string, unknown>): React.ReactNode {
  if (el.shape === 'circle') {
    return <Circle key={el.id} {...common} radius={20} fill={LEATHER_ENGRAVE_COLOR} />;
  }
  if (el.shape === 'line') {
    return (
      <Line
        key={el.id}
        {...common}
        points={[-20, 0, 20, 0]}
        stroke={LEATHER_ENGRAVE_COLOR}
        strokeWidth={LINE_STROKE_WIDTH}
        lineCap="round"
        hitStrokeWidth={24}
      />
    );
  }
  return (
    <Line
      key={el.id}
      {...common}
      points={shapePoints(el.shape)}
      closed
      fill={LEATHER_ENGRAVE_COLOR}
    />
  );
}

export default function LeatherCanvas({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
}: LeatherCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // Espacio interno con margen para que los manejadores de selección no se corten
  const PADDED_WIDTH = LEATHER_WIDTH + 30;
  const PADDED_HEIGHT = LEATHER_HEIGHT + 30;

  const scale = stageWidth > 0 ? stageWidth / PADDED_WIDTH : 1;
  const stageHeight = Math.round(PADDED_HEIGHT * scale);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.min(entry.contentRect.width, MAX_CANVAS_WIDTH);
      setStageWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Esperar fuentes para evitar redibujados bruscos
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const fontPromises = AVAILABLE_FONTS.map((f) =>
      document.fonts.load(`16px "${f.family}"`).catch(() => null)
    );
    Promise.all(fontPromises).then(() => setFontsReady(true));
  }, []);

  // Sincronizar transformer de Konva
  useEffect(() => {
    const tr = transformerRef.current;
    if (!tr) return;
    const stage = tr.getStage();
    if (!stage) return;

    if (!selectedId) {
      tr.nodes([]);
      tr.getLayer()?.batchDraw();
      return;
    }

    const node = stage.findOne(`#${selectedId}`);
    if (node) {
      tr.nodes([node]);
      tr.getLayer()?.batchDraw();
    } else {
      tr.nodes([]);
    }
  }, [selectedId, elements, fontsReady]);

  const handleStagePointerDown = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      onSelect(null);
    }
  };

  const handleDragEnd = (el: DesignElement, e: KonvaEventObject<DragEvent>) => {
    onUpdateElement(el.id, { x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
  };

  const handleTransformEnd = (el: DesignElement, e: KonvaEventObject<Event>) => {
    const node = e.target;
    const nextRotation = Math.round(node.rotation());

    if (el.type === 'text') {
      // En texto aumentamos el fontSize y reseteamos el scale del nodo a 1
      const newFontSize = Math.round(el.fontSize * node.scaleX());
      node.scaleX(1);
      node.scaleY(1);
      onUpdateElement(el.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        rotation: nextRotation,
        fontSize: Math.max(12, Math.min(60, newFontSize)),
      });
    } else {
      // El Transformer de Konva multiplica el scale actual del nodo por el
      // factor del drag, así que node.scaleX() ya es el valor absoluto
      // acumulado. Guardarlo directo (sin multiplicar por el.scale) evita
      // el efecto opuesto/doble al resize (misma corrección que la virola).
      onUpdateElement(el.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        rotation: nextRotation,
        scale: node.scaleX(),
      });
    }
  };

  // Generación de las cruces de la costura central
  const numStitches = 7;
  const stitchStep = LEATHER_HEIGHT / numStitches;
  const halfSeam = SEAM_WIDTH / 2;

  const stitches = [];
  for (let i = 0; i < numStitches; i++) {
    const yTop = -LEATHER_HEIGHT / 2 + i * stitchStep;
    const yBottom = yTop + stitchStep;

    stitches.push(
      <Line
        key={`s1-${i}`}
        points={[-halfSeam + 4, yTop + 3, halfSeam - 4, yBottom - 3]}
        stroke={SEAM_THREAD_COLOR}
        strokeWidth={2.4}
        lineCap="round"
        listening={false}
      />
    );
    stitches.push(
      <Line
        key={`s2-${i}`}
        points={[halfSeam - 4, yTop + 3, -halfSeam + 4, yBottom - 3]}
        stroke={SEAM_THREAD_COLOR}
        strokeWidth={2.4}
        lineCap="round"
        listening={false}
      />
    );
    stitches.push(
      <Circle
        key={`h1-${i}`}
        x={-halfSeam + 4}
        y={yTop + 3}
        radius={1.6}
        fill="#1E0F07"
        listening={false}
      />
    );
    stitches.push(
      <Circle
        key={`h2-${i}`}
        x={halfSeam - 4}
        y={yTop + 3}
        radius={1.6}
        fill="#1E0F07"
        listening={false}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ touchAction: 'none' }}>
      {stageWidth > 0 && (
        <Stage
          width={stageWidth}
          height={stageHeight}
          onMouseDown={handleStagePointerDown}
          onTouchStart={handleStagePointerDown}
          className="mx-auto flex justify-center"
        >
          <Layer>
            <Group x={stageWidth / 2} y={stageHeight / 2} scaleX={scale} scaleY={scale}>
              {/* Sombra y Base de Cuero Suela */}
              <Rect
                x={-LEATHER_WIDTH / 2}
                y={-LEATHER_HEIGHT / 2}
                width={LEATHER_WIDTH}
                height={LEATHER_HEIGHT}
                cornerRadius={8}
                fill={LEATHER_BG_COLOR}
                stroke={LEATHER_BORDER_COLOR}
                strokeWidth={2.5}
                shadowColor="#000"
                shadowBlur={12}
                shadowOpacity={0.12}
                shadowOffset={{ x: 0, y: 3 }}
                listening={false}
              />

              {/* Puntada perimetral decorativa */}
              <Rect
                x={-LEATHER_WIDTH / 2 + 7}
                y={-LEATHER_HEIGHT / 2 + 7}
                width={LEATHER_WIDTH - 14}
                height={LEATHER_HEIGHT - 14}
                cornerRadius={5}
                stroke="#A86A34"
                strokeWidth={1}
                dash={[5, 4]}
                listening={false}
              />

              {/* Tira de la costura central (fondo de costura) */}
              <Rect
                x={-halfSeam}
                y={-LEATHER_HEIGHT / 2}
                width={SEAM_WIDTH}
                height={LEATHER_HEIGHT}
                fill="#AC703B"
                listening={false}
              />
              <Line
                points={[-halfSeam, -LEATHER_HEIGHT / 2, -halfSeam, LEATHER_HEIGHT / 2]}
                stroke={SEAM_BORDER_COLOR}
                strokeWidth={1.5}
                listening={false}
              />
              <Line
                points={[halfSeam, -LEATHER_HEIGHT / 2, halfSeam, LEATHER_HEIGHT / 2]}
                stroke={SEAM_BORDER_COLOR}
                strokeWidth={1.5}
                listening={false}
              />

              {/* Cruces de la costura central de tiento */}
              {stitches}

              {/* Guías sutiles de zona izquierda / derecha */}
              <Text
                text="LADO IZQUIERDO"
                x={-LEATHER_WIDTH / 4}
                y={-LEATHER_HEIGHT / 2 + 10}
                fontSize={9}
                fontFamily="sans-serif"
                fontStyle="bold"
                fill="#8C5224"
                opacity={0.6}
                offsetX={40}
                listening={false}
              />
              <Text
                text="LADO DERECHO"
                x={LEATHER_WIDTH / 4}
                y={-LEATHER_HEIGHT / 2 + 10}
                fontSize={9}
                fontFamily="sans-serif"
                fontStyle="bold"
                fill="#8C5224"
                opacity={0.6}
                offsetX={35}
                listening={false}
              />

              {/* Grupo de elementos de grabado láser */}
              <Group
                clipFunc={(ctx) => {
                  // Recorte para que no salga del cuero
                  ctx.rect(-LEATHER_WIDTH / 2, -LEATHER_HEIGHT / 2, LEATHER_WIDTH, LEATHER_HEIGHT);
                }}
              >
                {elements.map((el) => {
                  if (el.type === 'text') {
                    // Texto plano para cuero
                    const posX = el.x ?? -100;
                    const posY = el.y ?? 0;

                    return (
                      <Text
                        key={el.id}
                        id={el.id}
                        text={el.text}
                        fontFamily={fontsReady ? el.fontFamily : 'sans-serif'}
                        fontSize={el.fontSize}
                        fill={LEATHER_ENGRAVE_COLOR}
                        x={posX}
                        y={posY}
                        rotation={el.rotation ?? 0}
                        draggable
                        align="center"
                        verticalAlign="middle"
                        onClick={() => onSelect(el.id)}
                        onTap={() => onSelect(el.id)}
                        onDragStart={() => onSelect(el.id)}
                        onDragEnd={(e) => handleDragEnd(el, e)}
                        onTransformEnd={(e) => handleTransformEnd(el, e)}
                      />
                    );
                  }

                  if (el.type === 'shape') {
                    const common = {
                      id: el.id,
                      x: el.x,
                      y: el.y,
                      rotation: el.rotation,
                      scaleX: el.scale,
                      scaleY: el.scale,
                      draggable: true,
                      onClick: () => onSelect(el.id),
                      onTap: () => onSelect(el.id),
                      onDragStart: () => onSelect(el.id),
                      onDragEnd: (e: KonvaEventObject<DragEvent>) => handleDragEnd(el, e),
                      onTransformEnd: (e: KonvaEventObject<Event>) => handleTransformEnd(el, e),
                    };
                    return shapeNode(el, common);
                  }

                  if (el.type === 'path') {
                    return (
                      <Path
                        key={el.id}
                        id={el.id}
                        data={el.d}
                        fill={LEATHER_ENGRAVE_COLOR}
                        fillRule="evenodd"
                        x={el.x}
                        y={el.y}
                        offsetX={el.sourceWidth / 2}
                        offsetY={el.sourceHeight / 2}
                        rotation={el.rotation}
                        scaleX={el.scale}
                        scaleY={el.scale}
                        draggable
                        onClick={() => onSelect(el.id)}
                        onTap={() => onSelect(el.id)}
                        onDragStart={() => onSelect(el.id)}
                        onDragEnd={(e) => handleDragEnd(el, e)}
                        onTransformEnd={(e) => handleTransformEnd(el, e)}
                      />
                    );
                  }

                  return null;
                })}
              </Group>

              {/* Transformer para escalar y rotar */}
              <Transformer
                ref={transformerRef}
                keepRatio={true}
                rotateEnabled={true}
                enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 12 || newBox.height < 12) return oldBox;
                  return newBox;
                }}
                anchorSize={8}
                anchorCornerRadius={2}
                borderStroke="#254642"
                borderStrokeWidth={1.5}
                borderDash={[4, 3]}
                anchorStroke="#254642"
                anchorFill="#ffffff"
              />
            </Group>
          </Layer>
        </Stage>
      )}
    </div>
  );
}
