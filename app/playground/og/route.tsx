import { ImageResponse } from 'next/og';
import { parseChallenge } from '@/components/playground/share';

export const runtime = 'nodejs';

const GREEN = '#254642';
const DARK = '#1c3632';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';

/**
 * Imagen de vista previa (WhatsApp, Instagram, X…) del playground.
 * Con `?p=94` muestra el puntaje a superar; sin parámetro, la portada del juego.
 */
export async function GET(request: Request) {
  const score = parseChallenge(new URL(request.url).searchParams.get('p'));

  const [bold, black] = await Promise.all(
    [700, 900].map((w) =>
      fetch(
        `https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-${w}-normal.woff`
      ).then((res) => res.arrayBuffer())
    )
  );

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${GREEN} 0%, ${DARK} 100%)`,
        color: CREAM,
        fontFamily: '"Inter"',
        padding: '0 80px',
      }}
    >
      <div
        style={{
          width: 300,
          height: 300,
          borderRadius: 150,
          background: GOLD,
          color: DARK,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: `14px solid ${CREAM}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: score === 100 ? 112 : score != null ? 140 : 104,
            fontWeight: 900,
            lineHeight: 1,
          }}
        >
          {score != null ? String(score) : '3D'}
        </div>
        <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>
          {score != null ? '/ 100' : 'juego gratis'}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56 }}>
        <div
          style={{
            display: 'flex',
            fontSize: 30,
            fontWeight: 700,
            color: GOLD,
            letterSpacing: 4,
            marginBottom: 12,
          }}
        >
          PUROS MATES · PLAYGROUND
        </div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 900, lineHeight: 1.05 }}>
          {score != null ? 'Cebé un mate en 3D' : 'Cebá tu mate en 3D'}
        </div>
        <div
          style={{ display: 'flex', fontSize: 62, fontWeight: 900, lineHeight: 1.05, color: GOLD }}
        >
          {score != null ? '¿Me ganás?' : '¿Cuánto sacás?'}
        </div>
        <div
          style={{ display: 'flex', fontSize: 32, fontWeight: 700, marginTop: 28, opacity: 0.85 }}
        >
          Elegí tu equipo y cebá paso a paso
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: bold, style: 'normal', weight: 700 },
        { name: 'Inter', data: black, style: 'normal', weight: 900 },
      ],
      headers: { 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
    }
  );
}
