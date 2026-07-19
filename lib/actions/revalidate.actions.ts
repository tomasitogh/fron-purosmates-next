'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

/**
 * Invalida la caché ISR del storefront para que los cambios del admin
 * se vean al instante. Solo admins (role en los claims del JWT de Clerk).
 */
export async function revalidateStorefront(paths: string[]) {
    const { sessionClaims } = await auth();

    const claims = sessionClaims as Record<string, any> | null;
    const role =
        claims?.role ??
        claims?.metadata?.role ??
        claims?.publicMetadata?.role;

    if (role !== 'ADMIN') {
        throw new Error('No autorizado');
    }

    const allowed = ['/', '/shop'];
    for (const path of paths) {
        if (allowed.includes(path)) {
            revalidatePath(path);
        }
    }

    return { revalidated: true };
}
