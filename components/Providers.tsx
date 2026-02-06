'use client';

import { Provider } from 'react-redux';
import { store } from '@/redux/store';
import { Toaster } from 'react-hot-toast';

export function ReduxProvider({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <Toaster position="top-right" />
            {children}
        </Provider>
    );
}
