import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/blog/JsonLd';
import { formatDateEs, getAllPosts, getPostBySlug } from '@/lib/blog';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Nota no encontrada' };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.datePublished,
      modifiedTime: post.dateModified ?? post.datePublished,
      locale: 'es_AR',
      siteName: 'Puros Mates',
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const url = `${baseUrl}/blog/${post.slug}`;
  const related = (post.related ?? [])
    .map((s) => getPostBySlug(s))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'BlogPosting',
              headline: post.title,
              description: post.description,
              url,
              mainEntityOfPage: url,
              datePublished: post.datePublished,
              dateModified: post.dateModified ?? post.datePublished,
              inLanguage: 'es-AR',
              articleSection: post.category,
              author: { '@type': 'Organization', name: 'Puros Mates', url: baseUrl },
              publisher: {
                '@type': 'Organization',
                name: 'Puros Mates',
                url: baseUrl,
                logo: { '@type': 'ImageObject', url: `${baseUrl}/logo-purosmates.png` },
              },
              image: `${baseUrl}/opengraph-image`,
            },
            {
              '@type': 'FAQPage',
              mainEntity: post.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Inicio', item: baseUrl },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${baseUrl}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: url },
              ],
            },
          ],
        }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[#3D5F54]/80">
        <Link href="/" className="hover:underline">
          Inicio
        </Link>{' '}
        /{' '}
        <Link href="/blog" className="hover:underline">
          Blog
        </Link>
      </nav>

      <h1 className="mb-3 text-3xl leading-tight font-bold text-[#254642] md:text-4xl">
        {post.title}
      </h1>
      <p className="mb-6 text-sm text-[#3D5F54]/80">
        {post.category} · Actualizado el {formatDateEs(post.dateModified ?? post.datePublished)}
      </p>

      <p className="mb-8 text-lg leading-relaxed font-medium text-gray-900">{post.answer}</p>

      {post.sections.map((section) => (
        <section key={section.heading} className="mb-8">
          <h2 className="mb-3 text-2xl font-semibold text-[#254642]">{section.heading}</h2>
          {section.paragraphs.map((p, i) => (
            <p key={i} className="mb-3 leading-relaxed text-gray-800">
              {p}
            </p>
          ))}
          {section.list && (
            <ol className="mb-3 list-decimal space-y-1 pl-6 text-gray-800">
              {section.list.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          )}
        </section>
      ))}

      {post.cta && (
        <p className="mb-10 rounded-lg bg-[#E8DCC4] p-5 text-[#254642]">
          <Link href={post.cta.href} className="font-semibold underline">
            {post.cta.label}
          </Link>{' '}
          — <strong>Puros Mates</strong> es una tienda de mates artesanales argentinos con envíos a
          todo el país.
        </p>
      )}

      <section aria-labelledby="faq" className="mb-10">
        <h2 id="faq" className="mb-4 text-2xl font-semibold text-[#254642]">
          Preguntas frecuentes
        </h2>
        <dl className="space-y-4">
          {post.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className="font-semibold text-gray-900">{faq.question}</dt>
              <dd className="mt-1 text-gray-800">{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related">
          <h2 id="related" className="mb-3 text-xl font-semibold text-[#254642]">
            Seguí leyendo
          </h2>
          <ul className="list-disc space-y-1 pl-6">
            {related.map((r) => (
              <li key={r.slug}>
                <Link href={`/blog/${r.slug}`} className="text-[#254642] underline">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
