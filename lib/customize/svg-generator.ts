import {
  DESIGN_SIZE,
  ENGRAVE_COLOR,
  INNER_RADIUS,
  LINE_STROKE_WIDTH,
  OUTER_RADIUS,
  TEXT_RADIUS,
  ringClipPathData,
  ringTextPathData,
  shapePoints,
} from '@/components/customize/constants';
import type { DesignElement, ShapeElement, VirolaDesign } from '@/components/customize/types';

/** Escapa caracteres especiales para meter texto plano dentro de XML */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function shapeToSvg(el: ShapeElement): string {
  const transform = `translate(${el.x} ${el.y}) rotate(${el.rotation}) scale(${el.scale})`;

  if (el.shape === 'circle') {
    const radius = 20; // SHAPE_BASE_SIZE / 2
    return `<circle cx="0" cy="0" r="${radius}" transform="${transform}" fill="${ENGRAVE_COLOR}"/>`;
  }

  if (el.shape === 'line') {
    const half = 20; // SHAPE_BASE_SIZE / 2
    return (
      `<line x1="${-half}" y1="0" x2="${half}" y2="0" transform="${transform}" ` +
      `stroke="${ENGRAVE_COLOR}" stroke-width="${LINE_STROKE_WIDTH}" stroke-linecap="round"/>`
    );
  }

  const points = shapePoints(el.shape);
  const pairs: string[] = [];
  for (let i = 0; i < points.length; i += 2) {
    pairs.push(`${points[i]},${points[i + 1]}`);
  }
  return `<polygon points="${pairs.join(' ')}" transform="${transform}" fill="${ENGRAVE_COLOR}"/>`;
}

function elementToSvg(el: DesignElement): string {
  switch (el.type) {
    case 'text':
      // El texto sigue la circunferencia guía; el <g> lo rota a su posición angular.
      // rotation adicional del usuario se suma al ángulo.
      return (
        `<g transform="rotate(${el.angle + el.rotation})">` +
        `<text font-family="'${escapeXml(el.fontFamily)}', sans-serif" font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}">` +
        `<textPath href="#virola-text-circle" xlink:href="#virola-text-circle">${escapeXml(el.text)}</textPath>` +
        `</text></g>`
      );
    case 'shape':
      return shapeToSvg(el);
    case 'path':
      // El path de potrace nace con origen en la esquina superior izquierda del
      // bitmap; el último translate lo recentra para que (x, y) sea su centro.
      // fill-rule="evenodd" es OBLIGATORIO: potrace lo emite en su SVG y sin él
      // los huecos internos (letras, detalles) se rellenan todos de negro.
      return (
        `<g transform="translate(${el.x} ${el.y}) rotate(${el.rotation}) scale(${el.scale})">` +
        `<path d="${el.d}" transform="translate(${-el.sourceWidth / 2} ${-el.sourceHeight / 2})" fill="${ENGRAVE_COLOR}" fill-rule="evenodd"/>` +
        `</g>`
      );
  }
}

/**
 * Genera el archivo SVG final a partir del JSON del diseño.
 *
 * - viewBox centrado en (0, 0): mismo espacio de coordenadas que el canvas.
 * - El grupo #grabado está RECORTADO al anillo (clipPath), igual que el canvas:
 *   nada queda grabado fuera de la virola.
 * - El grupo #guia-referencia son los círculos del borde físico: sirven para
 *   validar visualmente y se borran antes de enviar a la grabadora.
 *
 * Nota de tipografía: el texto viaja como <textPath> con font-family. Para que
 * la grabadora lo respete, la PC destino debe tener la fuente instalada
 * (convertir a outlines queda como mejora futura).
 */
export function generateSvgFromDesign(design: VirolaDesign): string {
  const half = DESIGN_SIZE / 2;

  const body = design.elements.map(elementToSvg).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="${-half} ${-half} ${DESIGN_SIZE} ${DESIGN_SIZE}"
     width="${DESIGN_SIZE}" height="${DESIGN_SIZE}">
  <defs>
    <path id="virola-text-circle" d="${ringTextPathData(TEXT_RADIUS)}" fill="none"/>
    <clipPath id="virola-clip">
      <path d="${ringClipPathData()}"/>
    </clipPath>
  </defs>
  <!-- Guía de referencia (bordes físicos de la virola). BORRAR este grupo antes de grabar. -->
  <g id="guia-referencia" fill="none" stroke="#bbbbbb" stroke-width="1">
    <circle cx="0" cy="0" r="${OUTER_RADIUS}"/>
    <circle cx="0" cy="0" r="${INNER_RADIUS}"/>
  </g>
  <g id="grabado" clip-path="url(#virola-clip)">
    ${body}
  </g>
</svg>
`;
}
