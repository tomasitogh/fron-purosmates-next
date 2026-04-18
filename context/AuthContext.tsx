'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs';
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

    const { user: clerkUser, isLoaded, isSignedIn } = useUser();
    const { getToken, signOut: clerkSignOut } = useClerkAuth();

    useEffect(() => {
        const syncAuth = async () => {
            if (isLoaded && isSignedIn && clerkUser) {
                try {
                    const token = await getToken();
                    if (token) {
                        dispatch(setAuthFromStorage({
                            user: {
                                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                                role: (clerkUser.publicMetadata?.role as string) || 'USER'
                            },
                            token: token
                        }));
                    }
                } catch (e) {
                    console.error("AuthContext - Error syncing token:", e);
                }
            } else if (isLoaded && !isSignedIn) {
                // If Clerk says NOT signed in, clear redux state
                dispatch(logoutAction());
            }
        };
        syncAuth();
    }, [isLoaded, isSignedIn, clerkUser, getToken, dispatch]);

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
        token,
        logout,
        isAdmin,
        loading: !isLoaded || loading,
        isAuthenticated: !!user || !!isSignedIn,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
