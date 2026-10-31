import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/blog/JsonLd';
import { COMPARISONS, COMPARISONS_VERIFIED_NOTE, getComparison } from '@/lib/comparisons';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return { title: 'Comparación no encontrada' };
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/comparar/${c.slug}` },
    openGraph: {
      title: c.title,
      description: c.description,
      url: `/comparar/${c.slug}`,
      type: 'article',
      locale: 'es_AR',
      siteName: 'Puros Mates',
    },
  };
}

export default async function ComparisonPage({ params }: PageProps) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              name: c.title,
              description: c.description,
              url: `${baseUrl}/comparar/${c.slug}`,
              inLanguage: 'es-AR',
            },
            {
              '@type': 'FAQPage',
              mainEntity: c.faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: { '@type': 'Answer', text: f.answer },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: c.title,
                  item: `${baseUrl}/comparar/${c.slug}`,
                },
              ],
            },
          ],
        }}
      />
      <h1 className="mb-4 text-3xl font-bold text-[#254642] md:text-4xl">{c.title}</h1>
      <p className="mb-8 text-lg leading-relaxed font-medium text-gray-900">{c.summary}</p>

      <div className="mb-8 overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#E8DCC4] text-[#254642]">
              <th className="p-3">Aspecto</th>
              <th className="p-3">Puros Mates</th>
              <th className="p-3">{c.competitor}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map((r) => (
              <tr key={r.aspect} className="border-b border-gray-200 align-top">
                <th scope="row" className="p-3 font-semibold">
                  {r.aspect}
                </th>
                <td className="p-3">{r.us}</td>
                <td className="p-3">{r.them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-2 text-2xl font-semibold text-[#254642]">En qué gana {c.competitor}</h2>
      <ul className="mb-6 list-disc space-y-1 pl-6">
        {c.whereTheyWin.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <h2 className="mb-2 text-2xl font-semibold text-[#254642]">En qué gana Puros Mates</h2>
      <ul className="mb-8 list-disc space-y-1 pl-6">
        {c.whereWeWin.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2 className="mb-3 text-2xl font-semibold text-[#254642]">Preguntas frecuentes</h2>
      <dl className="mb-8 space-y-4">
        {c.faqs.map((f) => (
          <div key={f.question}>
            <dt className="font-semibold">{f.question}</dt>
            <dd className="mt-1">{f.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mb-6 text-sm text-gray-600">{COMPARISONS_VERIFIED_NOTE}</p>
      <Link href="/shop" className="font-semibold text-[#254642] underline">
        Ver los mates de Puros Mates
      </Link>
    </article>
  );
}
