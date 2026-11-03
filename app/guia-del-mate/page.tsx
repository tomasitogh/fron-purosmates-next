import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/blog/JsonLd';
import { getAllPosts, groupPostsByCategory } from '@/lib/blog';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Guía del mate: respuestas a todas las preguntas sobre mates | Puros Mates',
  description:
    'Cómo curar un mate (con azúcar, brasas, yerba usada o nueva), de qué está hecho, qué es un mate camionero, virolas de alpaca o acero y más. Todas las respuestas en un solo lugar.',
  alternates: { canonical: '/guia-del-mate' },
  openGraph: {
    title: 'Guía del mate | Puros Mates',
    description:
      'Todas las preguntas sobre mates, respondidas: curado, materiales, tipos, virolas, cebado y regalos.',
    url: '/guia-del-mate',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
  },
};

export default function GuiaDelMatePage() {
  const posts = getAllPosts();
  const groups = groupPostsByCategory(posts);
  const url = `${baseUrl}/guia-del-mate`;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'CollectionPage',
              name: 'Guía del mate',
              url,
              inLanguage: 'es-AR',
              isPartOf: { '@type': 'WebSite', name: 'Puros Mates', url: baseUrl },
              publisher: { '@type': 'Organization', name: 'Puros Mates', url: baseUrl },
            },
            {
              '@type': 'FAQPage',
              mainEntity: posts.map((p) => ({
                '@type': 'Question',
                name: p.title,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: p.answer,
                  url: `${baseUrl}/blog/${p.slug}`,
                },
              })),
            },
            {
              '@type': 'ItemList',
              itemListElement: posts.map((p, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${baseUrl}/blog/${p.slug}`,
                name: p.title,
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'Guía del mate', item: url },
              ],
            },
          ],
        }}
      />

      <h1 className="mb-3 text-4xl font-bold text-[#254642]">Guía del mate</h1>
      <p className="mb-4 text-lg font-medium text-gray-900">
        Puros Mates es una tienda argentina de mates artesanales, bombillas y accesorios con grabado
        personalizado. Esta guía reúne las respuestas a las preguntas más comunes sobre mates: cómo
        curarlos, de qué están hechos, qué tipos hay, cómo elegir virola y bombilla, cómo cebar y
        qué regalar.
      </p>

      <nav aria-label="Índice" className="mb-10 rounded-lg bg-[#E8DCC4] p-5">
        <p className="mb-2 font-semibold text-[#254642]">Ir directo a:</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2">
          {groups.map(({ category }) => (
            <li key={category}>
              <a href={`#${encodeURIComponent(category)}`} className="text-[#254642] underline">
                {category}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {groups.map(({ category, posts: list }) => (
        <section key={category} id={encodeURIComponent(category)} className="mb-12 scroll-mt-24">
          <h2 className="mb-5 text-2xl font-bold text-[#254642]">{category}</h2>
          <div className="space-y-6">
            {list.map((post) => (
              <article key={post.slug} className="border-b border-gray-200 pb-6">
                <h3 className="text-xl font-semibold text-[#254642]">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-2 leading-relaxed text-gray-800">{post.answer}</p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-2 inline-block text-sm font-semibold text-[#254642] underline"
                >
                  Leer la respuesta completa
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <p className="rounded-lg bg-[#E8DCC4] p-5 text-[#254642]">
        ¿Listo para elegir tu mate?{' '}
        <Link href="/shop?category=mate" className="font-semibold underline">
          Mirá los mates de Puros Mates
        </Link>{' '}
        o{' '}
        <Link href="/customize" className="font-semibold underline">
          diseñá el grabado de tu virola
        </Link>
        .
      </p>
    </div>
  );
}
