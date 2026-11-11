import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/blog/JsonLd';
import MateGame from '@/components/playground/MateGame';
import { parseChallenge } from '@/components/playground/share';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();
const url = `${baseUrl}/playground`;

type Props = { searchParams: Promise<{ p?: string | string[] }> };

/**
 * Con `?p=94` (link compartido desde el final del juego) la vista previa muestra
 * el puntaje a superar. La URL canónica sigue siendo /playground.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const score = parseChallenge((await searchParams).p);
  const ogTitle =
    score != null
      ? `Saqué ${score}/100 cebando un mate en 3D. ¿Me ganás?`
      : 'Cebá tu mate en 3D | Puros Mates';
  const ogDescription =
    score != null
      ? 'Elegí tu equipo, cebá un mate paso a paso y tratá de superar mi puntaje. Es gratis y se juega desde el celu.'
      : 'Sentate a la mesa, elegí tu equipo y cebá un mate paso a paso. ¿Cuánto sacás vos?';
  const image = {
    url: score != null ? `/playground/og?p=${score}` : '/playground/og',
    width: 1200,
    height: 630,
    alt: 'Cebá tu mate: juego 3D de Puros Mates',
  };
  return {
    title: 'Cebá tu mate: juego 3D para aprender a cebar mate',
    description:
      'Juego 3D gratis: elegí termo, mate, bombilla y yerba, y cebá un mate paso a paso como se hace de verdad. Poné a prueba tu pulso matero y compartí tu puntaje.',
    alternates: { canonical: '/playground' },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: '/playground',
      type: 'website',
      locale: 'es_AR',
      siteName: 'Puros Mates',
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [image.url],
    },
  };
}

/**
 * Playground 3D. Esta ruta es la ÚNICA que descarga Three.js: el motor se carga
 * con import() dinámico dentro de <MateGame/>, así que el resto del e-commerce
 * no suma ni un byte de JavaScript por este juego.
 */
export default async function PlaygroundPage({ searchParams }: Props) {
  const challenge = parseChallenge((await searchParams).p);
  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'VideoGame',
              name: 'Cebá tu mate',
              url,
              inLanguage: 'es-AR',
              description:
                'Juego 3D en el navegador para aprender a cebar un mate: elegir termo, mate, bombilla y yerba, y prepararlo paso a paso.',
              genre: ['Educativo', 'Simulación'],
              gamePlatform: 'Web browser',
              applicationCategory: 'Game',
              operatingSystem: 'Any',
              isAccessibleForFree: true,
              offers: { '@type': 'Offer', price: 0, priceCurrency: 'ARS' },
              publisher: { '@type': 'Organization', name: 'Puros Mates', url: baseUrl },
            },
            {
              '@type': 'HowTo',
              name: 'Cómo cebar un mate',
              url,
              step: [
                'Agarrá el mate.',
                'Llenalo con yerba entre dos tercios y tres cuartos.',
                'Inclinalo para formar una pendiente de yerba.',
                'Tirá un chorrito de agua tibia en el hueco.',
                'Esperá 5 segundos a que la yerba absorba el agua.',
                'Tirá agua de nuevo para terminar de humedecer.',
                'Colocá la bombilla en el hueco, sin moverla después.',
                'Cebá con agua a 70–80 °C sobre la pared, sin mojar la montañita.',
                '¡Tomalo hasta el ruidito!',
              ].map((text, i) => ({ '@type': 'HowToStep', position: i + 1, text })),
            },
          ],
        }}
      />
      <MateGame challenge={challenge} />
      <noscript>
        <p style={{ padding: 24 }}>
          Este juego necesita JavaScript. Mientras tanto, leé{' '}
          <Link href="/blog/como-cebar-un-mate-paso-a-paso">cómo cebar un mate paso a paso</Link>.
        </p>
      </noscript>
    </>
  );
}
