'use client';

interface CloudinaryLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export const cloudinaryLoader = ({ src, width }: CloudinaryLoaderProps) => {
  // Si no es una URL de Cloudinary, retornamos el src original
  if (!src.includes('res.cloudinary.com')) {
    return src;
  }

  // Dividimos la URL para insertar las transformaciones
  // Ejemplo: https://res.cloudinary.com/demo/image/upload/v12345678/sample.jpg
  // Queremos: https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_500/v12345678/sample.jpg

  const params = ['f_auto', 'q_auto', `w_${width}`].join(',');

  // Insertamos los parámetros después de /upload/
  return src.replace('/upload/', `/upload/${params}/`);
};
