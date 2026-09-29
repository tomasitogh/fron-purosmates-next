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
  tokens?: string[];
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
  try {
    const records = await prisma.adminFCMToken.findMany({
      where: { isActive: true },
      select: { token: true },
    });
    return records.map((r) => r.token);
  } catch {
    return [];
  }
}

/**
 * Envía una notificación push a todos los administradores registrados
 */
export async function sendMulticastNotification({
  tokens,
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
    try {
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
    } catch {
      // Ignorar si Prisma o BD no están disponibles
    }
  }

  const targetTokens =
    tokens && tokens.length > 0 ? tokens : await getActiveAdminTokens().catch(() => []);

  if (targetTokens.length === 0) {
    console.warn('[Notifications] No hay tokens de administradores activos registrados.');
    return { success: false, recipientCount: 0, message: 'No hay dispositivos registrados' };
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: targetTokens,
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
          tokensToDeactivate.push(targetTokens[idx]);
        }
      }
    });

    if (tokensToDeactivate.length > 0) {
      console.log(`[Notifications] Tokens inválidos detectados: ${tokensToDeactivate.length}.`);
      // Intentar desactivar en BD si está disponible
      try {
        await prisma.adminFCMToken.updateMany({
          where: { token: { in: tokensToDeactivate } },
          data: { isActive: false },
        });
      } catch {
        // Ignorar si Prisma no está conectado a MySQL
      }
    }

    return {
      success: response.successCount > 0,
      recipientCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens: tokensToDeactivate,
    };
  } catch (error: any) {
    console.error('[Notifications] Error al enviar notificación multicast:', error);
    throw error;
  }
}
