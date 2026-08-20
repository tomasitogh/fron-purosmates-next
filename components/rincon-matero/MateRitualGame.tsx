'use client';

import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  RefreshCw,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';

interface Step {
  id: number;
  correctOrder: number;
  text: string;
  shortText: string;
  tip: string;
}

const initialSteps: Step[] = [
  {
    id: 1,
    correctOrder: 1,
    text: 'Llenar 3/4 partes del mate con yerba mate seleccionada.',
    shortText: 'Llenar 3/4 con yerba',
    tip: 'Dejar espacio superior para conformar la montañita inclinada.',
  },
  {
    id: 2,
    correctOrder: 2,
    text: 'Tapar la boca del mate con la palma y sacudirlo enérgicamente de manera invertida.',
    shortText: 'Tapar y sacudir el polvillo',
    tip: 'Permite que el polvillo fino decante hacia la superficie y no obstruya el filtro.',
  },
  {
    id: 3,
    correctOrder: 3,
    text: 'Inclinar el mate a 45° para recostar la yerba y generar la montañita seca.',
    shortText: 'Inclinar a 45° (montañita)',
    tip: 'La pared seca de yerba garantiza la dosificación paulatina del sabor.',
  },
  {
    id: 4,
    correctOrder: 4,
    text: 'Verter un chorro de agua tibia (no caliente) en la cavidad inferior y aguardar 1 a 2 minutos.',
    shortText: 'Chorro de agua tibia en la base',
    tip: 'Hidrata la yerba sin sobrecalentarla y asienta la base donde reposará la bombilla.',
  },
  {
    id: 5,
    correctOrder: 5,
    text: 'Introducir la bombilla ocluyendo la boquilla con el pulgar hasta tocar el fondo.',
    shortText: 'Insertar la bombilla tapando el pico',
    tip: 'Evita la entrada de aire y la aspiración de partículas en el primer cebado.',
  },
  {
    id: 6,
    correctOrder: 6,
    text: 'Cebar de forma pausada con agua a 75°-80°C sobre la bombilla, manteniendo seca la montañita.',
    shortText: 'Cebar a 75°-80°C con precisión',
    tip: 'El cebado puntual sobre la cavidad preserva la estructura durante múltiples rondas.',
  },
];

function shuffleArray(array: Step[]): Step[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (shuffled.every((item, idx) => item.correctOrder === idx + 1)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

export default function MateRitualGame() {
  const [steps, setSteps] = useState<Step[]>(() => shuffleArray(initialSteps));
  const [checked, setChecked] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const moveStep = (index: number, direction: 'up' | 'down') => {
    setChecked(false);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;

    const newSteps = [...steps];
    const [movedItem] = newSteps.splice(index, 1);
    newSteps.splice(targetIndex, 0, movedItem);
    setSteps(newSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    const newSteps = [...steps];
    const [draggedItem] = newSteps.splice(draggedIdx, 1);
    newSteps.splice(index, 0, draggedItem);
    setDraggedIdx(index);
    setSteps(newSteps);
    setChecked(false);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  const verifyOrder = () => {
    const correct = steps.every((item, idx) => item.correctOrder === idx + 1);
    setChecked(true);
    setIsSuccess(correct);
  };

  const resetGame = () => {
    setSteps(shuffleArray(initialSteps));
    setChecked(false);
    setIsSuccess(false);
  };

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      <div className="mb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-4 py-1 text-xs font-bold tracking-wide text-[#254642] uppercase sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
          Desafío de Ordenamiento
        </span>
        <h3 className="mt-2 text-2xl font-bold text-[#254642] sm:text-3xl">
          Armá el Mate Perfecto en 6 Pasos
        </h3>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 sm:text-base">
          Ordená las tarjetas arrastrándolas o utilizando las flechas de posición para estructurar
          el proceso técnico de cebado.
        </p>
      </div>

      {/* Interactive Step List */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const isCorrectPosition = checked && step.correctOrder === idx + 1;
          const isWrongPosition = checked && step.correctOrder !== idx + 1;

          return (
            <div
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition-all sm:gap-4 sm:p-4 ${
                draggedIdx === idx
                  ? 'scale-[0.98] border-[#D4AF37] bg-[#F5F2E9]/80 shadow-inner'
                  : isCorrectPosition
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : isWrongPosition
                      ? 'border-rose-300 bg-rose-50/70'
                      : 'border-gray-200 bg-[#FAF8F5] hover:border-[#254642]/30 hover:bg-white hover:shadow-md'
              }`}
            >
              {/* Order Number Badge */}
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#254642] text-sm font-bold text-[#F5F5DC] shadow-xs sm:h-9 sm:w-9">
                  {idx + 1}
                </span>
              </div>

              {/* Text description */}
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-gray-900 sm:text-base">{step.text}</p>
                {checked && isCorrectPosition && (
                  <p className="mt-1 text-xs font-medium text-emerald-700">
                    Posición correcta: {step.tip}
                  </p>
                )}
                {checked && isWrongPosition && (
                  <p className="mt-1 text-xs font-medium text-rose-600">
                    Paso fuera de secuencia cronológica.
                  </p>
                )}
              </div>

              {/* Status icon if checked */}
              {checked && (
                <div className="shrink-0">
                  {isCorrectPosition ? (
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-500" />
                  )}
                </div>
              )}

              {/* Up / Down Controls */}
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => moveStep(idx, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1 text-gray-500 transition hover:bg-[#254642]/10 hover:text-[#254642] disabled:opacity-20"
                  aria-label={`Mover paso ${idx + 1} hacia arriba`}
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveStep(idx, 'down')}
                  disabled={idx === steps.length - 1}
                  className="rounded-lg p-1 text-gray-500 transition hover:bg-[#254642]/10 hover:text-[#254642] disabled:opacity-20"
                  aria-label={`Mover paso ${idx + 1} hacia abajo`}
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Success or Try Again Banner */}
      {checked && (
        <div
          className={`mt-6 rounded-2xl p-5 text-center transition-all ${
            isSuccess
              ? 'border border-emerald-300 bg-emerald-100 text-emerald-950 shadow-md'
              : 'border border-amber-300 bg-amber-50 text-amber-950'
          }`}
        >
          {isSuccess ? (
            <div>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg">
                <Trophy className="h-6 w-6" />
              </div>
              <h4 className="text-xl font-bold text-emerald-900">
                Secuencia Correcta: Proceso de Cebado Validado
              </h4>
              <p className="mt-1 text-sm text-emerald-800">
                Has ordenado con precisión las etapas para garantizar una infusión balanceada y
                duradera.
              </p>
            </div>
          ) : (
            <div>
              <h4 className="text-lg font-bold text-amber-900">Secuencia Incompleta</h4>
              <p className="mt-1 text-sm text-amber-800">
                Verificá las tarjetas señaladas en rojo y reorganizá la cronología antes de realizar
                la verificación.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={verifyOrder}
          className="rounded-xl bg-[#254642] px-7 py-3.5 text-base font-bold text-[#F5F5DC] shadow-lg transition hover:bg-[#1C3632] hover:shadow-xl active:scale-95"
        >
          Verificar Secuencia
        </button>
        <button
          type="button"
          onClick={resetGame}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          Reordenar Aleatoriamente
        </button>
      </div>
    </div>
  );
}
