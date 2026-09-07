import {
  DESIGN_SIZE,
  ENGRAVE_COLOR,
  INNER_RADIUS,
  LEATHER_HEIGHT,
  LEATHER_WIDTH,
  LINE_STROKE_WIDTH,
  OUTER_RADIUS,
  SEAM_WIDTH,
  TEXT_RADIUS,
  ringClipPathData,
  ringTextPathData,
  shapePoints,
} from '@/components/customize/constants';
import type { CustomizeDesign, DesignElement, ShapeElement } from '@/components/customize/types';

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

function elementToSvg(el: DesignElement, isLeather = false): string {
  switch (el.type) {
    case 'text':
      if (isLeather) {
        const x = el.x ?? 0;
        const y = el.y ?? 0;
        const rot = el.rotation ?? 0;
        const transform = rot !== 0 ? ` transform="rotate(${rot} ${x} ${y})"` : '';
        return (
          `<text x="${x}" y="${y}" font-family="'${escapeXml(el.fontFamily)}', sans-serif" ` +
          `font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}" text-anchor="middle" dominant-baseline="central"${transform}>` +
          `${escapeXml(el.text)}</text>`
        );
      }
      return (
        `<g transform="rotate(${(el.angle ?? 0) + el.rotation})">` +
        `<text font-family="'${escapeXml(el.fontFamily)}', sans-serif" font-size="${el.fontSize}" fill="${ENGRAVE_COLOR}" dominant-baseline="central">` +
        `<textPath href="#virola-text-circle" xlink:href="#virola-text-circle">${escapeXml(el.text)}</textPath>` +
        `</text></g>`
      );
    case 'shape':
      return shapeToSvg(el);
    case 'path':
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
export async function generateSvgFromLeatherDesign(design: CustomizeDesign): Promise<string> {
  const halfW = LEATHER_WIDTH / 2;
  const halfH = LEATHER_HEIGHT / 2;
  const halfSeam = SEAM_WIDTH / 2;

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
      // fallback
    }
  }

  // Costura central con cruces
  const numStitches = 7;
  const step = LEATHER_HEIGHT / numStitches;
  const stitchesSvg: string[] = [];
  for (let i = 0; i < numStitches; i++) {
    const yTop = -halfH + i * step;
    const yBottom = yTop + step;
    stitchesSvg.push(
      `<line x1="${-halfSeam + 4}" y1="${yTop + 3}" x2="${halfSeam - 4}" y2="${yBottom - 3}" stroke="#888888" stroke-width="1.5"/>`
    );
    stitchesSvg.push(
      `<line x1="${halfSeam - 4}" y1="${yTop + 3}" x2="${-halfSeam + 4}" y2="${yBottom - 3}" stroke="#888888" stroke-width="1.5"/>`
    );
  }

  const body = design.elements.map((el) => elementToSvg(el, true)).join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     viewBox="${-halfW} ${-halfH} ${LEATHER_WIDTH} ${LEATHER_HEIGHT}"
     width="${LEATHER_WIDTH}" height="${LEATHER_HEIGHT}">
  <defs>
${fontsCss}    <clipPath id="leather-clip">
      <rect x="${-halfW}" y="${-halfH}" width="${LEATHER_WIDTH}" height="${LEATHER_HEIGHT}" rx="8"/>
    </clipPath>
  </defs>
  <!-- Guía de referencia: borde de la faja y costura central de cruces. -->
  <g id="guia-referencia" fill="none" stroke="#bbbbbb" stroke-width="1">
    <rect x="${-halfW}" y="${-halfH}" width="${LEATHER_WIDTH}" height="${LEATHER_HEIGHT}" rx="8"/>
    <line x1="${-halfSeam}" y1="${-halfH}" x2="${-halfSeam}" y2="${halfH}" stroke-dasharray="4 2"/>
    <line x1="${halfSeam}" y1="${-halfH}" x2="${halfSeam}" y2="${halfH}" stroke-dasharray="4 2"/>
    ${stitchesSvg.join('\n    ')}
  </g>
  <g id="grabado" clip-path="url(#leather-clip)">
    ${body}
  </g>
</svg>
`;
}

export async function generateSvgFromDesign(design: CustomizeDesign): Promise<string> {
  if (design.surface === 'leather') {
    return generateSvgFromLeatherDesign(design);
  }

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

  const body = design.elements.map((el) => elementToSvg(el, false)).join('\n    ');

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
