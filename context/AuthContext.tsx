'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSession, signOut as nextAuthSignOut } from 'next-auth/react';
import { logout as logoutAction, setAuthFromStorage } from '@/redux/authSlice';
import { AppDispatch, RootState } from '@/redux/store';

interface AuthContextType {
    user: any;
    token: string | null;
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
    // @ts-ignore
    const { user, token, loading, error } = useSelector((state: RootState) => state.auth);


    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === 'authenticated' && session?.user) {
            // @ts-ignore
            // The accessToken from session is actually the Google ID Token as per our auth.ts config
            const token = session.user.accessToken as string;

            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    const expirationTime = payload.exp * 1000;

                    if (Date.now() >= expirationTime) {
                        console.warn("AuthContext - Token expired. Logging out.");
                        dispatch(logoutAction());
                        nextAuthSignOut({ redirect: false });
                        return;
                    }

                    dispatch(setAuthFromStorage({
                        user: {
                            email: session.user.email || '',
                            role: (session.user as any).role || 'USER'
                        },
                        token: token
                    }));
                } catch (e) {
                    console.error("AuthContext - Error decoding token:", e);
                }
            }
        }
    }, [session, status, dispatch]);






    const logout = () => {
        dispatch(logoutAction());
        nextAuthSignOut({ redirect: false });
    };

    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    const value = {
        user,
        token,
        logout,
        isAdmin,
        loading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
