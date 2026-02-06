'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout as logoutAction, setAuthFromStorage, loginUser } from '@/redux/authSlice';
import { RootState, AppDispatch } from '@/redux/store';
import Cookies from 'js-cookie';

interface AuthContextType {
    user: { email: string; role: string; name?: string } | null;
    token: string | null;
    login: (email: string, password: string) => Promise<{ success: boolean; user?: any; error?: string }>;
    logout: () => void;
    isAdmin: () => boolean;
    loading: boolean;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, token, loading: authLoading } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        // Cargar usuario y token desde cookies al iniciar
        const storedToken = Cookies.get('token');
        const storedUser = Cookies.get('user');

        if (storedToken && storedUser) {
            // Verificar si el token está expirado
            try {
                const tokenPayload = JSON.parse(atob(storedToken.split('.')[1]));
                const expirationTime = tokenPayload.exp * 1000; // Convertir a milisegundos

                if (Date.now() >= expirationTime) {
                    // Token expirado, limpiar cookies
                    console.log('Token expirado, limpiando cookies...');
                    Cookies.remove('token');
                    Cookies.remove('user');
                    dispatch(logoutAction());
                } else {
                    // Token válido, restaurar desde cookies
                    dispatch(setAuthFromStorage({
                        user: JSON.parse(storedUser),
                        token: storedToken
                    }));
                }
            } catch (error) {
                console.error('Error al validar token:', error);
                // Si hay error al parsear, limpiar cookies
                Cookies.remove('token');
                Cookies.remove('user');
                dispatch(logoutAction());
            }
        }
    }, [dispatch]);

    const login = async (email: string, password: string) => {
        try {
            const result = await dispatch(loginUser({ email, password })).unwrap();
            return { success: true, user: result };
        } catch (error: any) {
            console.error('Error en login:', error);
            return { success: false, error: error.message || 'Credenciales inválidas' };
        }
    };

    const logout = () => {
        dispatch(logoutAction());
    };

    const isAdmin = () => {
        return user?.role === 'ADMIN';
    };

    const value: AuthContextType = {
        user,
        token,
        login,
        logout,
        isAdmin,
        loading: authLoading,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
