import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { subscribeAdminToken } from '@/lib/notifications/service';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = await currentUser();
    const role = (user?.publicMetadata?.role as string) || '';
    if (role.toUpperCase() !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso restringido a administradores' }, { status: 403 });
    }

    const body = await req.json();
    const { token, deviceInfo } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token FCM requerido' }, { status: 400 });
    }

    const email = user?.emailAddresses?.[0]?.emailAddress || null;

    const record = await subscribeAdminToken({
      token,
      userId,
      userEmail: email,
      deviceInfo: deviceInfo || 'Unknown device',
    });

    return NextResponse.json({
      success: true,
      message: 'Dispositivo registrado para notificaciones',
      recordId: record.id.toString(),
    });
  } catch (error: any) {
    console.error('Error al suscribir token FCM:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
