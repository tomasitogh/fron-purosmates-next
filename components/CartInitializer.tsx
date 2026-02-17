"use client";

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCart } from '@/redux/cartSlice';

export default function CartInitializer() {
    const dispatch = useAppDispatch();
    const cartItems = useAppSelector((state) => state.cart.items);
    const isLoaded = useRef(false);

    // Initial Load
    useEffect(() => {
        if (!isLoaded.current) {
            try {
                const storedCart = localStorage.getItem("cart_items");
                if (storedCart) {
                    const parsedCart = JSON.parse(storedCart);
                    if (Array.isArray(parsedCart) && parsedCart.length > 0) {
                        dispatch(setCart(parsedCart));
                    }
                }
            } catch (error) {
                console.error("Failed to load cart from localStorage", error);
            } finally {
                isLoaded.current = true;
            }
        }
    }, [dispatch]);

    // Persistence on Change
    useEffect(() => {
        if (isLoaded.current) {
            localStorage.setItem("cart_items", JSON.stringify(cartItems));
        }
    }, [cartItems]);

    return null;
}
