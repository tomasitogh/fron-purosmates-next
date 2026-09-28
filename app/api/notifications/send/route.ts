import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sendMulticastNotification } from '@/lib/notifications/service';

export async function POST(req: Request) {
  try {
    const internalSecret = req.headers.get('x-internal-secret');
    const configuredSecret = process.env.INTERNAL_NOTIFICATION_SECRET;

    let isAuthorized = false;

    // 1. Autorización vía Secret interno (para llamadas desde Spring Boot en Railway)
    if (configuredSecret && internalSecret && internalSecret === configuredSecret) {
      isAuthorized = true;
    } else {
      // 2. Autorización vía sesión de Clerk (para el botón de prueba en AdminSettings)
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        const role = (user?.publicMetadata?.role as string) || '';
        if (role.toUpperCase() === 'ADMIN') {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'No autorizado para enviar notificaciones' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, body: content, url, type, orderId } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'Título y contenido son requeridos' }, { status: 400 });
    }

    const result = await sendMulticastNotification({
      title,
      body: content,
      url: url || '/admin',
      type: type || 'general',
      orderId: orderId ? BigInt(orderId) : null,
    });

    return NextResponse.json({
      ...result,
    });
  } catch (error: any) {
    console.error('Error al despachar notificación:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al enviar notificación' },
      { status: 500 }
    );
  }
}
