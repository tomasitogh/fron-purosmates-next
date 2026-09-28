import prisma from '@/lib/prisma';
import { getAdminMessaging } from '@/lib/firebase/admin';

export interface SubscribeTokenParams {
  token: string;
  userId: string;
  userEmail?: string | null;
  deviceInfo?: string | null;
}

export interface UnsubscribeTokenParams {
  token: string;
  userId?: string;
}

export interface SendNotificationParams {
  title: string;
  body: string;
  url?: string;
  type?: string;
  orderId?: bigint | number | null;
  recipientId?: string | null;
}

/**
 * Registra o actualiza un token FCM para un administrador
 */
export async function subscribeAdminToken({
  token,
  userId,
  userEmail,
  deviceInfo,
}: SubscribeTokenParams) {
  if (!token || !userId) {
    throw new Error('Token y userId son requeridos');
  }

  // Desactivar tokens previos para el mismo dispositivo de este usuario si el token cambió
  if (deviceInfo) {
    await prisma.adminFCMToken.updateMany({
      where: {
        userId,
        deviceInfo,
        token: { not: token },
      },
      data: { isActive: false },
    });
  }

  return prisma.adminFCMToken.upsert({
    where: { token },
    create: {
      token,
      userId,
      userEmail,
      deviceInfo,
      isActive: true,
    },
    update: {
      userId,
      userEmail,
      deviceInfo,
      isActive: true,
      updatedAt: new Date(),
    },
  });
}

/**
 * Desactiva un token FCM
 */
export async function unsubscribeAdminToken({ token, userId }: UnsubscribeTokenParams) {
  if (!token) return null;

  return prisma.adminFCMToken.updateMany({
    where: {
      token,
      ...(userId ? { userId } : {}),
    },
    data: { isActive: false },
  });
}

/**
 * Obtiene todos los tokens FCM activos de administradores
 */
export async function getActiveAdminTokens(): Promise<string[]> {
  const records = await prisma.adminFCMToken.findMany({
    where: { isActive: true },
    select: { token: true },
  });
  return records.map((r) => r.token);
}

/**
 * Envía una notificación push a todos los administradores registrados
 */
export async function sendMulticastNotification({
  title,
  body,
  url = '/admin',
  type = 'general',
  orderId = null,
  recipientId = null,
}: SendNotificationParams) {
  const messaging = getAdminMessaging();
  if (!messaging) {
    console.warn('[Notifications] Firebase Admin no está configurado. Omitiendo envío.');
    return {
      success: false,
      recipientCount: 0,
      error: 'Firebase Admin no configurado en el servidor',
    };
  }

  // Control de deduplicación para órdenes
  if (orderId && type === 'new_order') {
    const existingLog = await prisma.notificationLog.findFirst({
      where: {
        type: 'new_order',
        orderId: BigInt(orderId),
        status: 'SENT',
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // últimos 5 minutos
        },
      },
    });

    if (existingLog) {
      console.log(`[Notifications] Notificación de orden #${orderId} omitida por deduplicación.`);
      return { success: true, deduplicated: true, recipientCount: 0 };
    }
  }

  const tokens = await getActiveAdminTokens();
  if (tokens.length === 0) {
    console.warn('[Notifications] No hay tokens de administradores activos registrados.');
    await prisma.notificationLog.create({
      data: {
        type,
        title,
        body,
        orderId: orderId ? BigInt(orderId) : null,
        recipientId,
        status: 'FAILED',
        errorMsg: 'No active admin tokens in database',
      },
    });
    return { success: false, recipientCount: 0, message: 'No hay dispositivos registrados' };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title,
        body,
      },
      data: {
        title,
        body,
        url,
        type,
        ...(orderId ? { orderId: orderId.toString() } : {}),
      },
      webpush: {
        fcmOptions: {
          link: url,
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        },
      },
    });

    console.log(
      `[Notifications] Envío multicast: ${response.successCount} exitosos, ${response.failureCount} fallidos.`
    );

    // Limpiar tokens inválidos o expirados
    const tokensToDeactivate: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success && resp.error) {
        const errCode = resp.error.code;
        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token'
        ) {
          tokensToDeactivate.push(tokens[idx]);
        }
      }
    });

    if (tokensToDeactivate.length > 0) {
      console.log(`[Notifications] Desactivando ${tokensToDeactivate.length} tokens inválidos.`);
      await prisma.adminFCMToken.updateMany({
        where: { token: { in: tokensToDeactivate } },
        data: { isActive: false },
      });
    }

    await prisma.notificationLog.create({
      data: {
        type,
        title,
        body,
        orderId: orderId ? BigInt(orderId) : null,
        recipientId,
        status: response.successCount > 0 ? 'SENT' : 'FAILED',
        errorMsg:
          response.failureCount > 0
            ? `${response.failureCount} de ${tokens.length} envíos fallaron`
            : null,
      },
    });

    return {
      success: response.successCount > 0,
      recipientCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error: any) {
    console.error('[Notifications] Error al enviar notificación multicast:', error);
    await prisma.notificationLog.create({
      data: {
        type,
        title,
        body,
        orderId: orderId ? BigInt(orderId) : null,
        recipientId,
        status: 'FAILED',
        errorMsg: error.message || 'Unknown error',
      },
    });
    throw error;
  }
}
