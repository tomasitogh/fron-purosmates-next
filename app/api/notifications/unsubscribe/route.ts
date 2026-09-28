import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { unsubscribeAdminToken } from '@/lib/notifications/service';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token FCM requerido' }, { status: 400 });
    }

    await unsubscribeAdminToken({ token, userId });

    return NextResponse.json({
      success: true,
      message: 'Dispositivo desuscrito de notificaciones',
    });
  } catch (error: any) {
    console.error('Error al desuscribir token FCM:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
