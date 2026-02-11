import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  title: "Puros Mates - Tienda Online",
  description: "Compra los mejores mates artesanales de Argentina. Mates de calabaza, madera, alpaca y más.",
  keywords: ["mates", "mates argentinos", "mates artesanales", "bombillas", "accesorios para mate"],
  openGraph: {
    title: "Puros Mates - Tienda Online",
    description: "Compra los mejores mates artesanales de Argentina",
    type: "website",
    locale: "es_AR",
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
          <Navbar />
          <CartDrawer />
          <main className="min-h-screen flex flex-col">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
