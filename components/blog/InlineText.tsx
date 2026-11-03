import Link from 'next/link';
import { Fragment } from 'react';

// Convierte "texto [enlace](/ruta) texto" en nodos de React.
// Solo admite enlaces internos (que empiecen con "/").
const LINK_RE = /\[([^\]]+)\]\((\/[^)]*)\)/g;

export default function InlineText({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(LINK_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(
      <Link key={match.index} href={match[2]} className="text-[#254642] underline">
        {match[1]}
      </Link>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return (
    <>
      {nodes.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </>
  );
}
