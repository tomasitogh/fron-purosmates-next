'use client';

import Image from 'next/image';
import { cloudinaryLoader } from '@/lib/cloudinary';

interface ProductImagePreviewProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    transform?: { scale: number; x: number; y: number };
    className?: string; // Clase para el contenedor
    imageClassName?: string; // Clase para la imagen
    priority?: boolean;
    fill?: boolean;
}

export default function ProductImagePreview({
    src,
    alt,
    width,
    height,
    transform = { scale: 1, x: 0, y: 0 },
    className = "",
    imageClassName = "",
    priority = false,
    fill = false
}: ProductImagePreviewProps) {
    const isCloudinary = src.includes('res.cloudinary.com');

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ width: fill ? '100%' : width, height: fill ? '100%' : height }}>
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    position: 'relative', // Necessary for Next/Image fill
                    transform: `translate(${transform.x}%, ${transform.y}%) scale(${transform.scale})`,
                    transformOrigin: 'center',
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <Image
                    loader={isCloudinary ? cloudinaryLoader : undefined}
                    src={src}
                    alt={alt}
                    width={fill ? undefined : width || 500}
                    height={fill ? undefined : height || 500}
                    fill={fill}
                    sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
                    priority={priority}
                    className={`object-cover ${imageClassName} ${fill ? '' : 'w-full h-full'}`}
                />
            </div>
        </div>
    );
}
