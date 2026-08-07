'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
import { logout as logoutAction, setUser } from '@/redux/authSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { TokenGetter } from '@/lib/apiClient';

interface AuthContextType {
  user: { email: string; role: string } | null;
  /**
   * Función de Clerk para obtener un token FRESCO por request.
   * Los JWT de Clerk vencen a los ~60s: NUNCA cachear el resultado.
   */
  getToken: TokenGetter;
  logout: () => void;
  isAdmin: () => boolean;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.auth);

  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { getToken, signOut: clerkSignOut } = useClerkAuth();

  useEffect(() => {
    const syncAuth = () => {
      if (isLoaded && isSignedIn && clerkUser) {
        dispatch(
          setUser({
            user: {
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              role: (clerkUser.publicMetadata?.role as string) || 'USER',
            },
          })
        );
      } else if (isLoaded && !isSignedIn) {
        // If Clerk says NOT signed in, clear redux state
        dispatch(logoutAction());
      }
    };
    syncAuth();
  }, [isLoaded, isSignedIn, clerkUser, dispatch]);

  const logout = () => {
    dispatch(logoutAction());
    clerkSignOut();
  };

  const isAdmin = () => {
    // Provide a fallback or role check
    return user?.role === 'ADMIN' || clerkUser?.publicMetadata?.role === 'ADMIN';
  };

  const value = {
    user,
    getToken,
    logout,
    isAdmin,
    loading: !isLoaded || loading,
    isAuthenticated: !!user || !!isSignedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
