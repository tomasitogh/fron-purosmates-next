/**
 * Genera un slug URL-friendly desde un texto.
 * Ejemplo: "Mate Imperial Camionero" -> "mate-imperial-camionero"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')                   // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '')    // Remover diacríticos
    .toLowerCase()                       // Convertir a minúsculas
    .trim()                              // Remover espacios al inicio/final
    .replace(/\s+/g, '-')                // Reemplazar espacios con guiones
    .replace(/[^\w\-]+/g, '')            // Remover caracteres especiales
    .replace(/\-\-+/g, '-')              // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, '')                  // Remover guiones al inicio
    .replace(/-+$/, '');                 // Remover guiones al final
}
