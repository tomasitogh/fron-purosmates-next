'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { toggleFavorite } from '@/redux/favoritesSlice';
import { useAuth } from '@/context/AuthContext';
import AuthModal from './AuthModal';

interface FavoriteButtonProps {
  productId: number;
  className?: string;
  size?: number;
}

export default function FavoriteButton({
  productId,
  className = '',
  size = 20,
}: FavoriteButtonProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, getToken } = useAuth();
  const isFavorite = useSelector((state: RootState) => state.favorites.ids.includes(productId));
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    dispatch(toggleFavorite({ productId, getToken }));
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`absolute top-4 right-2 z-10 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:scale-110 hover:bg-white ${className}`}
        aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      >
        <Heart
          size={size}
          className={`transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-500'}`}
        />
      </button>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
