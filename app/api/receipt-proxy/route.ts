import { NextResponse } from 'next/server';

/**
 * Proxy same-origin para comprobantes de Cloudinary.
 *
 * Por qué existe: en iPhone instalado como app (standalone desde Safari),
 * un `<a href="https://res.cloudinary.com/..." target="_blank" download>`
 * - ignora `download` por ser cross-origin,
 * - no abre Safari (se queda dentro de la PWA sin barra ni botón atrás),
 * - muestra el archivo crudo en una página negra sin opción de guardar.
 *
 * Con este proxy:
 * - la descarga sale del mismo origen → `download` y fetch-blob funcionan,
 *   y Safari muestra su visor con Compartir/Guardar.
 * - validamos que solo se proxee res.cloudinary.com https (anti open-proxy).
 *
 * Nota sobre 401 de Cloudinary: suele pasar con archivos viejos cuando
 * - el `resource_type` de la URL no coincide con el real (image vs raw), o
 * - la cuenta tiene protección por referrer y el fetch server-side va sin él.
 * Por eso este proxy manda Referer/User-Agent de navegador y, ante 401/404,
 * reintenta intercambiando `/image/upload/` ↔ `/raw/upload/`.
 *
 * Uso:
 * - Ver:      /api/receipt-proxy?url=<encoded>
 * - Descargar: /api/receipt-proxy?url=<encoded>&filename=x.jpg&download=1
 */

function swapResourceType(url: string): string | null {
  if (url.includes('/image/upload/')) {
    return url.replace('/image/upload/', '/raw/upload/');
  }
  if (url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', '/image/upload/');
  }
  return null;
}

async function fetchUpstream(url: string, siteReferer: string): Promise<Response> {
  return fetch(url, {
    // No mandamos cookies del admin a Cloudinary; solo necesitamos el archivo.
    credentials: 'omit',
    headers: {
      // Cloudinary con hotlink-protection rechaza fetches sin Referer (401).
      // Mandamos el origen de la app para pasar esa validación.
      Referer: siteReferer,
      Accept: '*/*',
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'comprobante';
  const forceDownload = searchParams.get('download') === '1';

  if (!rawUrl) {
    return NextResponse.json({ error: 'Falta el parámetro url' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
  }

  if (target.protocol !== 'https:' || !target.hostname.endsWith('res.cloudinary.com')) {
    return NextResponse.json(
      { error: 'Solo se permiten comprobantes de Cloudinary' },
      { status: 400 }
    );
  }

  // Referer del mismo origen para pasar un eventual hotlink-protection.
  const appOrigin = new URL(req.url).origin;
  const incomingReferer = req.headers.get('referer') || req.headers.get('origin');
  const siteReferer = incomingReferer || appOrigin;

  try {
    let upstream = await fetchUpstream(target.toString(), siteReferer);

    // Reintento image ↔ raw: los PDFs viejos pueden estar guardados con un
    // resource_type distinto al que figura en la URL (401/404 engañoso).
    if (!upstream.ok && (upstream.status === 401 || upstream.status === 404)) {
      const alt = swapResourceType(target.toString());
      if (alt) {
        const retry = await fetchUpstream(alt, siteReferer);
        if (retry.ok && retry.body) {
          upstream = retry;
        }
      }
    }

    if (!upstream.ok || !upstream.body) {
      console.error(
        `receipt-proxy: Cloudinary respondió ${upstream.status} para ${target.toString()}`
      );
      return NextResponse.json(
        {
          error: `Cloudinary respondió ${upstream.status}. Si es un comprobante viejo, probá subirlo de nuevo; si es nuevo, revisá que la URL sea pública (resource_type auto, type upload).`,
          upstreamStatus: upstream.status,
        },
        { status: 502 }
      );
    }

    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]+/g, '-');
    const disposition = forceDownload
      ? `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      : `inline; filename="${safeFilename}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`;

    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': disposition,
        'Cache-Control': 'private, max-age=60',
      },
    });
  } catch (err) {
    console.error('receipt-proxy error:', err);
    return NextResponse.json({ error: 'No se pudo obtener el comprobante' }, { status: 502 });
  }
}
