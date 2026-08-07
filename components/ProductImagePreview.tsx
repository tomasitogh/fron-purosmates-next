'use client';

import Image from 'next/image';
import { cloudinaryLoader } from '@/lib/cloudinary';
import { useState } from 'react';

interface ProductImagePreviewProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  transform?: { scale: number; x: number; y: number };
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  fill?: boolean;
}

const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY3Ii8+PC9zdmc+';

export default function ProductImagePreview({
  src,
  alt,
  width,
  height,
  transform = { scale: 1, x: 0, y: 0 },
  className = '',
  imageClassName = '',
  priority = false,
  fill = false,
}: ProductImagePreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const isCloudinary = src.includes('res.cloudinary.com');
  // Se deriva en render: no hace falta estado ni efecto.
  const blurEnabled = !isCloudinary;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}
    >
      <div
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.scale})`,
          transformOrigin: 'center',
          backgroundColor: isLoading ? '#f5f5f7' : 'transparent',
        }}
      >
        <Image
          loader={isCloudinary ? cloudinaryLoader : undefined}
          src={src}
          alt={alt}
          width={fill ? undefined : width || 500}
          height={fill ? undefined : height || 500}
          fill={fill}
          sizes={fill ? '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px' : undefined}
          priority={priority}
          placeholder={blurEnabled ? 'blur' : 'empty'}
          blurDataURL={blurEnabled ? BLUR_DATA_URL : undefined}
          onLoad={() => setIsLoading(false)}
          className={`object-cover ${imageClassName} ${fill ? '' : 'h-full w-full'}`}
        />
      </div>
    </div>
  );
}
