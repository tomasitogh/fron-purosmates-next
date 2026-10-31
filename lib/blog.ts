import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

export interface BlogSection {
  heading: string;
  paragraphs: string[];
  list?: string[];
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

export function formatDateEs(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
