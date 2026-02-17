'use client';

import { Provider } from 'react-redux';
import { SessionProvider } from 'next-auth/react';
import { store } from '@/redux/store';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import CartInitializer from '@/components/CartInitializer';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <Provider store={store}>
                <CartInitializer />
                <AuthProvider>
                    <Toaster
                        position="top-right"
                        containerStyle={{
                            top: 80,
                        }}
                    />
                    {children}
                </AuthProvider>
            </Provider>
        </SessionProvider>
    );
}
