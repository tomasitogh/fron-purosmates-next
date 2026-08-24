'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Flame,
  Gauge,
  Layers,
  Leaf,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sun,
  Thermometer,
  Users,
  Wind,
} from 'lucide-react';

type YerbaType = 'con-palo' | 'despalada' | 'compuesta' | 'barbacua';
type OccasionType = 'frio' | 'estudio' | 'ronda' | 'verano';

interface CalculationResult {
  temperature: string;
  tempRange: string;
  mateRecomendado: string;
  mateCategoryLink: string;
  accesorioRecomendado: string;
  accesorioLink: string;
  accesorioDescription: string;
  consejoMaestro: string;
}

export default function TemperatureCalculator() {
  const [yerba, setYerba] = useState<YerbaType>('con-palo');
  const [ocasion, setOcasion] = useState<OccasionType>('frio');
  const [calculated, setCalculated] = useState(true);

  const yerbaOptions = [
    {
      id: 'con-palo' as YerbaType,
      title: 'Con Palo Tradicional',
      description: 'Molienda equilibrada de hoja, palo y polvillo balanceado.',
      icon: Leaf,
    },
    {
      id: 'despalada' as YerbaType,
      title: 'Despalada / Sin Palo',
      description: 'Pura hoja con mayor porcentaje de polvillo y sabor intenso.',
      icon: Layers,
    },
    {
      id: 'compuesta' as YerbaType,
      title: 'Compuesta con Hierbas',
      description: 'Mezcla botánica con menta, burrito, cedrón o manzanilla.',
      icon: Sparkles,
    },
    {
      id: 'barbacua' as YerbaType,
      title: 'Barbacuá / Ahumada',
      description: 'Secado tradicional a leña con notas ahumadas profundas.',
      icon: Flame,
    },
  ];

  const ocasionOptions = [
    {
      id: 'frio' as OccasionType,
      title: 'Día Frío o Invierno',
      description: 'Búsqueda de calidez sostenida y máxima retención térmica.',
      icon: Wind,
    },
    {
      id: 'estudio' as OccasionType,
      title: 'Estudio o Trabajo',
      description: 'Consumo individual prolongado que requiere flujo constante.',
      icon: Gauge,
    },
    {
      id: 'ronda' as OccasionType,
      title: 'Ronda Compartida',
      description: 'Múltiples participantes con cebadas continuas y dinámicas.',
      icon: Users,
    },
    {
      id: 'verano' as OccasionType,
      title: 'Día Caluroso / Verano',
      description: 'Clima cálido, opción de mate templado o tereré refrescante.',
      icon: Sun,
    },
  ];

  const calculateSettings = (): CalculationResult => {
    if (ocasion === 'verano') {
      return {
        temperature: '4°C - 8°C (Tereré) o 72°C',
        tempRange: 'Agua con abundante hielo o infusión templada suave',
        mateRecomendado: 'Mate de Acero Inoxidable Doble Capa o Vaso Térmico',
        mateCategoryLink: '/shop?category=mate',
        accesorioRecomendado: 'Bombilla Resorte / Pala Desarmable en Acero',
        accesorioLink: '/shop?category=bombilla',
        accesorioDescription:
          'Fácil de desarmar y limpiar tras el paso de jugos cítricos o agua helada.',
        consejoMaestro:
          'En días de altas temperaturas, el acero inoxidable evita la condensación exterior y conserva el frío durante horas sin alterar el sabor de la yerba.',
      };
    }

    if (yerba === 'despalada') {
      return {
        temperature: '73°C - 76°C',
        tempRange: 'Rango medio-bajo para no sobre-extraer amargor',
        mateRecomendado: 'Mate Torpedo o Camionero de Calabaza Gruesa',
        mateCategoryLink: '/shop?category=mate',
        accesorioRecomendado: 'Despolvillador de Yerba con Tamiz',
        accesorioLink: '/shop?category=accesorios',
        accesorioDescription:
          'Esencial para tamizar el polvillo concentrado y evitar obstrucciones en la bombilla.',
        consejoMaestro:
          'La yerba sin palo posee mayor superficie de contacto. Si superás los 77°C, la extracción se torna excesivamente astringente. El despolvillador es tu mejor aliado.',
      };
    }

    if (yerba === 'compuesta') {
      return {
        temperature: '74°C - 77°C',
        tempRange: 'Temperatura media para proteger los aceites aromáticos',
        mateRecomendado: 'Mate de Algarrobo Torneado o Calabaza Criolla',
        mateCategoryLink: '/shop?category=mate',
        accesorioRecomendado: 'Bombilla Pico de Loro con Cincelado en Alpaca',
        accesorioLink: '/shop?category=bombilla',
        accesorioDescription:
          'Disipa el calor progresivamente y no quema los labios durante cebadas frecuentes.',
        consejoMaestro:
          'Las hierbas digestivas (burrito, menta, cedrón) pierden sus aceites esenciales volátiles si se emplea agua a más de 78°C. Mantener el agua templada asegura un aroma floral prolongado.',
      };
    }

    if (yerba === 'barbacua') {
      return {
        temperature: '78°C - 80°C',
        tempRange: 'Rango superior óptimo para despertar las notas de roble y humo',
        mateRecomendado: 'Mate Imperial de Calabaza con Virola Cincelada',
        mateCategoryLink: '/shop?category=mate',
        accesorioRecomendado: 'Bolso Matero Rígido de Cuero',
        accesorioLink: '/shop?category=accesorios',
        accesorioDescription: 'Protege tu set y preserva la estabilidad del termo en traslados.',
        consejoMaestro:
          'Las hojas secadas a leña toleran muy bien el límite de 80°C, liberando una crema densa y persistente. Asegurate de verter el agua en un único sector para preservar la montañita seca.',
      };
    }

    // Default con-palo
    return {
      temperature: '76°C - 78°C',
      tempRange: 'La temperatura estándar de oro para molienda clásica',
      mateRecomendado: 'Mate Camionero de Calabaza Premium con Base Reforzada',
      mateCategoryLink: '/shop?category=mate',
      accesorioRecomendado: 'Bombilla Pico de Loro Clásica',
      accesorioLink: '/shop?category=bombilla',
      accesorioDescription:
        'Forma ergonómica de apoyo perfecto para evitar la rotura de la montañita.',
      consejoMaestro:
        'Con molienda con palo, 77°C es el punto justo donde el palo aporta dulzor natural y la hoja libera su cuerpo sin quemarse.',
    };
  };

  const result = calculateSettings();

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-10">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#254642]/10 px-3 py-1 text-xs font-bold text-[#254642] uppercase">
          <Thermometer className="h-3.5 w-3.5 text-[#D4AF37]" />
          Simulador Técnico
        </span>
        <h3 className="mt-2 text-2xl font-bold text-[#254642] sm:text-3xl">
          Calculadora de Temperatura y Cebada
        </h3>
        <p className="mt-1 text-sm text-gray-600 sm:text-base">
          Seleccioná tu tipo de yerba y la ocasión de consumo para obtener la calibración térmica
          exacta, el recipiente sugerido y los accesorios recomendados.
        </p>
      </div>

      {/* Grid of Selectors */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Selector 1: Yerba */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
            1. Tipo de Yerba Mate
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {yerbaOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = yerba === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setYerba(opt.id)}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-[#254642] bg-[#FAF8F5] shadow-xs ring-2 ring-[#254642]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#254642]/10 text-[#254642]">
                    <Icon className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-sm font-bold text-[#254642]">{opt.title}</span>
                  <span className="mt-1 text-xs leading-snug text-gray-500">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selector 2: Occasion */}
        <div>
          <label className="mb-2 block text-xs font-bold tracking-wider text-gray-500 uppercase">
            2. Clima u Ocasión de Consumo
          </label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {ocasionOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = ocasion === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setOcasion(opt.id)}
                  className={`flex flex-col items-start rounded-2xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? 'border-[#254642] bg-[#FAF8F5] shadow-xs ring-2 ring-[#254642]/20'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#254642]/10 text-[#254642]">
                    <Icon className="h-4 w-4 text-[#D4AF37]" />
                  </div>
                  <span className="text-sm font-bold text-[#254642]">{opt.title}</span>
                  <span className="mt-1 text-xs leading-snug text-gray-500">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Result Card */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-[#254642]/20 bg-gradient-to-br from-[#FAF8F5] to-white p-6 shadow-md sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <span className="text-xs font-bold tracking-wider text-[#D4AF37] uppercase">
              Resultado de Calibración
            </span>
            <h4 className="text-xl font-black text-[#254642] sm:text-2xl">
              Temperatura Recomendada: <span className="text-[#D4AF37]">{result.temperature}</span>
            </h4>
            <p className="mt-1 text-xs text-gray-600 sm:text-sm">{result.tempRange}</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#254642] text-white shadow-md">
            <Thermometer className="h-7 w-7 text-[#D4AF37]" />
          </div>
        </div>

        {/* Detailed recommendations */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Recommendation 1 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="text-xs font-bold text-gray-500 uppercase">Recipiente Sugerido</span>
            <h5 className="mt-1 text-base font-bold text-[#254642]">{result.mateRecomendado}</h5>
            <Link
              href={result.mateCategoryLink}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#254642] transition hover:text-[#D4AF37]"
            >
              <span>Ver modelos disponibles</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Recommendation 2 */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <span className="text-xs font-bold text-gray-500 uppercase">Accesorio Estratégico</span>
            <h5 className="mt-1 text-base font-bold text-[#254642]">
              {result.accesorioRecomendado}
            </h5>
            <p className="mt-1 text-xs text-gray-600">{result.accesorioDescription}</p>
            <Link
              href={result.accesorioLink}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#254642] transition hover:text-[#D4AF37]"
            >
              <span>Explorar en la tienda</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Master advice banner */}
        <div className="mt-5 rounded-xl border border-[#254642]/10 bg-[#254642]/5 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-[#254642] uppercase">
            <ShieldCheck className="h-4 w-4 text-[#D4AF37]" />
            <span>Fundamento Técnico</span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-gray-700 sm:text-sm">
            {result.consejoMaestro}
          </p>
        </div>
      </div>
    </div>
  );
}
