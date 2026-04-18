interface Testimonial {
  name: string;
  text: string;
  rating: number;
}

export default function Testimonials({ data }: { data: Testimonial[] }) {
  if (!data || data.length === 0) return null;

  return (
    <section className="bg-gray-50 py-10 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 md:mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-5xl mb-4">
            Voces de nuestra comunidad
          </h2>
          <div className="w-24 h-1.5 bg-[#D4AF37] mx-auto rounded-full"></div>
          <p className="mt-4 md:mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre por qué miles de materos eligen Puros Mates para sus rituales diarios.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {data.map((testimonial, idx) => (
            <div 
              key={idx} 
              className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-lg shadow-gray-200/50 border border-gray-100 flex flex-col h-full transform transition-all hover:-translate-y-2 hover:shadow-2xl"
            >
              <div className="flex text-[#D4AF37] mb-3 md:mb-6">
                {[...Array(5)].map((_, i) => (
                  <svg 
                    key={i} 
                    className={`w-3 h-3 md:w-6 md:h-6 fill-current ${i < testimonial.rating ? 'text-[#D4AF37]' : 'text-gray-200'}`} 
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="flex-grow">
                <p className="text-gray-700 text-xs md:text-lg leading-relaxed mb-4 md:mb-8 italic">
                  "{testimonial.text}"
                </p>
              </blockquote>
              <div className="mt-auto border-t pt-3 md:pt-6 flex items-center gap-2 md:gap-4">
                <div className="w-8 h-8 md:w-12 md:h-12 bg-[#254642] rounded-full flex items-center justify-center text-white font-bold text-sm md:text-xl uppercase">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="text-gray-900 font-bold text-xs md:text-lg leading-none mb-1">{testimonial.name}</p>
                  <p className="text-[#D4AF37] text-[10px] md:text-sm font-medium">Cliente Verificado</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

