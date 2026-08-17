import type { NextConfig } from 'next';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
const apiUrl = new URL(API_BASE_URL);

const nextConfig: NextConfig = {
  // Disable Turbopack - use classic SWC compiler instead
  // Turbopack has cache corruption issues on ARM64
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // La Server Action de vectorización recibe la imagen en el body del FormData.
  // El default de Next es 1 MB y las fotos/fondos de escudos lo superan → 413.
  // 10mb = nuestro límite de validación (8 MB) + margen de overhead multipart.
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // potrace (jimp), sharp (binario nativo) y heic-convert (WASM) corren solo en
  // Node: no empaquetarlos, requerirlos nativos en el servidor
  serverExternalPackages: ['potrace', 'sharp', 'heic-convert'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(':', '') as 'http' | 'https',
        hostname: apiUrl.hostname,
        port: apiUrl.port || '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com',
      },
    ],
  },
  productionBrowserSourceMaps: true,
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${API_BASE_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
