import axios from 'axios';

/**
 * Tipo compatible con el `getToken` de Clerk (`useAuth().getToken`).
 * Se define estructuralmente para no depender de @clerk/types.
 */
export type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;

/**
 * Obtiene un token FRESCO de Clerk.
 *
 * IMPORTANTE: Los JWT de sesión de Clerk vencen a los ~60 segundos.
 * NUNCA guardar el resultado de getToken() en estado/Redux para reusarlo:
 * hay que llamar a getToken() antes de CADA request. Clerk cachea
 * internamente y renueva el token automáticamente cuando está por vencer,
 * así que llamarlo seguido es barato.
 */
export async function requireFreshToken(getToken: TokenGetter): Promise<string> {
    const token = await getToken();
    if (!token) {
        throw new Error('Sesión no válida. Volvé a iniciar sesión.');
    }
    return token;
}

/**
 * Ejecuta una request autenticada usando siempre un token fresco.
 *
 * Si el backend responde 401 (ej. el token venció en tránsito o hay
 * skew de reloj entre Clerk y el backend), fuerza la renovación del
 * token (skipCache) y reintenta UNA sola vez antes de fallar.
 */
export async function withAuthRetry<T>(
    getToken: TokenGetter,
    request: (token: string) => Promise<T>
): Promise<T> {
    const token = await requireFreshToken(getToken);
    try {
        return await request(token);
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
            const freshToken = await requireFreshToken(getToken); // Clerk renueva si venció
            return request(freshToken);
        }
        throw error;
    }
}
