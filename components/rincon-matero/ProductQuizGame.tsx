'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, HelpCircle, Sparkles, XCircle } from 'lucide-react';

interface Question {
  id: number;
  productName: string;
  category: string;
  imageUrl: string;
  questionText: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
  explanation: string;
  shopLink: string;
  shopButtonText: string;
}

const quizQuestions: Question[] = [
  {
    id: 1,
    productName: 'Despolvillador de Yerba Mate',
    category: 'Accesorios Esenciales',
    imageUrl: '/assets/rincon-matero/despolvillador.jpg',
    questionText: '¿Cuál es la función técnica de este accesorio con filtro interno?',
    options: [
      {
        id: 'a',
        text: 'Separar el exceso de polvillo fino para prevenir la acidez estomacal y el taponamiento.',
        isCorrect: true,
      },
      {
        id: 'b',
        text: 'Triturar el palo de la yerba para lograr una molienda más delgada.',
        isCorrect: false,
      },
      {
        id: 'c',
        text: 'Almacenar saquitos de té y dosificar azúcar.',
        isCorrect: false,
      },
    ],
    explanation:
      'El polvillo en exceso es el principal causante de la acidez gástrica y de la obstrucción de la bombilla. Al tamizar la yerba en el despolvillador durante unos segundos, se obtiene una infusión limpia, suave y de mayor rendimiento.',
    shopLink: '/shop?category=accesorios',
    shopButtonText: 'Ver Despolvilladores en la Tienda',
  },
  {
    id: 2,
    productName: 'Bombilla Pico de Loro Cincelada',
    category: 'Bombillas Artesanales',
    imageUrl: '/assets/rincon-matero/bombilla-pico-loro.jpg',
    questionText: '¿Por qué la morfología "Pico de Loro" es la preferida de los cebadores?',
    options: [
      {
        id: 'a',
        text: 'Su curvatura anatómica permite beber cómodamente sin inclinar el mate ni quebrar la montañita.',
        isCorrect: true,
      },
      {
        id: 'b',
        text: 'Enfría el agua a 20 grados centígrados de forma automática.',
        isCorrect: false,
      },
      {
        id: 'c',
        text: 'Impide que la yerba requiera renovación de agua.',
        isCorrect: false,
      },
    ],
    explanation:
      'El diseño en ángulo "Pico de Loro" se apoya de forma natural en el borde del mate, facilitando la postura al beber y protegiendo el colchón de yerba seca sin necesidad de mover la pieza.',
    shopLink: '/shop?category=bombilla',
    shopButtonText: 'Ver Bombillas Pico de Loro',
  },
  {
    id: 3,
    productName: 'Cepillo Limpiador de Bombillas',
    category: 'Higiene y Cuidado',
    imageUrl: '/assets/rincon-matero/cepillo-limpiador.jpg',
    questionText: '¿Por qué es indispensable higienizar el conducto interno de la bombilla?',
    options: [
      {
        id: 'a',
        text: 'Para remover el sarro mineral y residuos orgánicos que generan acidez y sabor amargo añejo.',
        isCorrect: true,
      },
      {
        id: 'b',
        text: 'Para afilar el extremo inferior de la pala de filtrado.',
        isCorrect: false,
      },
      {
        id: 'c',
        text: 'Solo debe emplearse cuando la bombilla sufre una rotura visible.',
        isCorrect: false,
      },
    ],
    explanation:
      'Con el uso continuo, los minerales del agua y el polvillo crean sedimentos en el interior del tubo. Un cepillado periódico con agua tibia y bicarbonato restituye la pureza del sabor original.',
    shopLink: '/shop?category=accesorios',
    shopButtonText: 'Ver Accesorios de Limpieza',
  },
  {
    id: 4,
    productName: 'Mate Imperial de Calabaza Gruesa',
    category: 'Mates Artesanales',
    imageUrl: '/assets/rincon-matero/mate-imperial.jpg',
    questionText: '¿Qué ventaja térmica y organoléptica ofrece la calabaza seleccionada?',
    options: [
      {
        id: 'a',
        text: 'Sella los aceites aromáticos de la yerba, ofrece aislación térmica natural y no transmite calor al exterior.',
        isCorrect: true,
      },
      {
        id: 'b',
        text: 'Es un material apto para calentamiento en microondas.',
        isCorrect: false,
      },
      {
        id: 'c',
        text: 'Genera agua caliente de manera autónoma.',
        isCorrect: false,
      },
    ],
    explanation:
      'La calabaza de pared gruesa es un material noble y poroso que, tras el curado, enriquece las notas aromáticas de cada cebada y proporciona un agarre térmicamente confortable.',
    shopLink: '/shop?category=mate',
    shopButtonText: 'Ver Mates Imperiales y Camioneros',
  },
];

export default function ProductQuizGame() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showAnswer, setShowAnswer] = useState(false);

  const currentQ = quizQuestions[currentIdx];
  const selectedOptionId = selectedAnswers[currentQ.id];
  const isCorrect = currentQ.options.find((opt) => opt.id === selectedOptionId)?.isCorrect;

  const handleSelectOption = (optionId: string) => {
    if (showAnswer) return;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
    setShowAnswer(true);
  };

  const handleNext = () => {
    if (currentIdx < quizQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setShowAnswer(false);
    }
  };

  const correctAnswersCount = Object.entries(selectedAnswers).filter(([qId, ansId]) => {
    const q = quizQuestions.find((item) => item.id === Number(qId));
    return q?.options.find((opt) => opt.id === ansId)?.isCorrect;
  }).length;

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#254642]/10 px-3 py-1 text-xs font-bold text-[#254642] uppercase">
            <HelpCircle className="h-3.5 w-3.5 text-[#D4AF37]" />
            Adivinanza de Accesorios
          </span>
          <h3 className="mt-2 text-2xl font-bold text-[#254642] sm:text-3xl">
            Identificación de Accesorios y Funcionalidad
          </h3>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-[#F5F2E9] px-4 py-2 text-sm font-bold text-[#254642]">
          <span>
            Pregunta {currentIdx + 1} de {quizQuestions.length}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-[#254642]">{correctAnswersCount} Aciertos</span>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="grid items-center gap-8 lg:grid-cols-12">
        {/* Product Visual with real photography */}
        <div className="flex flex-col items-center lg:col-span-5">
          <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-[#D4AF37]/30 bg-[#FAF8F5] p-2 shadow-md sm:max-w-[320px]">
            <Image
              src={currentQ.imageUrl}
              alt={currentQ.productName}
              fill
              className="rounded-xl object-cover transition duration-500 hover:scale-105"
            />
            <div className="absolute top-4 left-4 rounded-lg bg-[#254642]/90 px-3 py-1 text-xs font-semibold text-[#F5F5DC] shadow">
              {currentQ.category}
            </div>
          </div>
          <h4 className="mt-3 text-center text-lg font-bold text-[#254642]">
            {currentQ.productName}
          </h4>
        </div>

        {/* Options & Interactive Area */}
        <div className="flex flex-col justify-center lg:col-span-7">
          <p className="mb-4 text-base font-bold text-gray-800 sm:text-lg">
            {currentQ.questionText}
          </p>

          {/* Options */}
          <div className="space-y-3">
            {currentQ.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              let btnClass =
                'border-gray-200 bg-gray-50 text-gray-800 hover:border-[#254642] hover:bg-white';

              if (showAnswer) {
                if (opt.isCorrect) {
                  btnClass =
                    'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-2 ring-emerald-400';
                } else if (isSelected && !opt.isCorrect) {
                  btnClass = 'border-rose-400 bg-rose-50 text-rose-900 line-through opacity-80';
                } else {
                  btnClass = 'border-gray-200 bg-gray-50/50 text-gray-400';
                }
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectOption(opt.id)}
                  disabled={showAnswer}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left text-sm shadow-2xs transition-all sm:text-base ${btnClass}`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white text-xs font-bold text-gray-700 uppercase">
                    {opt.id}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {showAnswer && opt.isCorrect && (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  )}
                  {showAnswer && isSelected && !opt.isCorrect && (
                    <XCircle className="h-5 w-5 shrink-0 text-rose-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Reveal & Store CTA */}
          {showAnswer && (
            <div className="animate-fadeIn mt-6 rounded-2xl border border-[#254642]/20 bg-[#F5F2E9] p-5 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-[#254642]">
                <Sparkles className="h-5 w-5 text-[#D4AF37]" />
                <span>{isCorrect ? 'Respuesta Correcta' : 'Fundamento del Producto:'}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{currentQ.explanation}</p>

              {/* Direct Store Link */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200/60 pt-3">
                <Link
                  href={currentQ.shopLink}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#254642] px-5 py-2.5 text-xs font-bold text-[#F5F5DC] shadow transition hover:bg-[#1C3632] hover:shadow-md sm:text-sm"
                >
                  <span>{currentQ.shopButtonText}</span>
                  <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
                </Link>

                {currentIdx < quizQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#D4AF37] bg-white px-4 py-2 text-xs font-semibold text-[#254642] transition hover:bg-[#D4AF37]/10 sm:text-sm"
                  >
                    <span>Siguiente accesorio</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-xs font-bold text-emerald-800">
                    Cuestionario completado
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination bullets */}
      <div className="mt-8 flex items-center justify-center gap-2">
        {quizQuestions.map((q, idx) => (
          <button
            key={q.id}
            type="button"
            onClick={() => {
              setCurrentIdx(idx);
              setShowAnswer(Boolean(selectedAnswers[q.id]));
            }}
            className={`h-2.5 rounded-full transition-all ${
              currentIdx === idx ? 'w-8 bg-[#254642]' : 'w-2.5 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Ir al producto ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
