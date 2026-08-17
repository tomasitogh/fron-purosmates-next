import type { Metadata } from 'next';
import CustomizerLoader from '@/components/customize/CustomizerLoader';
import { GOOGLE_FONTS_HREF } from '@/components/customize/constants';

export const metadata: Metadata = {
  title: 'Personalizá tu mate | Puros Mates',
  description:
    'Diseñá el grabado láser de la virola de tu mate: texto curvo, formas geométricas e imágenes propias.',
  // Ruta de validación de la feature: no indexar todavía
  robots: { index: false, follow: false },
};

export default function CustomizePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      {/* React 19 eleva estos <link> al <head>: cargan las 10 tipografías del editor */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" precedence="default" href={GOOGLE_FONTS_HREF} />

      <header className="mb-4 text-center">
        <h1 className="text-2xl font-bold text-stone-800">Diseñá tu grabado</h1>
        <p className="mt-1 text-sm text-stone-500">
          Todo lo que pongas dentro del anillo se graba con láser en la virola.
        </p>
      </header>

      <CustomizerLoader />
    </main>
  );
}
