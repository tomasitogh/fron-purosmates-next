'use server';

import { trace, type PotraceOptions } from 'potrace';
import sharp from 'sharp';
import convert from 'heic-convert';

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB (fotos HEIC de iPhone ~2-4 MB)
/** Se reduce la imagen a este tamaño antes de trazar: path más liviano y trazado más rápido */
const MAX_TRACE_DIMENSION = 1024;

export type VectorizeResult =
  | {
      ok: true;
      /** Atributo `d` del path SVG trazado */
      d: string;
      /** Ancho del bitmap trazado (para calcular el escalado inicial) */
      width: number;
      /** Alto del bitmap trazado */
      height: number;
    }
  | { ok: false; error: string };

type ImageFormat = 'png' | 'jpeg' | 'webp' | 'avif' | 'heic';

/**
 * Detecta el formato real de la imagen por sus magic bytes.
 * No se confía en file.type: iOS a veces manda HEIC como application/octet-stream.
 */
function detectFormat(buffer: Buffer): ImageFormat | null {
  if (buffer.length < 12) return null;

  // PNG: 89 50 4E 47 (‰PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'png';
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  // WebP: "RIFF"...."WEBP"
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }
  // Contenedor ISO BMFF (HEIC/HEIF/AVIF): caja "ftyp" + brand
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buffer.toString('ascii', 8, 12);
    if (brand === 'avif') return 'avif'; // sharp decodifica AVIF nativamente
    if (['heic', 'heix', 'hevc', 'heim', 'heis', 'hevs', 'mif1', 'msf1'].includes(brand)) {
      return 'heic';
    }
  }
  return null;
}

/**
 * Convierte una imagen rasterizada (PNG/JPG/WebP/HEIC) en un path SVG puro.
 *
 * Pipeline:
 *  1. Detección de formato por magic bytes.
 *  2. Decodificación: HEIC/HEIF via heic-convert (WASM); el resto via sharp.
 *  3. Preprocesado con sharp: rotación EXIF (fotos de iPhone), downscale a
 *     1024px máx, escala de grises y normalización de contraste.
 *  4. Trazado con potrace (threshold 128) → SVG.
 *
 * Devuelve SOLO el atributo `d` del path + dimensiones: es lo único que el
 * canvas y el generador de SVG necesitan, y mantiene el payload mínimo.
 */
export async function vectorizeImage(formData: FormData): Promise<VectorizeResult> {
  const file = formData.get('image');

  if (!(file instanceof File)) {
    return { ok: false, error: 'No se recibió ninguna imagen.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: 'La imagen supera los 8 MB.' };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const format = detectFormat(input);

  if (!format) {
    return { ok: false, error: 'Formato no soportado. Subí un PNG, JPG, WebP o HEIC.' };
  }

  try {
    // 1. Decodificar a un formato que sharp entienda (HEIC no lo soporta nativamente)
    const decoded =
      format === 'heic' ? Buffer.from(await convert({ buffer: input, format: 'PNG' })) : input;

    // 2. Normalizar para el trazado
    const preprocessed = await sharp(decoded)
      .rotate() // respeta la orientación EXIF de las fotos
      .resize({
        width: MAX_TRACE_DIMENSION,
        height: MAX_TRACE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .greyscale()
      .normalize() // estira el histograma: mejora imágenes lavadas
      .png()
      .toBuffer();

    // 3. Trazar
    const options: PotraceOptions = {
      threshold: 128, // por debajo de 128 (gris medio) es negro (grabado)
      turdSize: 8, // ignora manchitas de hasta 8px (ruido)
      optTolerance: 0.2,
      blackOnWhite: true,
      color: '#1a1a1a',
      background: 'transparent',
    };

    const svg = await new Promise<string>((resolve, reject) => {
      trace(preprocessed, options, (err, result) => (err ? reject(err) : resolve(result)));
    });

    const d = /d="([^"]+)"/.exec(svg)?.[1];
    const width = Number(/width="([\d.]+)"/.exec(svg)?.[1]);
    const height = Number(/height="([\d.]+)"/.exec(svg)?.[1]);

    if (!d || !width || !height) {
      return { ok: false, error: 'No se pudo interpretar el resultado del trazado.' };
    }

    return { ok: true, d, width, height };
  } catch {
    return {
      ok: false,
      error: 'No se pudo procesar la imagen. Probá con una imagen simple de fondo claro.',
    };
  }
}
