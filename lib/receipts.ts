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
 * - Separar "ver" (URL original directa, preview inline en un modal dentro de
 *   la app — el navegador manda su Referer real) de "descargar" (fetch directo
 *   primero, luego proxy same-origin `/api/receipt-proxy` + descarga blob,
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
 * URL para la vista previa.
 * - Imágenes: la URL directa.
 * - PDFs subidos como `image`: el .pdf ORIGINAL está bloqueado para delivery
 *   en cuentas Free ("deny or ACL failure" — Cloudinary bloquea PDFs/ZIPs por
 *   seguridad salvo que se habilite "Allow delivery of PDF and ZIP files" en
 *   Console → Settings → Security). Pero la página 1 convertida a JPG sí se
 *   entrega sin restricciones, así que el preview usa esa variante.
 *   La descarga del PDF completo sí requiere habilitar ese ajuste.
 */
export function getReceiptPreviewUrl(url?: string, width = 1200): string {
  if (!url) return '';
  if (isReceiptPdf(url) && url.includes('/image/upload/')) {
    const withTransform = url.replace('/image/upload/', `/image/upload/pg_1,f_jpg,w_${width}/`);
    return withTransform.replace(/\.pdf([?#]|$)/i, '.jpg$1');
  }
  return getReceiptViewUrl(url);
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
 * 1. Fetch directo a Cloudinary desde el navegador (manda Referer real, pasa
 *    un eventual hotlink-protection; funciona si Cloudinary habilita CORS).
 * 2. Fetch al proxy same-origin (evita CORS, manda Referer del sitio).
 * 3. Fallback: abre la URL directa en pestaña nueva — nunca la del proxy con
 *    JSON de error, para no mostrar `{"error":...}` al usuario.
 *
 * Caso especial PDFs en cuentas Free: Cloudinary bloquea la entrega del .pdf
 * original (401 + `x-cld-error: deny or ACL failure`) salvo que se habilite
 * "Allow delivery of PDF and ZIP files" en Console → Settings → Security.
 * En ese caso se lanza CLOUDINARY_BLOCKED_PDF para que la UI muestre el
 * ajuste exacto en lugar de un error genérico. Re-subir el archivo NO lo
 * soluciona; es un ajuste de la cuenta.
 */
export async function downloadReceipt(
  receiptUrl: string,
  filename: string
): Promise<'downloaded' | 'opened'> {
  const viewUrl = getReceiptViewUrl(receiptUrl);
  const proxyDownload = getReceiptProxyUrl(receiptUrl, { filename, download: true });
  let blockedByCloudinary = false;

  const saveBlob = (blob: Blob) => {
    const objectUrl = URL.createObjectURL(blob);
    // iOS Safari / standalone ignora el click programático si el anchor no está
    // en el DOM, por eso lo agregamos temporalmente.
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Margen para que iOS alcance a tomar el archivo antes de revocar.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  };

  const isDenyError = (res: Response): boolean => {
    if (res.status !== 401 && res.status !== 403) return false;
    try {
      // Cloudinary expone X-Cld-Error por CORS en los 401 ("deny or ACL failure").
      const header = res.headers.get('x-cld-error') || '';
      return /deny|acl/i.test(header) || isReceiptPdf(receiptUrl);
    } catch {
      return isReceiptPdf(receiptUrl);
    }
  };

  // 1. Intento directo (mejor Referer posible: el del navegador).
  try {
    const res = await fetch(viewUrl, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) {
      if (isDenyError(res)) blockedByCloudinary = true;
      throw new Error(`Directo respondió ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) throw new Error('Respuesta JSON inesperada');
    saveBlob(await res.blob());
    return 'downloaded';
  } catch {
    // seguimos al proxy
  }

  // 2. Intento vía proxy same-origin (sin problemas de CORS).
  try {
    const res = await fetch(proxyDownload);
    if (!res.ok) {
      // El proxy devuelve JSON con detalle; lo leemos para el mensaje final.
      let upstreamStatus: number | null = null;
      try {
        const body = await res.clone().json();
        upstreamStatus = body?.upstreamStatus ?? null;
      } catch {
        /* cuerpo no-JSON, ignoramos */
      }
      if (upstreamStatus === 401 || (res.status === 502 && isReceiptPdf(receiptUrl))) {
        blockedByCloudinary = true;
      }
      throw new Error(`Proxy respondió ${res.status}`);
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) throw new Error('Respuesta JSON inesperada');
    saveBlob(await res.blob());
    return 'downloaded';
  } catch (err) {
    // 3. Fallback: abrir la URL DIRECTA (no el proxy con JSON de error).
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
    if (blockedByCloudinary) {
      throw new Error(
        'CLOUDINARY_BLOCKED_PDF: Cloudinary bloquea la entrega de este PDF. ' +
          'Habilitá "Allow delivery of PDF and ZIP files" en Console → Settings → Security.'
      );
    }
    throw err;
  }
}
