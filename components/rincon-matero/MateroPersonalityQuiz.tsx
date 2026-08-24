'use client';

import { useState } from 'react';
import { Award, RefreshCw, Share2, Sparkles, UserCheck } from 'lucide-react';

interface QuizItem {
  id: number;
  question: string;
  options: {
    text: string;
    type: 'sagrado' | 'alquimista' | 'locutor' | 'rutero';
  }[];
}

const personalityQuestions: QuizItem[] = [
  {
    id: 1,
    question: '¿Cómo preparás tu mate de consumo diario?',
    options: [
      {
        text: 'Amargo estricto, con montañita inclinada y yerba tradicional seleccionada.',
        type: 'sagrado',
      },
      {
        text: 'Con una combinación de hierbas serranas (burrito, menta, cedrón o poleo).',
        type: 'alquimista',
      },
      {
        text: 'La técnica pasa a segundo plano; priorizo la conversación y el momento.',
        type: 'locutor',
      },
      {
        text: 'Rápido, en mate térmico o camionero resistente, listo para la jornada.',
        type: 'rutero',
      },
    ],
  },
  {
    id: 2,
    question: '¿Cuál es tu reacción si un integrante de la ronda mueve la bombilla?',
    options: [
      {
        text: 'Explico inmediatamente la regla técnica para evitar que se obstruya el filtro.',
        type: 'sagrado',
      },
      {
        text: 'Procuro reacomodar la base suavemente sin generar controversia.',
        type: 'alquimista',
      },
      { text: 'No suelo percatarme por estar inmerso en la conversación grupal.', type: 'locutor' },
      {
        text: 'Le recuerdo con tono coloquial que la bombilla debe permanecer fija.',
        type: 'rutero',
      },
    ],
  },
  {
    id: 3,
    question: '¿Cuánto tiempo retenés el mate al recibirlo?',
    options: [
      {
        text: 'Tiempo justo y continuo: respeto rigurosamente la fluidez de la ronda.',
        type: 'sagrado',
      },
      {
        text: 'Bebo con lentitud para percibir los matices botánicos de la mezcla.',
        type: 'alquimista',
      },
      {
        text: 'Suelo demorar la devolución al compartir anécdotas o relatos extensos.',
        type: 'locutor',
      },
      { text: 'Dos sorbos firmes, devuelvo de inmediato y continúo mis tareas.', type: 'rutero' },
    ],
  },
  {
    id: 4,
    question: '¿Cómo controlás la temperatura del agua?',
    options: [
      {
        text: 'Entre 75°C y 80°C exactos, controlados con termostato o pava configurada.',
        type: 'sagrado',
      },
      {
        text: 'Apenas inicia el primer vapor para preservar las hierbas aromáticas.',
        type: 'alquimista',
      },
      {
        text: 'Caliento la pava a punto y regulo con agua a temperatura ambiente.',
        type: 'locutor',
      },
      {
        text: 'Carga térmica directa en termo de alta retención para todo el trayecto.',
        type: 'rutero',
      },
    ],
  },
];

const personalities = {
  sagrado: {
    title: 'Cebador Tradicional',
    subtitle: 'Preservador del ritual clásico y la técnica rigurosa',
    badgeColor: 'from-[#254642] to-[#1C3632]',
    borderColor: 'border-[#D4AF37]',
    description:
      'Tu técnica prioriza la inclinación de la montañita y el control de la temperatura. Respetás la jerarquía del primer mate y valorás la persistencia de la espuma en cada servicio.',
    mateIdeal: 'Mate Imperial o Camionero de calabaza seleccionada con virola de alpaca.',
  },
  alquimista: {
    title: 'Sommelier Botánico',
    subtitle: 'Especialista en blends, aromas y propiedades digestivas',
    badgeColor: 'from-emerald-800 to-teal-900',
    borderColor: 'border-emerald-400',
    description:
      'Apreciás el equilibrio entre la yerba base y las notas herbales. Empleás temperaturas controladas para no quemar los aceites volátiles y seleccionás bombillas de paso amplio.',
    mateIdeal: 'Mate Torpedo de calabaza o Algarrobo torneado con bombilla pico de loro.',
  },
  locutor: {
    title: 'Anfitrión de Encuentro',
    subtitle: 'Impulsor del diálogo y el mate como vínculo social',
    badgeColor: 'from-amber-800 to-amber-950',
    borderColor: 'border-amber-400',
    description:
      'Para vos el mate es una herramienta de conexión humana. Disfrutás de sobremesas extendidas y valorás la compañía por encima de los tecnicismos de preparación.',
    mateIdeal: 'Set matero con bolso rígido para trasladar la ronda a cualquier espacio.',
  },
  rutero: {
    title: 'Matero Dinámico',
    subtitle: 'Orientado a la funcionalidad, resistencia y traslados continuos',
    badgeColor: 'from-stone-800 to-zinc-900',
    borderColor: 'border-stone-400',
    description:
      'Buscás durabilidad, rapidez de limpieza y retención térmica. Tu equipo resiste viajes, jornadas laborales intensas y cambios climáticos.',
    mateIdeal: 'Mate térmico de acero inoxidable doble capa o camionero con base de apoyo plana.',
  },
};

export default function MateroPersonalityQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<('sagrado' | 'alquimista' | 'locutor' | 'rutero')[]>([]);
  const [result, setResult] = useState<keyof typeof personalities | null>(null);
  const [copied, setCopied] = useState(false);

  const handleChoose = (type: 'sagrado' | 'alquimista' | 'locutor' | 'rutero') => {
    const nextAnswers = [...answers, type];
    setAnswers(nextAnswers);

    if (currentStep < personalityQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      const counts: Record<string, number> = { sagrado: 0, alquimista: 0, locutor: 0, rutero: 0 };
      nextAnswers.forEach((ans) => {
        counts[ans] = (counts[ans] || 0) + 1;
      });
      const winner = Object.entries(counts).sort(
        (a, b) => b[1] - a[1]
      )[0][0] as keyof typeof personalities;
      setResult(winner);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers([]);
    setResult(null);
    setCopied(false);
  };

  const handleShare = () => {
    if (result && typeof window !== 'undefined') {
      const text = `Completé el perfil de cebador en Puros Mates y obtuve: "${personalities[result].title}". Descubrí el tuyo en:`;
      if (navigator.share) {
        navigator
          .share({
            title: 'Perfil Matero Puros Mates',
            text,
            url: window.location.href,
          })
          .catch(() => {});
      } else {
        navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    }
  };

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold text-[#254642] uppercase">
          <UserCheck className="h-3.5 w-3.5 text-[#D4AF37]" />
          Evaluación de Perfil
        </span>
        <h3 className="mt-2 text-2xl font-bold text-[#254642] sm:text-3xl">
          Test de Estilo y Perfil de Cebador
        </h3>
      </div>

      {!result ? (
        <div>
          {/* Progress bar */}
          <div className="mb-6 flex items-center justify-between text-xs font-bold text-gray-500">
            <span>
              Pregunta {currentStep + 1} de {personalityQuestions.length}
            </span>
            <span>{Math.round(((currentStep + 1) / personalityQuestions.length) * 100)}%</span>
          </div>
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-[#254642] to-[#D4AF37] transition-all duration-300"
              style={{ width: `${((currentStep + 1) / personalityQuestions.length) * 100}%` }}
            />
          </div>

          {/* Question */}
          <h4 className="mb-6 text-center text-lg font-bold text-gray-900 sm:text-xl">
            {personalityQuestions[currentStep].question}
          </h4>

          {/* Options */}
          <div className="space-y-3">
            {personalityQuestions[currentStep].options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChoose(opt.type)}
                className="flex w-full items-center gap-4 rounded-2xl border border-gray-200 bg-[#FAF8F5] p-4 text-left text-sm font-medium text-gray-800 transition hover:border-[#254642] hover:bg-white hover:shadow-md active:scale-[0.99] sm:text-base"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#254642]/10 text-xs font-bold text-[#254642]">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Result Badge View */
        <div className="animate-fadeIn text-center">
          <div
            className={`mx-auto max-w-lg rounded-3xl border-2 bg-gradient-to-br p-8 text-white shadow-2xl ${personalities[result].borderColor} ${personalities[result].badgeColor}`}
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#D4AF37] bg-white/10 shadow-inner">
              <Award className="h-8 w-8 text-[#D4AF37]" />
            </div>
            <span className="text-xs font-bold tracking-widest text-[#D4AF37] uppercase">
              Resultado Obtenido
            </span>
            <h4 className="mt-2 text-2xl font-black text-[#F5F5DC] sm:text-3xl">
              {personalities[result].title}
            </h4>
            <p className="mt-1 text-sm font-medium text-white/80">
              {personalities[result].subtitle}
            </p>

            <p className="mt-5 text-sm leading-relaxed text-white/90 sm:text-base">
              {personalities[result].description}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left">
              <div className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Recipiente y Accesorio Recomendado</span>
              </div>
              <p className="mt-1 text-xs text-white/95 sm:text-sm">
                {personalities[result].mateIdeal}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl bg-[#254642] px-6 py-3 text-sm font-bold text-[#F5F5DC] shadow-md transition hover:bg-[#1C3632]"
            >
              <Share2 className="h-4 w-4 text-[#D4AF37]" />
              <span>{copied ? 'Enlace Copiado al Portapapeles' : 'Compartir Resultado'}</span>
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reiniciar Evaluación</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
