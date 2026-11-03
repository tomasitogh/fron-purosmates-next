import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Valida el contenido SEO del blog sin importar lib/blog.ts (usa "server-only").
const DIR = path.join(process.cwd(), 'content', 'blog');
const posts = fs
  .readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')) }));
const slugs = new Set(posts.map((p) => p.data.slug));

describe('contenido del blog', () => {
  it('el nombre del archivo coincide con el slug y los slugs son únicos', () => {
    assert.equal(slugs.size, posts.length);
    for (const { file, data } of posts) assert.equal(file, `${data.slug}.json`);
  });

  it('cada nota cumple las reglas de SEO y de respuesta directa', () => {
    for (const { data: p } of posts) {
      assert.ok(p.description.length <= 165, `${p.slug}: description muy larga`);
      assert.ok(p.answer.length >= 80, `${p.slug}: answer muy corta`);
      assert.ok(p.faqs.length >= 3, `${p.slug}: necesita 3+ preguntas frecuentes`);
      assert.match(p.datePublished, /^\d{4}-\d{2}-\d{2}$/);
      for (const s of p.sections) {
        for (const para of s.paragraphs) assert.ok(para.trim(), `${p.slug}: párrafo vacío`);
      }
    }
  });

  it('related y enlaces internos /blog/... apuntan a notas existentes', () => {
    for (const { data: p } of posts) {
      for (const r of p.related ?? []) assert.ok(slugs.has(r), `${p.slug} -> related ${r}`);
      const text = JSON.stringify(p);
      for (const m of text.matchAll(/\]\(\/blog\/([^)]+)\)/g)) {
        assert.ok(slugs.has(m[1]), `${p.slug} -> /blog/${m[1]}`);
      }
    }
  });
});
