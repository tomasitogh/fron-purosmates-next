interface CloudinaryLoaderProps {
  src: string;
  width: number;
  quality?: number;
}

export const cloudinaryLoader = ({ src, width }: CloudinaryLoaderProps) => {
  if (!src.includes('res.cloudinary.com')) {
    return src;
  }

  const params = ['f_auto', 'q_auto', `w_${width}`].join(',');

  return src.replace('/upload/', `/upload/${params}/`);
};

export function cloudinaryUrl(src: string, width: number) {
  if (!src.includes('res.cloudinary.com')) return src;
  const params = ['f_auto', 'q_auto', `w_${width}`].join(',');
  return src.replace('/upload/', `/upload/${params}/`);
}
