import Link from "next/link";
import { Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F5F2E9] flex flex-col items-center justify-center p-4 text-center">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-[#254642]/10">
                <div className="mb-6 flex justify-center relative">
                    <span className="text-8xl opacity-20 absolute scale-150 blur-sm">🌿</span>
                    <span className="text-6xl relative z-10">🤔</span>
                </div>

                <h1 className="text-8xl font-black text-[#254642]/10 mb-2 -mt-16 select-none">
                    404
                </h1>

                <h2 className="text-3xl font-bold text-[#254642] mb-4 relative z-10">
                    ¡Nos quedamos sin yerba!
                </h2>

                <p className="text-gray-600 mb-8 text-lg relative z-10">
                    La página que buscás no existe, fue movida o quizás nunca estuvo aquí.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-[#254642] text-white rounded-lg hover:bg-[#1a3330] transition-colors font-medium"
                    >
                        <Home size={20} />
                        Ir al inicio
                    </Link>

                    <Link
                        href="/?category=mate"
                        className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#254642] text-[#254642] rounded-lg hover:bg-[#254642]/5 transition-colors font-medium"
                    >
                        <ShoppingBag size={20} />
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        </div>
    );
}
