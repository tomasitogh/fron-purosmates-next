/**
 * Helpers para comprobantes de pago alojados en Cloudinary.
 *
 * Contexto del bug:
 * - El comprador sube el comprobante (imagen o PDF) al backend, que lo guarda
 *   en Cloudinary con `resource_type: auto` y devuelve `receiptUrl`.
 * - Como admin se usaba `<a href={url con fl_attachment} target="_blank" download>`.
 *   Eso falla en iPhone instalado como app desde Safari (modo standalone):
 *   el atributo `download` se ignora en URLs cross-origin, `target="_blank"`
 *   no abre Safari sino que navega dentro de la PWA sin chrome, y Cloudinary
 *   devuelve el archivo crudo → página en negro sin forma de volver/descargar.
 *
 * Solución:
 * - Separar "ver" (URL original, preview inline en un modal dentro de la app)
 *   de "descargar" (vía proxy same-origin `/api/receipt-proxy` + descarga blob,
 *   que sí funciona en iOS standalone).
 */

/** Solo aceptamos proxear/descargar desde nuestro CDN conocido. */
export function isCloudinaryReceiptUrl(url?: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('res.cloudinary.com');
  } catch {
    return false;
  }
}

export function isReceiptPdf(url?: string): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return true;
  // Los PDFs subidos con resource_type:auto pueden quedar como /raw/upload/...
  if (url.includes('/raw/upload/')) return true;
  return false;
}

export function getReceiptExtension(url?: string, fallback = 'jpg'): string {
  if (!url) return fallback;
  const clean = url.split('?')[0].split('#')[0];
  const lastSegment = clean.split('/').pop() || '';
  const dot = lastSegment.lastIndexOf('.');
  if (dot === -1) {
    return isReceiptPdf(url) ? 'pdf' : fallback;
  }
  const ext = lastSegment
    .slice(dot + 1)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  return ext || fallback;
}

export function getReceiptFilename(orderId: number | string, url?: string): string {
  const ext = getReceiptExtension(url);
  return `comprobante-pedido-${orderId}.${ext}`;
}

/**
 * URL de visualización: la original tal cual la guardó el backend.
 * Si alguna vez se guardó con `fl_attachment` (forzaba descarga y rompía el
 * preview), lo removemos para poder mostrarla inline.
 */
export function getReceiptViewUrl(url?: string): string {
  if (!url) return '';
  // Quita /fl_attachment o /fl_attachment:xxx de la URL para ver inline
  return url.replace(/\/upload\/fl_attachment(?::[^/]+)?\//, '/upload/');
}

/**
 * URL de descarga directa contra Cloudinary (plan B si el proxy falla).
 * Inserta `fl_attachment:<filename>` preservando transformaciones existentes.
 */
export function getReceiptCloudinaryDownloadUrl(url?: string, filename = 'comprobante'): string {
  if (!url) return '';
  const safeName = filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
  if (url.includes('/upload/fl_attachment')) return url;
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/fl_attachment:${safeName}/`);
  }
  return url;
}

/**
 * URL del proxy same-origin. Descargar desde el mismo origen hace que:
 * - el atributo `download` sí sea respetado,
 * - no haya problemas de CORS en el fetch blob,
 * - en iOS standalone no se atrape al usuario en res.cloudinary.com.
 */
export function getReceiptProxyUrl(
  url?: string,
  opts?: { filename?: string; download?: boolean }
): string {
  if (!url) return '';
  const params = new URLSearchParams({ url });
  if (opts?.filename) params.set('filename', opts.filename);
  if (opts?.download) params.set('download', '1');
  return `/api/receipt-proxy?${params.toString()}`;
}

/**
 * Descarga un comprobante funcionando en desktop y en iOS standalone:
 * 1. Intenta fetch (al proxy same-origin) → blob → objectURL → click.
 * 2. Si el fetch falla (CORS/red), abre el proxy en pestaña nueva como fallback.
 * Devuelve 'downloaded' | 'opened' para logging/telemetría opcional.
 */
export async function downloadReceipt(
  receiptUrl: string,
  filename: string
): Promise<'downloaded' | 'opened'> {
  const proxyDownload = getReceiptProxyUrl(receiptUrl, { filename, download: true });

  try {
    const res = await fetch(proxyDownload);
    if (!res.ok) throw new Error(`Proxy respondió ${res.status}`);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    // iOS Safari <13 / algunos standalone ignoran el click programático si no
    // está el anchor en el DOM, por eso lo agregamos temporalmente.
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    // Liberamos después de un margen para que iOS alcance a tomar el archivo.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
    return 'downloaded';
  } catch {
    // Fallback: abrir el proxy (inline→attachment según backend) en pestaña nueva.
    // Al ser same-origin, Safari/iOS muestra su visor con botón Compartir/Guardar.
    window.open(proxyDownload, '_blank', 'noopener,noreferrer');
    return 'opened';
  }
}
