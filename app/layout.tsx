import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ClerkProvider } from '@clerk/nextjs';

import { Providers } from '@/components/Providers';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FacebookPixel from '@/components/FacebookPixel';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#254642',
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'Puros Mates - Comprar Mates Artesanales Online | Tienda de Mates',
    template: '%s | Puros Mates',
  },
  description:
    'Tienda online de mates artesanales argentinos. Mates de calabaza, madera, alpaca y más. Bombillas y accesorios premium. Envíos a todo el país. Envío gratis en Canning, Buenos Aires.',
  keywords: [
    'comprar mates',
    'mates artesanales',
    'mates argentinos',
    'tienda de mates',
    'mates online',
    'bombillas',
    'accesorios para mate',
    'mate de calabaza',
    'mate de madera',
    'mate de alpaca',
    'envío mates argentina',
    'mates Buenos Aires',
    'artesanías argentinas',
  ],
  authors: [{ name: 'Puros Mates' }],
  creator: 'Puros Mates',
  publisher: 'Puros Mates',
  robots: {
    follow: true,
    index: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'qa4kC0iMItlBvFoeZ_ra0ZwV01jBM6nCCKpV02eXqWE',
  },
  openGraph: {
    title: 'Puros Mates - Comprar Mates Artesanales Online',
    description: 'Los mejores mates artesanales de Argentina. Envíos a todo el país.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
    url: baseUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Puros Mates - Mates Artesanales Argentinos',
    description: 'Comprá mates artesanales online. Envíos a todo el país.',
  },
  icons: {
    apple: '/logo-purosmates.png',
  },
  manifest: '/manifest.json',
  other: {
    'application-name': 'Puros Mates',
    'msapplication-TileColor': '#254642',
  },
};

function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Puros Mates',
    url: baseUrl,
    logo: `${baseUrl}/logo-purosmates.png`,
    description:
      'Tienda online de mates artesanales argentinos. Mates de calabaza, madera, alpaca y más.',
    sameAs: ['https://www.instagram.com/puros.mates/', 'https://wa.me/5491130548207'],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+5491130548207',
      contactType: 'customer service',
      availableLanguage: 'Spanish',
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'AR',
      addressLocality: 'Canning',
      addressRegion: 'Buenos Aires',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

function WebSiteJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Puros Mates',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="es" suppressHydrationWarning>
        <head>
          <OrganizationJsonLd />
          <WebSiteJsonLd />
        </head>
        <body suppressHydrationWarning>
          <Providers>
            <Suspense fallback={<div className="h-16 bg-[#254642]" />}>
              <Navbar />
            </Suspense>

            <main className="flex min-h-screen flex-col">{children}</main>
            <Footer />
            <FloatingWhatsApp />
            <Suspense fallback={null}>
              <FacebookPixel />
            </Suspense>
          </Providers>
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
          <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer />
        </body>
      </html>
    </ClerkProvider>
  );
}
