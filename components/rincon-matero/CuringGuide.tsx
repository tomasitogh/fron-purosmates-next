'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  Clock,
  Layers,
  Shield,
  Sparkles,
  TreePine,
} from 'lucide-react';
import { curingGuidesData } from './data';

type MateType = 'calabaza' | 'madera' | 'acero';

export default function CuringGuide() {
  const [activeTab, setActiveTab] = useState<MateType>('calabaza');

  const currentGuide = curingGuidesData.find((g) => g.id === activeTab) || curingGuidesData[0];

  const getTabIcon = (type: MateType) => {
    switch (type) {
      case 'calabaza':
        return Shield;
      case 'madera':
        return TreePine;
      case 'acero':
        return Layers;
    }
  };

  return (
    <div className="rounded-3xl border border-[#254642]/10 bg-white p-6 shadow-xl sm:p-8 md:p-12">
      <div className="mb-8 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/15 px-4 py-1 text-xs font-bold tracking-wide text-[#254642] uppercase sm:text-sm">
          <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
          Guía Maestra Paso a Paso
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#254642] sm:text-4xl">
          Cómo Curar tu Mate según el Material
        </h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">
          Seleccioná la tipología de tu mate para conocer el protocolo de curado, sellado de poros y
          mantenimiento prolongado.
        </p>
      </div>

      {/* Tabs with clean SVG Icons */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-4">
        {(['calabaza', 'madera', 'acero'] as MateType[]).map((type) => {
          const isActive = activeTab === type;
          const Icon = getTabIcon(type);
          const label =
            type === 'calabaza'
              ? 'Mate de Calabaza'
              : type === 'madera'
                ? 'Mate de Madera'
                : 'Acero Inoxidable y Vidrio';

          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-xs transition-all sm:text-base ${
                isActive
                  ? 'scale-105 bg-[#254642] text-[#F5F5DC] shadow-md'
                  : 'bg-[#FAF8F5] text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Guide Content */}
      <div className="rounded-2xl border border-gray-100 bg-[#FAF8F5] p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <h3 className="text-2xl font-black text-[#254642]">{currentGuide.name}</h3>
            <p className="text-sm font-medium text-gray-600">{currentGuide.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-xs font-bold text-[#254642] shadow-xs sm:text-sm">
            <Clock className="h-4 w-4 text-[#D4AF37]" />
            <span>Tiempo de curado:</span>
            <span className="text-[#D4AF37]">{currentGuide.curingTime}</span>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-700 sm:text-base">
          {currentGuide.description}
        </p>

        {/* Steps Grid without redundant number badges */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentGuide.steps.map((step) => (
            <div
              key={step.stepNumber}
              className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs transition duration-200 hover:border-[#254642]/30"
            >
              <div>
                <div className="mb-3 flex items-center">
                  <span className="rounded-lg bg-[#254642] px-3 py-1 text-xs font-bold tracking-wider text-[#F5F5DC] uppercase shadow-2xs">
                    Paso {step.stepNumber}
                  </span>
                </div>
                <h4 className="text-base font-bold text-[#254642]">{step.title}</h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-600 sm:text-sm">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Direct Internal Link to Products */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#254642]/15 bg-white p-4">
          <span className="text-xs font-medium text-gray-600 sm:text-sm">
            ¿Buscás renovar tu equipo matero con este material?
          </span>
          <Link
            href={currentGuide.shopLink}
            className="inline-flex items-center gap-2 rounded-xl bg-[#254642] px-5 py-2.5 text-xs font-bold text-[#F5F5DC] shadow-xs transition hover:bg-[#1C3632] hover:shadow sm:text-sm"
          >
            <span>{currentGuide.shopLinkText}</span>
            <ArrowRight className="h-4 w-4 text-[#D4AF37]" />
          </Link>
        </div>

        {/* Pro Tip & Warning Callouts */}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-900">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <span>Recomendación Técnica</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/90 sm:text-sm">
              {currentGuide.proTip}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-amber-950">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-900">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>Advertencia y Cuidado</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/90 sm:text-sm">
              {currentGuide.warning}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
