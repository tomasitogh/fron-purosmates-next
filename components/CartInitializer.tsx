"use client";

import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { setCart, type CartItem } from '@/redux/cartSlice';

/**
 * Items persistidos en localStorage antes de G1 no tienen `variantId` (la
 * unidad de stock vivía en `stock` plano del product). El cart slice ahora
 * requiere `variantId` para poder matchear/deduplicar, así que descartamos
 * items legacy one-shot y dejamos que el usuario los vuelva a agregar
 * (abriendo el modal para elegir la variant).
 */
function isLegacyItem(item: CartItem): boolean {
    return typeof item.variantId !== 'number' || item.variantStock == null;
}

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
                        const hasLegacy = parsedCart.some(isLegacyItem);
                        if (hasLegacy) {
                            console.warn(
                                "[CartInitializer] Cart legacy detectado (sin variantId) — descartando. " +
                                "El usuario deberá volver a agregar los productos."
                            );
                            // No dispatch setCart → queda el initialState ([])
                        } else {
                            dispatch(setCart(parsedCart as CartItem[]));
                        }
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
