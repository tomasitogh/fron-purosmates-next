import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";

import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
  ? process.env.NEXT_PUBLIC_BASE_URL
  : (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Puros Mates - Tienda Online",
    template: "%s | Puros Mates"
  },
  description: "Compra los mejores mates artesanales de Argentina. Mates de calabaza, madera, alpaca y más.",
  keywords: ["mates", "mates argentinos", "mates artesanales", "bombillas", "accesorios para mate"],
  robots: {
    follow: true,
    index: true,
  },
  openGraph: {
    title: "Puros Mates - Tienda Online",
    description: "Compra los mejores mates artesanales de Argentina",
    type: "website",
    locale: "es_AR",
    siteName: "Puros Mates",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <Suspense fallback={<div className="h-16 bg-[#2d5d52]" />}>
            <Navbar />
          </Suspense>

          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
