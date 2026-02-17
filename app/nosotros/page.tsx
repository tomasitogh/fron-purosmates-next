"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function AboutUsPage() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#2d5d52] mb-8 text-center">
                Sobre Nosotros
            </h1>

            {/* Content Paragraphs */}
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed mb-16">
                <p>
                    En Puros Mates, nuestra pasión por la tradición argentina nos impulsa a ofrecer productos de la más alta calidad.
                    Nacimos con el objetivo de llevar la experiencia del mate a cada rincón, seleccionando cuidadosamente cada pieza
                    para asegurar que nuestros clientes disfruten de un ritual auténtico y placentero. Creemos que el mate es más que una infusión;
                    es un símbolo de unión, charla y amistad.
                </p>
                <p>
                    Trabajamos directamente con artesanos locales para garantizar que cada mate, bombilla y accesorio refleje la
                    dedicación y el arte de nuestra cultura. Nos enorgullece ser el puente entre la tradición y la modernidad,
                    ofreciendo diseños clásicos y contemporáneos que se adaptan a todos los gustos. Tu satisfacción es nuestra prioridad,
                    y nos esforzamos cada día para brindarte un servicio excepcional y productos que perduren en el tiempo.
                </p>
            </div>

            {/* FAQ Section */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-[#2d5d52] mb-8 text-center">
                    Preguntas Frecuentes (FAQ)
                </h2>
                <div className="space-y-4">
                    <FAQItem
                        question="¿Realizan envíos a todo el país?"
                        answer="Sí, realizamos envíos a todo el territorio nacional a través de correo privado. Los tiempos de entrega varían según la ubicación, generalmente entre 3 y 7 días hábiles."
                    />
                    <FAQItem
                        question="¿Cuáles son los medios de pago aceptados?"
                        answer="Aceptamos todas las tarjetas de crédito y débito, transferencias bancarias y pagos en efectivo a través de redes de cobranza como Rapipago o Pago Fácil."
                    />
                    <FAQItem
                        question="¿Cómo curo mi mate de calabaza?"
                        answer="Para curar tu mate, llénalo con yerba húmeda usada y un poco de agua tibia. Déjalo reposar por 24 horas, luego retira la yerba y raspa suavemente el interior con una cuchara. Repite el proceso una vez más y ¡listo para usar!"
                    />
                    <FAQItem
                        question="¿Tienen garantía los productos?"
                        answer="Sí, todos nuestros productos cuentan con garantía por defectos de fabricación. Si tienes algún inconveniente, contáctanos dentro de los 30 días posteriores a tu compra y te ayudaremos a resolverlo."
                    />
                    <FAQItem
                        question="¿Venden al por mayor?"
                        answer="Sí, ofrecemos precios especiales para compras mayoristas. Si estás interesado en revender nuestros productos, por favor contáctanos a través de nuestro formulario de contacto para recibir más información."
                    />
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-[#2d5d52] text-left">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-4 bg-gray-50 text-gray-600 border-t border-gray-200">
                    {answer}
                </div>
            </div>
        </div>
    );
}
