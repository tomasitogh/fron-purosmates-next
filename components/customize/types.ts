/**
 * Modelo de datos del diseño de grabado de virola.
 *
 * Este JSON es la FUENTE DE VERDAD: el canvas de Konva solo lo renderiza
 * y el SVG final se genera a partir de él (lib/customize/svg-generator.ts).
 *
 * Todo el diseño se expresa en un "espacio de diseño" cuadrado de
 * DESIGN_SIZE x DESIGN_SIZE unidades, con el centro del anillo en (0, 0).
 * Las coordenadas (x, y) de los elementos son relativas al centro.
 */

export type ShapeKind = 'line' | 'triangle' | 'square' | 'circle' | 'star';

interface ElementBase {
  id: string;
  /** Rotación en grados, alrededor del propio centro del elemento */
  rotation: number;
}

/**
 * Texto curvo que sigue la circunferencia del anillo.
 * `angle` indica en qué punto de la circunferencia empieza (0 = arriba, sentido horario).
 */
export interface TextElement extends ElementBase {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  /** Posición angular sobre el anillo, en grados (0-360) */
  angle: number;
}

/** Forma geométrica básica, posicionada libremente dentro del anillo. */
export interface ShapeElement extends ElementBase {
  type: 'shape';
  shape: ShapeKind;
  x: number;
  y: number;
  /** Escala uniforme (1 = tamaño base definido en constants.ts) */
  scale: number;
}

/** Imagen del usuario ya vectorizada a un path SVG (via potrace en el servidor). */
export interface PathElement extends ElementBase {
  type: 'path';
  /** Atributo `d` del path SVG devuelto por potrace */
  d: string;
  /** Ancho/alto originales del bitmap trazado, para calcular el escalado inicial */
  sourceWidth: number;
  sourceHeight: number;
  x: number;
  y: number;
  scale: number;
}

export type DesignElement = TextElement | ShapeElement | PathElement;

export interface VirolaDesign {
  version: 1;
  elements: DesignElement[];
}
