"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

export default function FacebookPixel() {
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loaded) return;

        // Track pageview on route change
        import("react-facebook-pixel")
            .then((x) => x.default)
            .then((ReactPixel) => {
                ReactPixel.pageView();
            });
    }, [pathname, searchParams, loaded]);

    useEffect(() => {
        // Initialize pixel
        import("react-facebook-pixel")
            .then((x) => x.default)
            .then((ReactPixel) => {
                const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;
                if (pixelId) {
                    ReactPixel.init(pixelId);
                    ReactPixel.pageView();
                    setLoaded(true);
                }
            });
    }, []);

    return null;
}
