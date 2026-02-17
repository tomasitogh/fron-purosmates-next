import { ImageResponse } from 'next/og';
import { join } from 'path';
import { readFile } from 'fs/promises';

// Route segment config
export const runtime = 'nodejs';

// Image metadata
export const alt = 'Puros Mates - Tienda Online';
export const size = {
    width: 1200,
    height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
    // Font loading
    const interSemiBold = await fetch(
        new URL('https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-600-normal.woff', import.meta.url)
    ).then((res) => res.arrayBuffer());

    // Logo loading
    const logoData = await readFile(join(process.cwd(), 'public/logo-purosmates.png'));
    const logoSrc = Uint8Array.from(logoData).buffer;

    return new ImageResponse(
        (
            // ImageResponse JSX element
            <div
                style={{
                    fontSize: 40,
                    background: '#254642',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F5F5DC',
                    fontFamily: '"Inter"',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    padding: '20px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                    {/* @ts-ignore */}
                    <img src={logoSrc} width="150" height="150" />
                </div>
                <div style={{ fontWeight: 600, fontSize: 60, marginBottom: 10 }}>PUROS MATES</div>
                <div style={{ fontSize: 32, opacity: 0.9 }}>Tienda Online de Mates y Accesorios</div>
            </div>
        ),
        // ImageResponse options
        {
            ...size,
            fonts: [
                {
                    name: 'Inter',
                    data: interSemiBold,
                    style: 'normal',
                    weight: 600,
                },
            ],
        }
    );
}

