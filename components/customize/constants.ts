/**
 * Geometría de la virola y constantes compartidas entre el canvas (Konva)
 * y el generador de SVG. Ambos dibujan en el mismo "espacio de diseño":
 * un cuadrado de DESIGN_SIZE x DESIGN_SIZE con el centro del anillo en (0, 0).
 */

/** Tamaño del espacio de diseño en unidades abstractas */
export const DESIGN_SIZE = 400;

/** Radio exterior de la virola (borde físico del grabado) */
export const OUTER_RADIUS = 180;

/** Radio interior de la virola (el hueco del anillo) */
export const INNER_RADIUS = 130;

/** Radio sobre el que "camina" la línea base del texto curvo */
export const TEXT_RADIUS = (OUTER_RADIUS + INNER_RADIUS) / 2; // 155

/** Tamaño base de las formas geométricas (antes de aplicar scale) */
export const SHAPE_BASE_SIZE = 40;

/** Color único de grabado: negro puro (es grabado láser, no impresión) */
export const ENGRAVE_COLOR = '#1a1a1a';

/** Clave de localStorage para el autoguardado */
export const DESIGN_STORAGE_KEY = 'virola-design';

/** Debounce del autoguardado en ms */
export const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Devuelve el path SVG de una circunferencia completa de radio `r`
 * centrada en (0, 0), empezando arriba y en sentido horario.
 *
 * Se usa tanto en el <TextPath> de Konva como en el <textPath> del SVG
 * exportado, garantizando que el texto se curva idéntico en ambos.
 *
 * Al ser sentido horario y arrancar arriba, el texto fluye hacia la derecha
 * y los glifos "miran" hacia afuera del anillo.
 */
export function ringTextPathData(radius: number): string {
  return `M 0 ${-radius} A ${radius} ${radius} 0 1 1 0 ${radius} A ${radius} ${radius} 0 1 1 0 ${-radius}`;
}

/** Las 10 tipografías disponibles para el grabado (Google Fonts) */
export const AVAILABLE_FONTS = [
  { family: 'Bebas Neue', label: 'Bebas Neue' },
  { family: 'Montserrat', label: 'Montserrat' },
  { family: 'Oswald', label: 'Oswald' },
  { family: 'Playfair Display', label: 'Playfair' },
  { family: 'Cinzel', label: 'Cinzel' },
  { family: 'Dancing Script', label: 'Dancing' },
  { family: 'Pacifico', label: 'Pacifico' },
  { family: 'Lobster', label: 'Lobster' },
  { family: 'Caveat', label: 'Caveat' },
  { family: 'Roboto Mono', label: 'Mono' },
] as const;

export const DEFAULT_FONT_FAMILY: string = AVAILABLE_FONTS[0].family;

/**
 * Path SVG del anillo (círculo exterior horario + círculo interior ANTI-horario).
 * Al tener los subpaths con sentidos opuestos, la regla de relleno "nonzero"
 * (default en canvas y SVG) produce el hueco del medio. Se usa para recortar
 * el diseño al área de la virola, tanto en el canvas como en el SVG exportado.
 */
export function ringClipPathData(): string {
  const outer = `M 0 ${-OUTER_RADIUS} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 0 ${OUTER_RADIUS} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 1 1 0 ${-OUTER_RADIUS}`;
  const inner = `M 0 ${-INNER_RADIUS} A ${INNER_RADIUS} ${INNER_RADIUS} 0 1 0 0 ${INNER_RADIUS} A ${INNER_RADIUS} ${INNER_RADIUS} 0 1 0 0 ${-INNER_RADIUS}`;
  return `${outer} ${inner}`;
}

/**
 * Puntos (array plano x,y) de cada forma geométrica, centrados en (0, 0).
 * El mismo array alimenta el <Line closed> de Konva y el <polygon> del SVG,
 * así las dos representaciones quedan idénticas.
 * 'circle' y 'line' se manejan aparte (círculo real / trazo con stroke).
 */
export function shapePoints(
  kind: 'triangle' | 'square' | 'star',
  size = SHAPE_BASE_SIZE
): number[] {
  const h = size / 2;
  switch (kind) {
    case 'triangle':
      return [0, -h, h, h, -h, h];
    case 'square':
      return [-h, -h, h, -h, h, h, -h, h];
    case 'star': {
      const points: number[] = [];
      const innerR = size / 4;
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? h : innerR;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        points.push(radius * Math.cos(angle), radius * Math.sin(angle));
      }
      return points;
    }
  }
}

/** Ancho de trazo de la forma 'line' (las demás son rellenas) */
export const LINE_STROKE_WIDTH = 5;

/** Query de Google Fonts que carga las 10 familias de una sola vez */
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  AVAILABLE_FONTS.map(
    (f) => `family=${encodeURIComponent(f.family).replace(/%20/g, '+')}:wght@400;700`
  ).join('&') +
  '&display=swap';
