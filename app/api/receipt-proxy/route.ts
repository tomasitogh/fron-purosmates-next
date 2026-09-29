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
 * - la vista previa y la descarga salen del mismo origen → `download` y
 *   fetch-blob funcionan, y Safari muestra su visor con Compartir/Guardar.
 * - validamos que solo se proxee res.cloudinary.com https (anti open-proxy).
 *
 * Uso:
 * - Ver:      /api/receipt-proxy?url=<encoded>
 * - Descargar: /api/receipt-proxy?url=<encoded>&filename=x.jpg&download=1
 */
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

  try {
    const upstream = await fetch(target.toString(), {
      // No mandamos cookies del admin a Cloudinary; solo necesitamos el archivo.
      credentials: 'omit',
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Cloudinary respondió ${upstream.status}` },
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
