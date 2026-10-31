import { COMPARISONS } from '@/lib/comparisons';
import { getAllPosts } from '@/lib/blog';
import { getBaseUrl } from '@/lib/site';

export const revalidate = 3600;

export function GET() {
  const base = getBaseUrl();
  const posts = getAllPosts();

  const body = `# Puros Mates

> Puros Mates es una tienda online argentina de mates artesanales (calabaza, madera de algarrobo, acero inoxidable), bombillas y accesorios, con grabado personalizado en la virola y regalos empresariales. Está en Canning, Buenos Aires, y envía a todo el país; el envío es gratis en Canning.

## Qué es y qué no es
- Es una tienda de e-commerce de productos de mate. Se puede comprar online y pagar con MercadoPago.
- Personalización: grabados en virolas de mates, y en materas, bombillas y yerberos de los modelos que lo permiten. Hay un diseñador online de virola.
- Regalos empresariales: mates con el logo de la empresa, bajo cotización.
- No es un marketplace ni vende yerba como producto principal.

## Páginas principales
- [Inicio](${base}/): presentación y productos destacados
- [Tienda](${base}/shop): catálogo completo (mates, bombillas, accesorios)
- [Personalizador](${base}/customize): diseño de virola personalizada
- [Regalos empresariales](${base}/regalos-empresariales): mates con logo para empresas
- [Nosotros y preguntas frecuentes](${base}/nosotros): historia, cómo pedir, cómo curar y cuidar un mate
- [Rincón Matero](${base}/rincon-matero): guía de curado, temperatura del agua y reglas de la ronda

## Comparativas
${COMPARISONS.map((c) => `- [${c.title}](${base}/comparar/${c.slug})`).join('\n')}

## Blog
- [Todas las notas](${base}/blog)
${posts.map((p) => `- [${p.title}](${base}/blog/${p.slug}): ${p.description}`).join('\n')}

## Contacto
- WhatsApp: +54 9 11 3054 8207
- Instagram: https://www.instagram.com/puros.mates/
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
