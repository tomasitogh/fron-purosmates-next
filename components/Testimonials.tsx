interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

export default function Testimonials({ data }: { data: Testimonial[] }) {
  if (!data || data.length === 0) return null;

  return (
    <section className="overflow-hidden bg-gray-50 py-10 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center md:mb-16">
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Voces de nuestra comunidad
          </h2>
          <div className="mx-auto h-1.5 w-24 rounded-full bg-[#D4AF37]"></div>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 md:mt-6 md:text-xl">
            Descubre por qué miles de materos eligen Puros Mates para sus rituales diarios.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-8 lg:grid-cols-3">
          {data.map((testimonial, idx) => (
            <div
              key={idx}
              className="flex h-full transform flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-lg shadow-gray-200/50 transition-all hover:-translate-y-2 hover:shadow-2xl md:rounded-3xl md:p-8"
            >
              <div className="mb-3 flex text-[#D4AF37] md:mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`h-3 w-3 fill-current md:h-6 md:w-6 ${i < testimonial.rating ? 'text-[#D4AF37]' : 'text-gray-200'}`}
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="flex-grow">
                <p className="mb-4 text-xs leading-relaxed text-gray-700 italic md:mb-8 md:text-lg">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
              </blockquote>
              <div className="mt-auto flex items-center gap-2 border-t pt-3 md:gap-4 md:pt-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#254642] text-sm font-bold text-white uppercase md:h-12 md:w-12 md:text-xl">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="mb-1 text-xs leading-none font-bold text-gray-900 md:text-lg">
                    {testimonial.name}
                  </p>
                  <p className="text-[10px] font-medium text-[#D4AF37] md:text-sm">
                    Cliente Verificado
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
