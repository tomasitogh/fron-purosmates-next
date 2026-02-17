"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCcw, Home } from "lucide-react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#F5F2E9] flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-[#254642]/10">
                <div className="mb-6 flex justify-center">
                    <span className="text-6xl">🧉</span>
                </div>

                <h2 className="text-3xl font-bold text-[#254642] mb-4">
                    Uy, se nos volcó el mate
                </h2>

                <p className="text-gray-600 mb-8 text-lg">
                    Estamos arreglando la tienda, volvé a intentar en unos instantes.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={() => reset()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#254642] text-white rounded-lg hover:bg-[#1a3330] transition-colors font-medium"
                    >
                        <RefreshCcw size={20} />
                        Intentar de nuevo
                    </button>

                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#254642] text-[#254642] rounded-lg hover:bg-[#254642]/5 transition-colors font-medium"
                    >
                        <Home size={20} />
                        Ir al inicio
                    </Link>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="mt-8 p-4 bg-red-50 text-red-800 rounded text-left text-sm overflow-auto max-h-40">
                        <p className="font-bold mb-1">Error para desarrolladores:</p>
                        <pre className="whitespace-pre-wrap">{error.message}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}
