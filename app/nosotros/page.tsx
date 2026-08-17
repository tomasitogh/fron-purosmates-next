import { Metadata } from 'next';
import Image from 'next/image';
import NosotrosFAQ from '@/components/NosotrosFAQ';
import { getBaseUrl } from '@/lib/site';

const baseUrl = getBaseUrl();

export const metadata: Metadata = {
  title: 'Sobre Nosotros - Puros Mates | Mates Artesanales Argentinos',
  description:
    'Conocé la historia de Puros Mates. Somos una tienda de mates artesanales argentinos de Canning, Buenos Aires. Envíos a todo el país. Atención personalizada.',
  openGraph: {
    title: 'Sobre Nosotros - Puros Mates',
    description:
      'Conocé la historia de Puros Mates. Mates artesanales argentinos de Canning, Buenos Aires.',
    type: 'website',
    locale: 'es_AR',
    siteName: 'Puros Mates',
  },
  alternates: {
    canonical: `${baseUrl}/nosotros`,
  },
};

const faqs = [
  {
    question: '¿Hacen personalizados en el mate?',
    answer:
      'Sí, hacemos personalizados en las virolas de los mates. De hecho podemos hacer personalizados en los modelos que lo permitan desde el catalogo, incluyendo materas, bombillas y yerberos. Si queres personalizar tu mate, hacé tu pedido y te contactamos para coordinar tu grabado personalizado. Cualquier duda no duden en contactarnos.',
  },
  {
    question: '¿Cómo realizo un pedido?',
    answer:
      'Para hacer un pedido, armá tu carrito con tus productos desde nuestro shop. Al momento de elegir un método de pago, nosotros nos comunicaremos con vos para coordinar el envío y el pago. Es importante ingresar el número de teléfono y mail. Si no recibís mensaje en 48hs, contáctanos al 11 3054 8207.',
  },
  {
    question: '¿Cómo curar un mate de calabaza?',
    answer:
      'Para curar un mate de calabaza: 1. Llenar con yerba usada o nueva. 2. Cubrir con agua a 75°-80°. 3. Reposar 8-12 horas. 4. Retirar yerba y raspar el interior (hollejo). 5. Secar al sol o con servilleta. 6. Repetir 3-5 veces.',
  },
  {
    question: '¿Cómo curar un mate de madera de algarrobo?',
    answer:
      'Para curar un mate de algarrobo: 1. Untar interior con aceite o manteca. 2. Llenar con yerba. 3. Cubrir con agua a 75°-80°. 4. Reposar 8-12 horas. 5. Retirar yerba y raspar. 6. Secar al sol. 7. Repetir 3-5 veces.',
  },
  {
    question: '¿Cómo curar un mate de acero inoxidable?',
    answer:
      'Los mates de acero inoxidable no se deben curar, se pueden usar desde el primer momento. Son ideales para tereré y no requieren cuidados especiales contra la humedad.',
  },
  {
    question: '¿Cómo cuidar un mate? ¿Cuanto tarda en secarse?',
    answer:
      'Los mates de calabaza y madera deben cuidarse de la humedad. Después de usarlos, retirar la yerba SIN MOJAR y secar al sol o con servilleta. Tarda más de 2 horas en secar, dependiendo del sol.',
  },
  {
    question: '¿Qué es la virola de un mate?',
    answer:
      'La virola es la parte superior metálica del mate (camioneros e imperiales), donde se realizan los grabados personalizados. Pueden ser de acero inoxidable, alpaca o bronce.',
  },
  {
    question: '¿Qué es la guarda de un mate?',
    answer:
      'La guarda es la cinta metálica que va por los costados del modelo imperial. Puede ser de acero, alpaca o bronce, con diseños como pampa o abstractos.',
  },
  {
    question: '¿Cuál es la diferencia entre acero inoxidable y alpaca?',
    answer:
      'El acero es industrial, la alpaca es artesanal y tiene un brillo más cálido. Las bombillas de alpaca son más duraderas, maleables, con mejores diseños y disipan mejor el calor.',
  },
  {
    question: '¿Cómo se prepara un mate?',
    answer:
      '1. Llenar 3/4 con yerba. 2. Tapar la boca y sacudir enérgicamente. 3. Inclinado, sacar mano (montañita). 4. Agua tibia al fondo profundo. 5. Esperar 2 minutos, agregar chorros de agua caliente. 6. Acomodar bombilla. 7. Disfrutar.',
  },
  {
    question: '¿Hacen envíos gratis?',
    answer: 'Sí, hacemos envíos gratis en la zona de Canning, Buenos Aires.',
  },
  {
    question: '¿Hacen envíos a todo el país? ¿Cuánto tardan?',
    answer:
      'Hacemos envíos a todo el país por Correo Argentino Paq.ar Clásico. Tardan 2-5 días hábiles y cuestan entre $7.000 y $12.000 dependiendo de zona y tamaño.',
  },
  {
    question: '¿Qué hacer si mi mate tiene hongos?',
    answer:
      'Si tiene pelusa blanca y olor fuerte, tiene hongos. Curalo, secalo bien, raspa el interior y zonas manchadas. Si al secar tiene olor normal, se puede usar.',
  },
  {
    question: '¿Qué hacer si mi mate de calabaza tiene verde?',
    answer:
      'Manchas verdes y olor fuerte suelen ser humedad, no hongos. Es normal que la calabaza se tiña. Mantener cuidado constante.',
  },
  {
    question: '¿A qué temperatura se toma el mate?',
    answer: 'Entre 75° y 80°C, donde la yerba libera su máximo sabor.',
  },
  {
    question: '¿Se puede quemar la yerba?',
    answer: 'A partir de 100°C (agua hirviendo).',
  },
  {
    question: '¿Hacen venta mayorista?',
    answer: 'Sí, hacemos venta mayorista para eventos empresariales o institucionales.',
  },
  {
    question: '¿Qué métodos de pago aceptan?',
    answer: 'Efectivo y transferencia bancaria.',
  },
  {
    question: '¿Cuál es el mejor mate para principiantes?',
    answer: 'El mate de acero inoxidable, ya que no requiere mantenimiento.',
  },
  {
    question: '¿Se puede personalizar el mate torpedo?',
    answer:
      'El mate torpedo con virola lisa no se puede personalizar ya que la virola está en diagonal y no contamos con la maquinaria para grabar en ese ángulo.',
  },
  {
    question: '¿Cómo limpiar las bombillas?',
    answer:
      'Hervir agua con 2 cucharaditas de bicarbonato. Dejar bombillas 10 minutos en agua hirviendo. Enjuagar. Repetir cada 3-6 meses.',
  },
  {
    question: 'Si el mate no me gusta, ¿lo puedo cambiar?',
    answer:
      'Si no fue curado ni manipulado, se cambia si no es lo esperado. Si tiene falla de fábrica, se repone. La calabaza es un fruto natural y su forma puede variar.',
  },
];

export default function AboutUsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Sobre Nosotros',
        item: `${baseUrl}/nosotros`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-8 text-center text-4xl font-bold text-[#254642] md:text-5xl">
          Sobre Nosotros
        </h1>

        <div className="mb-16 space-y-6 text-lg leading-relaxed text-gray-700">
          <p>
            En Puros Mates, creemos que lo más importante de esta tradición es la posibilidad de
            compartirlo, de invitarlo, de pasarlo. Sabemos que nuestro fuerte es la atención al
            cliente, dónde cada Puro Matero tiene su contacto de confianza que somos nosotros.
          </p>

          <div className="my-8 flex justify-center">
            <div className="bg-white p-2 shadow-lg">
              <Image
                src="/assets/about-us1.webp"
                alt="Sobre Nosotros - Puros Mates"
                width={370}
                height={230}
                className="object-cover"
              />
            </div>
          </div>

          <p>
            Cada día intentamos acercar un poco más el mate al que no lo tiene, y al que ya lo tiene
            tambien. Como comercio nos esforzamos e innovamos en cada rincón del emprendimiento,
            para poder acercar el mejor mate, al mejor precio, al mejor cebador. Acá vas a encontrar
            tu mejor compañero.
          </p>
          <p>
            Si queres más información sobre nosotros o simplemente queres charlar sobre el mate, nos
            podes mandar un mensaje a{' '}
            <a
              href="https://wa.me/5491130548207"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#254642] decoration-2 transition-all hover:!text-[#254642] hover:!underline"
            >
              nuestro número de telefono
            </a>{' '}
            - 11 3054 8207.
          </p>
        </div>

        <NosotrosFAQ faqs={faqs} />
      </div>
    </>
  );
}
