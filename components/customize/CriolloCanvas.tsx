'use client';

import { useEffect, useRef, useState } from 'react';
import { Circle, Ellipse, Group, Layer, Line, Path, Stage, Text, Transformer } from 'react-konva';
import type Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import {
  AVAILABLE_FONTS,
  CRIOLLO_CALABAZA_BG,
  CRIOLLO_CALABAZA_BORDER,
  CRIOLLO_ENGRAVE_COLOR,
  CRIOLLO_HEIGHT,
  CRIOLLO_OUTLINE_PATH,
  CRIOLLO_VIROLA_BG,
  CRIOLLO_VIROLA_BORDER,
  CRIOLLO_VIROLA_PATH,
  CRIOLLO_WIDTH,
  DEFAULT_LINE_STROKE_WIDTH,
  HEART_PATH,
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
  strokeWidth?: number;
}

interface CriolloCanvasProps {
  elements: DesignElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdateElement: (id: string, patch: ElementPatch) => void;
}

const MAX_CANVAS_WIDTH = 480;

function shapeNode(el: ShapeElement, common: Record<string, unknown>): React.ReactNode {
  if (el.shape === 'circle') {
    return <Circle key={el.id} {...common} radius={20} fill={CRIOLLO_ENGRAVE_COLOR} />;
  }
  if (el.shape === 'line') {
    const strokeWidth = el.strokeWidth ?? DEFAULT_LINE_STROKE_WIDTH;
    return (
      <Line
        key={el.id}
        {...common}
        points={[-50, 0, 50, 0]}
        stroke={CRIOLLO_ENGRAVE_COLOR}
        strokeWidth={strokeWidth}
        lineCap="round"
        fillEnabled={false}
        hitStrokeWidth={Math.max(24, strokeWidth + 16)}
      />
    );
  }
  if (el.shape === 'heart') {
    return <Path key={el.id} {...common} data={HEART_PATH} fill={CRIOLLO_ENGRAVE_COLOR} />;
  }
  return (
    <Line
      key={el.id}
      {...common}
      points={shapePoints(el.shape as any)}
      closed
      fill={CRIOLLO_ENGRAVE_COLOR}
    />
  );
}

export default function CriolloCanvas({
  elements,
  selectedId,
  onSelect,
  onUpdateElement,
}: CriolloCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [stageWidth, setStageWidth] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  // Espacio interno con margen para que los manejadores de selección no se corten
  const PADDED_WIDTH = CRIOLLO_WIDTH + 40;
  const PADDED_HEIGHT = CRIOLLO_HEIGHT + 40;

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
      onUpdateElement(el.id, {
        x: Math.round(node.x()),
        y: Math.round(node.y()),
        rotation: nextRotation,
        scale: node.scaleX(),
      });
    }
  };

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
              {/* 1. Silueta pura de la Calabaza del Criollo (sin base) */}
              <Path
                data={CRIOLLO_OUTLINE_PATH}
                fill={CRIOLLO_CALABAZA_BG}
                stroke={CRIOLLO_CALABAZA_BORDER}
                strokeWidth={2}
                shadowColor="#000000"
                shadowBlur={12}
                shadowOpacity={0.12}
                shadowOffset={{ x: 0, y: 4 }}
                listening={false}
              />

              {/* Brillo sutil y natural sobre la curvatura de la calabaza */}
              <Line
                points={[0, -110, 0, 70]}
                stroke="#FFFFFF"
                strokeWidth={28}
                opacity={0.07}
                lineCap="round"
                listening={false}
              />

              {/* 2. Boca / Virola de Alpaca superior */}
              <Path
                data={CRIOLLO_VIROLA_PATH}
                fill={CRIOLLO_VIROLA_BG}
                stroke={CRIOLLO_VIROLA_BORDER}
                strokeWidth={1.8}
                listening={false}
              />

              {/* Profundidad interior de la boca del mate */}
              <Ellipse
                x={0}
                y={-149}
                radiusX={100}
                radiusY={9}
                fill="#2E1B10"
                stroke="#1B0F09"
                strokeWidth={1.5}
                listening={false}
              />

              {/* Guía visual suave si no hay elementos agregados */}
              {elements.length === 0 && (
                <Text
                  text="ÁREA DE GRABADO"
                  x={0}
                  y={-20}
                  fontSize={10}
                  fontFamily="sans-serif"
                  fontStyle="bold"
                  fill="#5A2E12"
                  opacity={0.5}
                  align="center"
                  offsetX={48}
                  listening={false}
                />
              )}

              {/* 3. Grupo de grabado láser (recortado a la silueta de la calabaza) */}
              <Group
                clipFunc={(ctx) => {
                  if (typeof Path2D !== 'undefined') {
                    const p = new Path2D(CRIOLLO_OUTLINE_PATH);
                    ctx.clip(p);
                  }
                }}
              >
                {elements.map((el) => {
                  if (el.type === 'text') {
                    const posX = el.x ?? 0;
                    const posY = el.y ?? -20;

                    return (
                      <Text
                        key={el.id}
                        id={el.id}
                        text={el.text}
                        fontFamily={fontsReady ? el.fontFamily : 'sans-serif'}
                        fontSize={el.fontSize}
                        fill={CRIOLLO_ENGRAVE_COLOR}
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
                        fill={CRIOLLO_ENGRAVE_COLOR}
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
