import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/blog/JsonLd';
import { formatDateEs, getAllPosts } from '@/lib/blog';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Blog del Mate: guías, cuidados y regalos | Puros Mates',
  description:
    'Respuestas claras sobre cómo curar, cuidar y elegir un mate, y cómo regalar mates personalizados. Guías prácticas de Puros Mates.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Blog del Mate | Puros Mates',
    description: 'Guías prácticas para curar, cuidar, elegir y regalar mates.',
    url: '/blog',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Blog de Puros Mates',
          url: `${baseUrl}/blog`,
          inLanguage: 'es-AR',
          publisher: { '@type': 'Organization', name: 'Puros Mates', url: baseUrl },
          blogPost: posts.slice(0, 20).map((p) => ({
            '@type': 'BlogPosting',
            headline: p.title,
            url: `${baseUrl}/blog/${p.slug}`,
            datePublished: p.datePublished,
          })),
        }}
      />
      <h1 className="mb-3 text-4xl font-bold text-[#254642]">Blog del mate</h1>
      <p className="mb-10 text-lg text-gray-700">
        Respuestas directas a las dudas más comunes sobre mates: cómo curarlos, cuidarlos, elegirlos
        y regalarlos.
      </p>
      <ul className="space-y-8">
        {posts.map((post) => (
          <li key={post.slug} className="border-b border-gray-200 pb-8">
            <p className="text-sm text-[#3D5F54]/80">
              {post.category} · {formatDateEs(post.datePublished)}
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-[#254642]">
              <Link href={`/blog/${post.slug}`} className="hover:underline">
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-gray-700">{post.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
