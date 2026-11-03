import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
  /** true = viñetas en lugar de lista numerada. */
  bullets?: boolean;
}

export interface BlogFaq {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  category: string;
  datePublished: string;
  dateModified?: string;
  /** Respuesta directa a la pregunta del título: es el primer párrafo visible de la nota. */
  answer: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
  related?: string[];
  cta?: { label: string; href: string };
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(BLOG_DIR, file), 'utf8')) as BlogPost)
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((post) => post.slug === slug);
}

/** Orden en que se muestran las categorías en el índice y en la guía. */
export const CATEGORY_ORDER = [
  'Cuidados',
  'Materiales y tipos',
  'Uso',
  'Guía de compra',
  'Guías de compra',
  'Guía',
  'Regalos',
  'Regalos empresariales',
];

export function groupPostsByCategory(posts: BlogPost[]): { category: string; posts: BlogPost[] }[] {
  const map = new Map<string, BlogPost[]>();
  for (const post of posts) {
    map.set(post.category, [...(map.get(post.category) ?? []), post]);
  }
  const idx = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i === -1 ? CATEGORY_ORDER.length : i;
  };
  return [...map.entries()]
    .sort((a, b) => idx(a[0]) - idx(b[0]))
    .map(([category, list]) => ({ category, posts: list }));
}

export function formatDateEs(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
