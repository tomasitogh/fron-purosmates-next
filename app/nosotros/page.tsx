"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function AboutUsPage() {
    const [visibleCount, setVisibleCount] = useState(3);
    const faqs = [
        {
            question: "¿Hacen personalizados en el mate?",
            answer: (
                <>
                    Sí, hacemos personalizados en las virolas de los mates. De hecho podemos hacer personalizados en los modelos que lo permitan desde el catalogo, incluyendo materas, bombillas y yerberos. Si queres personalizar tu mate, hacé tu pedido y te contactamos para coordinar tu grabado personalizado. Cualquier duda no duden en contactarnos.
                </>
            ),
            schemaAnswer: "Sí, hacemos personalizados en las virolas de los mates. De hecho podemos hacer personalizados en los modelos que lo permitan desde el catalogo, incluyendo materas, bombillas y yerberos. Si queres personalizar tu mate, hacé tu pedido y te contactamos para coordinar tu grabado personalizado. Cualquier duda no duden en contactarnos."
        },
        {
            question: "¿Cómo realizo un pedido?",
            answer: (
                <>
                    <p className="mb-2">
                        Para hacer un pedido, armá tu carrito con tus productos desde <Link href="/" className="text-[#254642] font-semibold hover:underline">nuestro shop</Link>. Al momento de elegir un método de pago, ya sea por cualquier método, nosotros nos cumicaremos con vos cuanto antes, para coordinar el envío, y de ser necesario la transferencia o el pago en efectivo.
                    </p>
                    <p>
                        Es importante ingresar el número de teléfono y mail para que nos podamos poner en contacto con vos. En caso de no recibir un mensaje nuestro despues de 48 horas de que se hizo el pedido, te pedimos amablemente que nos mandes un mensaje a <a href="https://wa.me/5491130548207" target="_blank" rel="noopener noreferrer" className="text-[#254642] font-semibold hover:underline">nuestro número de telefono</a> - 11 3054 8207.
                    </p>
                </>
            ),
            schemaAnswer: "Para hacer un pedido, armá tu carrito con tus productos desde nuestro shop. Al momento de elegir un método de pago, nosotros nos comunicaremos con vos para coordinar el envío y el pago. Es importante ingresar el número de teléfono. Si no recibís mensaje en 48hs, contáctanos al 11 3054 8207."
        },
        {
            question: "¿Cómo curar un mate de calabaza?",
            answer: (
                <>
                    <p className="mb-2">Para curar un mate de calabaza con yerba usada se siguen los siguientes pasos:</p>
                    <ol className="list-decimal list-inside space-y-1 mb-4 pl-4">
                        <li>Llenar el mate con yerba usada o nueva.</li>
                        <li>Cubrir con un poco de agua a temperatura mate (75° - 80°).</li>
                        <li>Dejar reposar el mate durante 8 a 12 horas.</li>
                        <li>Retirar la yerba y raspar con una cuchara el interior de la calabaza, quitando el hollejo de la calabaza.</li>
                        <li>Dejar secar el mate al sol o con una servilleta dentro.</li>
                        <li>Repetir el proceso de 3 a 5 veces.</li>
                    </ol>
                    <p>
                        Podes ver el proceso en nuestro reel de Instagram: <a href="https://www.instagram.com/reel/C334SOJONZX/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==" target="_blank" rel="noopener noreferrer" className="text-[#254642] font-semibold hover:underline break-all">Ver Reel</a>
                    </p>
                </>
            ),
            schemaAnswer: "Para curar un mate de calabaza: 1. Llenar con yerba usada o nueva. 2. Cubrir con agua a 75°-80°. 3. Reposar 8-12 horas. 4. Retirar yerba y raspar el interior. 5. Secar al sol. 6. Repetir 3-5 veces."
        },
        {
            question: "¿Cómo curar un mate de madera de algarrobo?",
            answer: (
                <>
                    <p className="mb-2">Para curar un mate de algarrobo con yerba usada se siguen los siguientes pasos:</p>
                    <ol className="list-decimal list-inside space-y-1 pl-4">
                        <li>Untar el interior con un poco de aceite o manteca, cubriendo todo el interior.</li>
                        <li>Con la grasa dentro, llenar el mate con yerba usada o nueva.</li>
                        <li>Cubrir con un poco de agua a temperatura mate (75° - 80°).</li>
                        <li>Dejar reposar el mate durante 8 a 12 horas más.</li>
                        <li>Retirar la yerba y raspar con una cuchara el interior del mate.</li>
                        <li>Dejar secar el mate al sol o con una servilleta dentro.</li>
                        <li>Repetir el proceso de 3 a 5 veces.</li>
                    </ol>
                </>
            ),
            schemaAnswer: "Para curar un mate de algarrobo: 1. Untar interior con aceite/manteca. 2. Llenar con yerba. 3. Cubrir con agua a 75°-80°. 4. Reposar 8-12 horas. 5. Retirar yerba y raspar. 6. Secar al sol. 7. Repetir 3-5 veces."
        },
        {
            question: "¿Cómo curar un mate de acero inoxidable?",
            answer: (
                <>
                    Los mates de acero inoxidable no se deben curar, desde el primer momento se puede tomar. Son ideales para tomar tereré o lo que uno quiera, ya que no queda sabor en el interior. A su vez, no hace falta secarlos ni andar cuidandolos de la humedad.
                </>
            ),
            schemaAnswer: "Los mates de acero inoxidable no se deben curar, se pueden usar desde el primer momento. Son ideales para tereré y no requieren cuidados especiales contra la humedad."
        },
        {
            question: "¿Cómo cuidar un mate? ¿Cuanto tarda en secarse un mate?",
            answer: (
                <>
                    <p className="mb-2">
                        Los mates de calabaza y madera de algarrobo deben cuidarse de la humedad, por ello es que despues de usarlos, hay que retirar la yerba (SIN MOJAR) y luego secar el interior al sol o con una servilleta dentro. El mate tarda en secar aproximadamente más de 2 horas, dependiendo de la intensidad del sol. En casos de que el mate esté muy húmedo, recomendamos dejarlo más tiempo.
                    </p>
                    <p>
                        Podes ver cómo cuidamos nuestros mates despues de usarlos en este reel de nuestro Instagram: <a href="https://www.instagram.com/reel/C7Xcx0_OmzO/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==" target="_blank" rel="noopener noreferrer" className="text-[#254642] font-semibold hover:underline break-all">Ver Reel</a>
                    </p>
                </>
            ),
            schemaAnswer: "Retirar la yerba sin mojar y secar al sol o con servilleta. Tarda más de 2 horas en secar. Cuidar de la humedad."
        },
        {
            question: "¿Qué es la virola de un mate?",
            answer: (
                <>
                    La virola del mate es la parte superior metálica de los mates, usualmente los modelos camioneros e imperiales. En la virola del mate se suelen hacer los personalizados. Las virolas pueden ser de diferentes metales como acero inoxidable, alpaca o bronce.
                </>
            ),
            schemaAnswer: "La virola es la parte superior metálica del mate (camioneros e imperiales), donde se realizan los grabados personalizados. Pueden ser de acero inoxidable, alpaca o bronce."
        },
        {
            question: "¿Qué es la guarda de un mate?",
            answer: (
                <>
                    La guarda de un mate es la cinta metálica que va por los costados del modelo imperial. A todos los modelos que tengan una guarda se les suele poner el nombre imperial. Las guardas pueden ser de diferentes metales como acero inoxidable, alpaca o bronce, y pueden tener diferentes diseños cómo pueden ser guarda pampa, guarda abstracta, entre otros. Si queres ver lo productos con guarda que tenemos en stock hace click <Link href="/?q=imperial" className="text-[#254642] font-semibold hover:underline">Aquí</Link>.
                </>
            ),
            schemaAnswer: "La guarda es la cinta metálica lateral en los mates imperiales via. Puede ser de acero, alpaca o bronce, con diseños como pampa o abstractos."
        },
        {
            question: "¿Cuál es la diferencia entre el acero inoxidable y la alpaca? ¿Cúal es la diferencia entre una bombilla de acero inoxidable y otra de alpaca?",
            answer: (
                <>
                    <p className="mb-2">
                        El acero inoxidables en un metal más industrial, mientras que la alpaca es más artesanal. La alpaca tiene un brillo más cálido y los herreros hacen sus mejores cincelados en superficies de alpaca. La bombilla de acero es cumplidora, mientras que la bombilla de alpaca es más duradera y más maleable, frecuentando diseños y cincelados únicos. También se dice que las bombillas de alpaca disipan el calor diferente al acero inoxidable, haciendo que la bombilla no te queme los labios.
                    </p>
                    <p>
                        Consulta nuestras bombillas en stock clickeando <Link href="/?category=bombilla" className="text-[#254642] font-semibold hover:underline">Aquí</Link>.
                    </p>
                </>
            ),
            schemaAnswer: "El acero es industrial, la alpaca es artesanal y tiene un brillo más cálido. Las bombillas de alpaca son más duraderas, maleables, con mejores diseños y disipan mejor el calor."
        },
        {
            question: "¿Cómo se prepara un mate?",
            answer: (
                <>
                    <ol className="list-decimal list-inside space-y-1 mb-4 pl-4">
                        <li>Llenar el mate con 3/4 partes de yerba.</li>
                        <li>Tapar la boca del mate con la mano y sacudir enérgicamente. Se hace para mezclar los componentes y sacar polvo excedente.</li>
                        <li>Sacar la mano con el mate inclinado, armamando la famosa montañita.</li>
                        <li>Tirar un chorro de agua tibia en la parte más profunda del mate. Esto se hace para que la intensidad del sabor sea suave al principio del mate.</li>
                        <li>Esperar aproximadamente 2 minutos e ir agregando chorros cortos de agua caliente.</li>
                        <li>Con el tiempo cumplido, acomodar la bombilla con un efecto palanca.</li>
                        <li>Ya con la bombilla puesta, solo queda disfrutar los mates.</li>
                    </ol>
                    <p>
                        Podes ver un paso a paso en este reel de nuestro Instagram: <a href="https://www.instagram.com/reel/C300_KUOF6T/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==" target="_blank" rel="noopener noreferrer" className="text-[#254642] font-semibold hover:underline break-all">Ver Reel</a>
                    </p>
                </>
            ),
            schemaAnswer: "1. Llenar 3/4 con yerba. 2. Sacudir tapando boca. 3. Dejar inclinado (montañita). 4. Agua tibia al fondo. 5. Esperar 2 min, agregar agua caliente. 6. Acomodar bombilla. 7. Disfrutar."
        },
        {
            question: "¿Hacen envíos gratis?",
            answer: (
                <>
                    Sí, hacemos envíos gratis en la zona de Canning, Buenos Aires.
                </>
            ),
            schemaAnswer: "Sí, hacemos envíos gratis en la zona de Canning, Buenos Aires."
        },
        {
            question: "¿Hacen envíos a todo el país? ¿Cuánto tardan?",
            answer: (
                <>
                    Hacemos envíos a todo el país. Los envíos tardan entre 2 y 5 días hábiles. El servicio que utilizamos es Correo Argentino <a href="http://Paq.ar" target="_blank" rel="noopener noreferrer" className="text-[#254642] font-semibold hover:underline">Paq.ar</a> Clásico. El precio del mismo suele varias entre $7.000 y $12.000 pesos argentinos, dependiendo de la zona y el tamaño del paquete.
                </>
            ),
            schemaAnswer: "Hacemos envíos a todo el país por Correo Argentino Paq.ar Clásico. Tardan 2-5 días hábiles y cuestan entre $7.000 y $12.000 dependiendo de zona y tamaño."
        },
        {
            question: "¿Qué hacer si mi mate tiene hongos? ¿Cómo saber si mi mate tiene hongos?",
            answer: (
                <>
                    Para saber si tu mate tiene hongos, tiene que tener una pelusa blanca y un olor muy fuerte en el interior del mate. Para quitarle los hongos al mate debes curarlo una vez y dejarlo secar muy bien. Luego de raspar bien el interior y raspar las zonas manchadas, si el mate está seco y con olor normal, ya se puede tomar.
                </>
            ),
            schemaAnswer: "Si tiene pelusa blanca y olor fuerte, tiene hongos. Curalo, secalo bien, raspa el interior y zonas manchadas. Si al secar tiene olor normal, se puede usar."
        },
        {
            question: "¿Qué hacer si mi mate de calabaza tiene verde?",
            answer: (
                <>
                    Si tu mate tiene manchas verdes y un olor fuerte no quiere decir que tiene hongos, sino que tiene o tuvo un poco de húmedad y la calabaza reaccionó con olor fuerte. Es normal que las calabaza se tiñan de color verde, algunas calabazas se tiñen más, otras menos. Lo importante es ser constantes con el mantenimiento y cuidado del mate.
                </>
            ),
            schemaAnswer: "Manchas verdes y olor fuerte suelen ser humedad, no hongos. Es normal que se tiña. Mantener cuidado constante."
        },
        {
            question: "¿A qué temperatura se toma el mate? ¿Porqué?",
            answer: (
                <>
                    El mate se toma entre 75 y 80 grado centígrados. En esa temperatura es dónde la yerba libera el máximo de su sabor.
                </>
            ),
            schemaAnswer: "Entre 75° y 80°C, donde la yerba libera su máximo sabor."
        },
        {
            question: "¿Se puede quemar la yerba? ¿A qué temperatura se quema la yerba?",
            answer: (
                <>
                    La yerba se quema a partir de los 100 grados centrígrados, es decir, para quemar la yerba el agua tiene que estar literalmente hirviendo.
                </>
            ),
            schemaAnswer: "A partir de 100°C (agua hirviendo)."
        },
        {
            question: "¿Hacen venta mayorista?",
            answer: (
                <>
                    Sí, hacemos venta mayorista para eventos empresariales o institucionales.
                </>
            ),
            schemaAnswer: "Sí, hacemos venta mayorista para eventos empresariales o institucionales."
        },
        {
            question: "¿Qué métodos de pago aceptamos?",
            answer: (
                <>
                    Cómo métodos de pago aceptamos efectivo y transferencia bancaria.
                </>
            ),
            schemaAnswer: "Efectivo y transferencia bancaria."
        },
        {
            question: "¿Cúal es el mejor mate para principiantes?",
            answer: (
                <>
                    El mejor mate para principiantes es el mate con interiro de acero inoxidable ya que no requiere de mantenimiento alguno. En cambio, los mates de calabaza o madera de algarrobo hay que cuidarlos de la húmedad e intentar no dejar la yerba dentro por mucho tiempo.
                </>
            ),
            schemaAnswer: "El mate de acero inoxidable, ya que no requiere mantenimiento."
        },
        {
            question: "¿Existen otras maneras de curar un mate?",
            answer: (
                <>
                    Sí, el mate tambien se puede curar con whisky o con brasas y azúcar. Te explicamos ambas, aunque existen otras maneras. Los pasos para curar un mate con whisky son: con un chorro de whisky cubrir las paredes del interior del mate, luego llenar el mate con yerba nueva para despues agregarle agua tibia y otro chorrito de whisky. Despues de reposar 24 horas, vaciar el mate y raspar las paredes para sacar el hollejo y dejarlo secar a la sombra. Los pasos para curar un mate con brasas y azúcar son: poner dos cucharaditas de azúcar común dentro del mate y con la mano tapando la boca del mate, sacudirlo para que el azúcar se disperse por todo el mate. Después, tomar una brasita de carbón o leña bien caliente (color rojo) y depositarlo dentro del mate, para luego tapar la boca del mate con un cartón o madera y sacurdirlo enérgicamente, cuidado con no quemarte. Después de sacudir y retirar la brasa que formó una pelicula de caramelo, dejar el mate con yerba húmeda por 24 horas para asentar el sabor.
                </>
            ),
            schemaAnswer: "Sí, con whisky o brasas y azúcar. Whisky: cubrir paredes, llenar con yerba y agua tibia + whisky, reposar 24hs, raspar y secar. Brasas y azúcar: azúcar dentro, sacudir, poner brasa caliente, sacudir enérgicamente (cuidado), dejar con yerba húmeda 24hs."
        },
        {
            question: "¿Por qué se me tapa la bombilla y cómo lo soluciono?",
            answer: (
                <>
                    Antes que nada, evaluar si estamos preparando el mate de manera adecuada, cada paso en la preparación tiene un porqué, revisar la pregunta "¿Cómo se prepara un mate?". Si se te tapa la bombilla intentá utilizar una bombilla con una cuchara (parte de abajo) con más poros. Si no te funcionó, intentá cambiar la molienda de la yerba, es decir, si usas molienda uruguaya (mucho polvo y hojas finas) y se te tapa, intenta con molienda argentina (hoja más gruesa, sin tanto polvo).
                </>
            ),
            schemaAnswer: "Revisar preparación. Usar bombilla con más poros. Cambiar molienda de yerba (de uruguaya fina a argentina gruesa)."
        },
        {
            question: "¿Cómo limpiar las bombillas?",
            answer: (
                <>
                    Para limpiar tus bombillas ponemos agua a hervir en una olla y tiramos 2 cucharaditas de bicarbonato de sodio. Al hervir, con cuidado, metemos las bombillas en el agua y las dejamos al menos unos 10 minutos en el agua hirviendo. Vas a notar que el agua se va oscureciendo con los restos de yerba que fueron quedando en las bombillas. Pasado el tiempo, podemos retirar las bombillas, enjuagarlas y seguir usandolas. Con esta limpieza nos aseguramos de limpiar el interior de las bombillas. Se recomiendo hacer esta limpieza cada 3 a 6 meses, aunque no es algo indispensable, pero si recomendado.
                </>
            ),
            schemaAnswer: "Hervir agua con 2 cditas de bicarbonato. Dejar bombillas 10 min en agua hirviendo. Enjuagar. Repetir cada 3-6 meses."
        },
        {
            question: "Si el mate no me gusta o es distinto a la foto, ¿lo puedo cambiar?",
            answer: (
                <>
                    El mate es un fruto natural (calabaza) por ende la forma del mismo puede variar. Si el mate no fue curado ni manipulado y no fue lo que esperaba el cliente, con gusto haremos el cambio. Si el mate tiene un error de fábrica, con gusto repondremos con un mate en condiciones.
                </>
            ),
            schemaAnswer: "Si. Si no fue curado/usado, se cambia si no es lo esperado. Si tiene falla de fábrica, se repone. Recordar que la calabaza es un fruto natural y varía."
        },
        {
            question: "¿Por qué no se puede personalizar el mate torpedo en la virola?",
            answer: (
                <>
                    El mate torpedo con virola lisa no se puede personalizar ya que la virola se encuentra en diagonal y no tenemos la maquinaria necesaria para hacer ese tipo de grabados.
                </>
            ),
            schemaAnswer: "Porque la virola es diagonal y no contamos con la maquinaria para grabar en ese ángulo."
        },
    ];

    // JSON-LD Schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.schemaAnswer
            }
        }))
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd)
                }}
            />
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-[#254642] mb-8 text-center">
                Sobre Nosotros
            </h1>

            {/* Content Paragraphs */}
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed mb-16">
                <p>
                    En Puros Mates, creemos que lo más importante de esta tradición es la posibilidad de compartirlo, de invitarlo, de pasarlo.
                    Sabemos que nuestro fuerte es la atención al cliente, dónde cada Puro Matero tiene su contacto de confianza que somos nosotros.
                </p>
                <p>
                    Cada día intentamos acercar un poco más el mate al que no lo tiene, y al que ya lo tiene tambien.
                    Como comercio nos esforzamos e innovamos en cada rincón del emprendimiento, para poder acercar el mejor mate, al mejor precio, al mejor cebador.
                    Acá vas a encontrar tu mejor compañero.
                </p>
                <p>
                    Si queres más información sobre nosotros o simplemente queres charlar sobre el mate, nos podes mandar un mensaje a{" "}
                    <a
                        href="https://wa.me/5491130548207"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#254642] font-semibold hover:!underline hover:!text-[#254642] decoration-2 transition-all"
                    >
                        nuestro número de telefono
                    </a>{" "}
                    - 11 3054 8207.
                </p>
            </div>

            {/* FAQ Section */}
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-[#254642] mb-8 text-center">
                    Preguntas Frecuentes (FAQ)
                </h2>
                <div className="space-y-4">
                    {faqs.slice(0, visibleCount).map((faq, index) => (
                        <FAQItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                        />
                    ))}
                </div>
                {visibleCount < faqs.length && (
                    <div className="mt-8 flex justify-center">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 5)}
                            className="bg-[#254642] text-white px-6 py-2 rounded-md font-semibold hover:bg-[#1a322f] transition-colors shadow-sm"
                        >
                            Cargar más
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string, answer: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
                className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className="font-semibold text-[#254642] text-left">{question}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="p-4 bg-gray-50 text-gray-600 border-t border-gray-200">
                    {answer}
                </div>
            </div>
        </div>
    );
}
