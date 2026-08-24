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
      // dominant-baseline="central" es VITAL para que el texto se centre verticalmente
      // sobre el radio medio del anillo (TEXT_RADIUS), igual a como lo dibuja Konva TextPath.
      return (
        `<g transform="rotate(${el.angle + el.rotation})">` +
        `<text font-family="'${escapeXml(el.fontFamily)}', sans-serif" font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}" dominant-baseline="central">` +
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

/** URLs de los archivos de fuente dentro de la CSS de Google Fonts */
const GSTATIC_URL_RE = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;

/** Cache por familia: evita re-descargar las fuentes en cada exportación */
const embeddedFontCssCache = new Map<string, Promise<string>>();

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Descarga la CSS de Google Fonts para `family` (la misma consulta que usa la
 * página: wght@400;700) y reemplaza cada url(gstatic) por una data-URI base64
 * del archivo de fuente. El resultado es una CSS autocontenida.
 */
async function embeddedFontCssFor(family: string): Promise<string> {
  const cached = embeddedFontCssCache.get(family);
  if (cached) return cached;

  const promise = (async () => {
    const query =
      'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(family).replace(/%20/g, '+') +
      ':wght@400;700&display=swap';

    const cssRes = await fetch(query);
    if (!cssRes.ok) throw new Error(`No se pudo cargar la tipografía ${family}`);
    const css = await cssRes.text();

    // Intercambia cada fuente por su data-URI (mantiene @font-face y unicode-range)
    const replacements: Array<[string, string]> = [];
    for (const match of css.matchAll(GSTATIC_URL_RE)) {
      const url = match[1];
      const fontRes = await fetch(url);
      if (!fontRes.ok) continue;
      const buffer = await fontRes.arrayBuffer();
      replacements.push([url, `data:font/woff2;base64,${arrayBufferToBase64(buffer)}`]);
    }

    let embedded = css;
    for (const [url, dataUri] of replacements) {
      embedded = embedded.replace(`url(${url})`, `url(${dataUri})`);
    }
    return embedded;
  })();

  // Si falla, se saca del cache para reintentar en el próximo export
  embeddedFontCssCache.set(family, promise);
  promise.catch(() => embeddedFontCssCache.delete(family));
  return promise;
}

/**
 * Genera el archivo SVG final a partir del JSON del diseño.
 *
 * - viewBox centrado en (0, 0): mismo espacio de coordenadas que el canvas.
 * - Las tipografías usadas por el texto se EMBEBEN en un <style> dentro del
 *   <defs> como data-URIs base64: el SVG exportado se ve idéntico al canvas
 *   aunque la máquina destino no tenga la fuente instalada. Si la descarga
 *   de fuentes falla, el SVG igual se genera (con fallback a sans-serif).
 * - El grupo #grabado está RECORTADO al anillo (clipPath), igual que el canvas:
 *   nada queda grabado fuera de la virola.
 * - El grupo #guia-referencia son los círculos del borde físico: sirven para
 *   validar visualmente y se borran antes de enviar a la grabadora.
 */
export async function generateSvgFromDesign(design: VirolaDesign): Promise<string> {
  const half = DESIGN_SIZE / 2;

  // Familias únicas usadas por los textos del diseño
  const families = [
    ...new Set(
      design.elements
        .filter((el): el is Extract<DesignElement, { type: 'text' }> => el.type === 'text')
        .map((el) => el.fontFamily)
    ),
  ];

  let fontsCss = '';
  if (families.length > 0) {
    try {
      const css = (await Promise.all(families.map(embeddedFontCssFor))).join('\n');
      fontsCss = `    <style>\n${css}\n    </style>\n`;
    } catch {
      // Fuentes no embebidas: el SVG sigue siendo válido, cae a sans-serif
    }
  }

  const body = design.elements.map(elementToSvg).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="${-half} ${-half} ${DESIGN_SIZE} ${DESIGN_SIZE}"
     width="${DESIGN_SIZE}" height="${DESIGN_SIZE}">
  <defs>
${fontsCss}    <path id="virola-text-circle" d="${ringTextPathData(TEXT_RADIUS)}" fill="none"/>
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
