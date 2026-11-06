'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Coffee,
  Hand,
  Leaf,
  Pipette,
  RotateCcw,
  Share2,
  ShoppingBag,
  Smartphone,
  Thermometer,
  X,
} from 'lucide-react';

import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  CATEGORY_PLURAL,
  POUR_TARGET,
  STEPS,
  getOption,
  optionsFor,
  type Category,
  type Step,
} from './catalog';
import type { EngineEvent, MateEngine, Snapshot } from './engine';

const CATEGORY_ICON: Record<Category, typeof Leaf> = {
  yerba: Leaf,
  bombilla: Pipette,
  mate: Coffee,
  termo: Thermometer,
};

const HOLD_STEPS: Step[] = ['yerba', 'tilt', 'water1', 'water2', 'cebar'];
const TAP_LABEL: Partial<Record<Step, string>> = {
  grab: 'Agarrar el mate',
  bombilla: 'Poner la bombilla',
  drink: 'Tomar el mate',
};
const HOLD_LABEL: Partial<Record<Step, string>> = {
  yerba: 'Mantené para volcar yerba',
  tilt: 'Mantené para inclinar',
  water1: 'Mantené para tirar agua',
  water2: 'Mantené para tirar agua',
  cebar: 'Mantené para cebar',
};

function track(e: EngineEvent | { name: string; [k: string]: unknown }) {
  const w = window as unknown as { dataLayer?: Record<string, unknown>[] };
  const { name, ...rest } = e as { name: string };
  w.dataLayer?.push({ event: `playground_${name}`, ...rest });
}

function scoreTitle(score: number) {
  if (score >= 92) return 'Cebador/a de lujo';
  if (score >= 80) return 'Buen pulso matero';
  if (score >= 65) return 'Vas bien, ¡a practicar la ronda!';
  return 'Mate lavado… ¡otra vuelta!';
}

export default function MateGame() {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MateEngine | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState(false);
  const [hiddenToast, setHiddenToast] = useState<number | null>(null);
  const [gyro, setGyro] = useState(false);
  const [canGyro] = useState(
    () =>
      typeof window !== 'undefined' &&
      'DeviceOrientationEvent' in window &&
      window.matchMedia('(pointer: coarse)').matches
  );
  const [localMsg, setLocalMsg] = useState<string | null>(null);

  // Montar el motor 3D (Three.js se descarga solo en esta página)
  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    import('./engine')
      .then(({ MateEngine }) => {
        if (cancelled) return;
        try {
          engineRef.current = new MateEngine(host, {
            onChange: setSnap,
            onEvent: track,
          });
        } catch (err) {
          console.error('No se pudo iniciar WebGL', err);
          setError(true);
        }
      })
      .catch(() => setError(true));

    return () => {
      cancelled = true;
      document.documentElement.style.overflow = prevOverflow;
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  // Toasts que vienen del motor: se ocultan solos a los 2,4 s
  const toastId = snap?.toast?.id;
  useEffect(() => {
    if (toastId == null) return;
    const t = window.setTimeout(() => setHiddenToast(toastId), 2400);
    return () => window.clearTimeout(t);
  }, [toastId]);

  useEffect(() => {
    if (!localMsg) return;
    const t = window.setTimeout(() => setLocalMsg(null), 2200);
    return () => window.clearTimeout(t);
  }, [localMsg]);

  const engine = () => engineRef.current;

  const start = () => {
    setStarted(true);
    track({ name: 'start' });
  };

  const toggleGyro = async () => {
    const ok = await engine()?.setGyro(!gyro);
    setGyro(!!ok);
    if (!gyro && !ok) setLocalMsg('Tu navegador no dio permiso para usar el giroscopio.');
  };

  const share = async () => {
    const url = 'https://www.purosmates.com.ar/playground';
    const text =
      snap?.finalScore != null
        ? `Saqué ${snap.finalScore}/100 cebando un mate en 3D 🧉 ¿Te animás?`
        : 'Cebá tu mate en 3D 🧉';
    track({ name: 'share' });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Cebá tu mate · Puros Mates', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setLocalMsg('¡Link copiado! Pasáselo a tu ronda.');
    } catch {
      /* el usuario canceló */
    }
  };

  const phase = snap?.phase ?? 'choose';
  const step = snap?.step ?? 'grab';
  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const complete = CATEGORY_ORDER.every((c) => snap?.selection[c]);

  const holdProps = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      engine()?.setHolding(true);
    },
    onPointerUp: () => engine()?.setHolding(false),
    onPointerCancel: () => engine()?.setHolding(false),
    onLostPointerCapture: () => engine()?.setHolding(false),
    onKeyDown: (e: React.KeyboardEvent) => {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        engine()?.setHolding(true);
      }
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') engine()?.setHolding(false);
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };

  const engineToast = snap?.toast && snap.toast.id !== hiddenToast ? snap.toast : null;
  const visibleToast = localMsg ? { id: -1, text: localMsg, tone: 'info' as const } : engineToast;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#cfe6f5] text-[#1f2d2a] select-none">
      {/* Lienzo 3D */}
      <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />

      {/* Hotspots flotantes sobre cada zona de la mesa (los posiciona el motor) */}
      {started &&
        CATEGORY_ORDER.map((cat) => {
          const Icon = CATEGORY_ICON[cat];
          const done = !!snap?.selection[cat];
          return (
            <button
              key={cat}
              ref={(el) => engineRef.current?.setHotspot(cat, el)}
              type="button"
              onClick={() => engine()?.focus(cat)}
              className="absolute top-0 left-0 flex items-center gap-2 rounded-full border border-white/40 bg-[#1c3632]/80 py-1.5 pr-3.5 pl-1.5 text-sm font-semibold text-white opacity-0 shadow-lg backdrop-blur-md transition-[opacity,background-color] duration-300 hover:bg-[#254642]"
              style={{ willChange: 'transform' }}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${done ? 'bg-[#D4AF37] text-[#254642]' : 'bg-white/15'}`}
              >
                {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              {CATEGORY_PLURAL[cat]}
            </button>
          );
        })}

      {/* Barra superior */}
      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 sm:p-4">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#254642] px-3.5 py-2 text-sm font-semibold text-[#F5F5DC] shadow-lg transition hover:bg-[#1c3632]"
        >
          <ArrowLeft className="h-4 w-4" /> Puros Mates
        </Link>

        {started && phase === 'choose' && (
          <ol className="pointer-events-auto hidden items-center gap-1.5 rounded-full bg-white/80 p-1.5 shadow-lg backdrop-blur-md sm:flex">
            {CATEGORY_ORDER.map((cat) => {
              const done = !!snap?.selection[cat];
              return (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => engine()?.focus(cat)}
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                      done ? 'bg-[#254642] text-[#F5F5DC]' : 'text-[#254642] hover:bg-[#254642]/10'
                    }`}
                  >
                    {done && <Check className="h-3 w-3" />}
                    {CATEGORY_LABEL[cat]}
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {started && phase === 'prepare' && (
          <div className="pointer-events-auto hidden items-center gap-1 rounded-full bg-white/80 px-3 py-2 shadow-lg backdrop-blur-md sm:flex">
            {STEPS.map((s, i) => (
              <span
                key={s.id}
                title={s.title}
                className={`h-2 rounded-full transition-all ${i < stepIdx ? 'w-2 bg-[#254642]' : i === stepIdx ? 'w-6 bg-[#D4AF37]' : 'w-2 bg-[#254642]/20'}`}
              />
            ))}
          </div>
        )}

        <div className="pointer-events-auto flex gap-2">
          {canGyro && started && (
            <button
              type="button"
              onClick={toggleGyro}
              aria-pressed={gyro}
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md transition ${gyro ? 'bg-[#D4AF37] text-[#254642]' : 'bg-white/80 text-[#254642]'}`}
            >
              <Smartphone className="h-4 w-4" /> {gyro ? 'Giroscopio on' : 'Mover con el celu'}
            </button>
          )}
        </div>
      </header>

      {/* Toast */}
      <div
        className="pointer-events-none absolute inset-x-0 top-16 flex justify-center px-4"
        aria-live="polite"
      >
        {visibleToast && (
          <div
            key={visibleToast.id}
            className={`animate-[pmToast_.25s_ease-out] rounded-full px-4 py-2 text-sm font-semibold shadow-xl ${
              visibleToast.tone === 'good'
                ? 'bg-[#254642] text-[#F5F5DC]'
                : visibleToast.tone === 'warn'
                  ? 'bg-[#D4AF37] text-[#1c3632]'
                  : 'bg-white text-[#254642]'
            }`}
          >
            {visibleToast.text}
          </div>
        )}
      </div>

      {/* ── Fase: elegir equipo ─────────────────────────────────────────── */}
      {started && phase === 'choose' && !snap?.focus && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-3 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
          {complete ? (
            <button
              type="button"
              onClick={() => engine()?.startPrepare()}
              className="pointer-events-auto animate-[pmPop_.35s_ease-out] rounded-2xl bg-[#D4AF37] px-7 py-4 text-lg font-black text-[#1c3632] shadow-2xl transition hover:scale-105 active:scale-95"
            >
              Armar mi mate →
            </button>
          ) : (
            <p className="rounded-full bg-[#1c3632]/80 px-4 py-2 text-center text-xs font-medium text-white backdrop-blur-md sm:text-sm">
              <Hand className="mr-1 inline h-4 w-4" />
              Arrastrá para mirar · Tocá un grupo para elegir tu {pendingLabel(snap)}
            </p>
          )}
        </div>
      )}

      {started && phase === 'choose' && snap?.focus && (
        <FocusPanel
          category={snap.focus}
          selectedId={snap.selection[snap.focus]}
          hovered={snap.hovered}
          onSelect={(id) => engine()?.select(id)}
          onClose={() => engine()?.focus(null)}
        />
      )}

      {/* ── Fase: preparar ──────────────────────────────────────────────── */}
      {started && phase === 'prepare' && snap && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-5">
          <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-white/90 p-4 shadow-2xl backdrop-blur-md sm:p-5">
            <p className="text-[11px] font-black tracking-widest text-[#D4AF37] uppercase">
              Paso {stepIdx + 1} de {STEPS.length}
            </p>
            <h2 className="text-xl font-black text-[#254642]">{STEPS[stepIdx].title}</h2>
            <p className="mt-0.5 text-sm text-gray-600">{STEPS[stepIdx].hint}</p>

            <div className="mt-3">
              {step === 'tilt' && (
                <Gauge
                  value={snap.tiltDeg / 90}
                  band={[30 / 90, 50 / 90]}
                  label={`${Math.round(snap.tiltDeg)}°`}
                />
              )}
              {POUR_TARGET[step] && (
                <Gauge
                  value={Math.min(snap.meter, 1)}
                  band={POUR_TARGET[step]!}
                  label={`${Math.round(snap.meter * 100)}%`}
                  over={snap.meter > POUR_TARGET[step]![1]}
                />
              )}
              {step === 'wait' && (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-14">
                    <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#25464222"
                        strokeWidth="3"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        stroke="#254642"
                        strokeWidth="3"
                        strokeDasharray={`${(snap.waitLeft / 5) * 100.5} 100.5`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-[#254642]">
                      {Math.ceil(snap.waitLeft)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">La yerba se hidrata y protege su sabor.</p>
                </div>
              )}
            </div>

            {HOLD_STEPS.includes(step) && (
              <button
                type="button"
                {...holdProps}
                className={`mt-3 w-full touch-none rounded-2xl py-4 text-base font-black shadow-lg transition ${
                  snap.holding
                    ? 'scale-[0.98] bg-[#1c3632] text-[#D4AF37]'
                    : 'bg-[#254642] text-[#F5F5DC] hover:bg-[#1c3632]'
                }`}
              >
                {snap.holding ? 'Soltá cuando esté…' : HOLD_LABEL[step]}
              </button>
            )}
            {TAP_LABEL[step] && (
              <button
                type="button"
                onClick={() => engine()?.action()}
                className="mt-3 w-full rounded-2xl bg-[#D4AF37] py-4 text-base font-black text-[#1c3632] shadow-lg transition hover:brightness-105 active:scale-[0.98]"
              >
                {TAP_LABEL[step]}
              </button>
            )}
            <p className="mt-2 hidden text-center text-[11px] text-gray-500 sm:block">
              Tip: también podés usar la barra espaciadora.
            </p>
          </div>
        </div>
      )}

      {/* ── Fase: terminado ─────────────────────────────────────────────── */}
      {started && phase === 'done' && snap && (
        <DonePanel
          snap={snap}
          onReplay={() => {
            track({ name: 'replay' });
            engine()?.replay();
          }}
          onReset={() => {
            track({ name: 'reset' });
            engine()?.reset();
          }}
          onShare={share}
        />
      )}

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center overflow-y-auto bg-[#1c3632]/35 p-4 backdrop-blur-[3px]">
          <section className="w-full max-w-lg animate-[pmPop_.4s_ease-out] rounded-3xl bg-[#FAF8F5] p-6 shadow-2xl sm:p-8">
            <span className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
              Playground · Juego 3D
            </span>
            <h1 className="mt-1 text-3xl leading-tight font-black text-[#254642] sm:text-4xl">
              Cebá tu mate
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-gray-700 sm:text-base">
              Sentate a la mesa, mirá alrededor y elegí tu equipo:{' '}
              <strong>termo, mate, bombilla y yerba</strong>. Después cebá el mate paso a paso, como
              se hace de verdad.
            </p>
            <ol className="mt-4 grid grid-cols-1 gap-x-4 gap-y-1 text-sm text-gray-700 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.id} className="flex gap-2">
                  <span className="font-black text-[#D4AF37]">{i + 1}.</span>
                  {s.title}
                </li>
              ))}
            </ol>
            {error ? (
              <p className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                Tu navegador no soporta gráficos 3D (WebGL). Probá desde Chrome, Safari o Firefox
                actualizados, o leé{' '}
                <Link href="/blog/como-cebar-un-mate-paso-a-paso" className="font-bold underline">
                  la guía para cebar un mate
                </Link>
                .
              </p>
            ) : (
              <button
                type="button"
                onClick={start}
                disabled={!snap}
                className="mt-6 w-full rounded-2xl bg-[#254642] py-4 text-lg font-black text-[#F5F5DC] shadow-lg transition hover:bg-[#1c3632] active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
              >
                {snap ? 'Sentarme a la mesa' : 'Preparando la mesa…'}
              </button>
            )}
            <p className="mt-3 text-center text-xs text-gray-500">
              Basado en nuestra guía{' '}
              <Link
                href="/blog/como-cebar-un-mate-paso-a-paso"
                className="font-semibold text-[#254642] underline"
              >
                cómo cebar un mate paso a paso
              </Link>
              .
            </p>
          </section>
        </div>
      )}

      <style>{`
        @keyframes pmToast { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }
        @keyframes pmPop { from { opacity: 0; transform: scale(.96) translateY(8px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  );
}

function pendingLabel(snap: Snapshot | null) {
  const next = CATEGORY_ORDER.find((c) => !snap?.selection[c]);
  return next ? CATEGORY_LABEL[next].toLowerCase() : 'equipo';
}

function Gauge({
  value,
  band,
  label,
  over,
}: {
  value: number;
  band: [number, number];
  label: string;
  over?: boolean;
}) {
  return (
    <div>
      <div className="relative h-4 overflow-hidden rounded-full bg-[#254642]/10">
        <div
          className="absolute inset-y-0 rounded-full bg-[#D4AF37]/35"
          style={{ left: `${band[0] * 100}%`, width: `${(band[1] - band[0]) * 100}%` }}
        />
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-75 ${over ? 'bg-[#c0392b]' : 'bg-[#254642]'}`}
          style={{ width: `${Math.min(value, 1) * 100}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[11px] font-semibold text-gray-500">
        <span>{label}</span>
        <span className="text-[#b08d25]">Zona ideal</span>
      </div>
    </div>
  );
}

function FocusPanel({
  category,
  selectedId,
  hovered,
  onSelect,
  onClose,
}: {
  category: Category;
  selectedId?: string;
  hovered: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:p-5">
      <div className="pointer-events-auto w-full max-w-5xl animate-[pmPop_.3s_ease-out] rounded-3xl bg-white/90 p-4 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black text-[#254642]">
            Elegí tu {CATEGORY_LABEL[category].toLowerCase()}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-[#254642] hover:bg-[#254642]/10"
          >
            <X className="h-4 w-4" /> Volver
          </button>
        </div>
        <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:grid lg:grid-cols-5 lg:overflow-visible lg:px-0 lg:pb-0">
          {optionsFor(category).map((o) => {
            const sel = o.id === selectedId;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelect(o.id)}
                className={`w-[78%] shrink-0 snap-start rounded-2xl border-2 p-3 text-left transition sm:w-[38%] lg:w-auto ${
                  sel
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15'
                    : hovered === o.id
                      ? 'border-[#254642]/40 bg-white'
                      : 'border-transparent bg-white/70 hover:border-[#254642]/30'
                }`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-black text-[#254642]">
                  {o.name}
                  {sel && <Check className="h-4 w-4 shrink-0 text-[#b08d25]" />}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-gray-600">
                  {o.description}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 hidden text-center text-[11px] text-gray-500 sm:block">
          También podés tocar el objeto en la mesa.
        </p>
      </div>
    </div>
  );
}

function DonePanel({
  snap,
  onReplay,
  onReset,
  onShare,
}: {
  snap: Snapshot;
  onReplay: () => void;
  onReset: () => void;
  onShare: () => void;
}) {
  const score = snap.finalScore ?? 0;
  return (
    <div className="absolute inset-0 flex items-end justify-center overflow-y-auto p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:items-center sm:p-6">
      <section className="w-full max-w-lg animate-[pmPop_.4s_ease-out] rounded-3xl bg-[#FAF8F5] p-5 shadow-2xl sm:p-7">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full bg-[#254642] text-[#D4AF37]">
            <span className="text-2xl leading-none font-black">{score}</span>
            <span className="text-[10px] font-bold text-[#F5F5DC]/70">/ 100</span>
          </div>
          <div>
            <p className="text-xs font-black tracking-widest text-[#D4AF37] uppercase">
              ¡Mate listo!
            </p>
            <h2 className="text-2xl leading-tight font-black text-[#254642]">
              {scoreTitle(score)}
            </h2>
          </div>
        </div>

        <h3 className="mt-5 text-sm font-bold text-gray-700">Tu equipo matero</h3>
        <ul className="mt-2 divide-y divide-[#254642]/10 rounded-2xl bg-white">
          {CATEGORY_ORDER.map((cat) => {
            const o = getOption(snap.selection[cat]);
            if (!o) return null;
            return (
              <li key={cat} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-gray-500 uppercase">
                    {CATEGORY_LABEL[cat]}
                  </span>
                  <span className="block truncate text-sm font-bold text-[#254642]">{o.name}</span>
                </span>
                {cat !== 'yerba' && (
                  <Link
                    href={o.shopHref}
                    onClick={() => track({ name: 'shop_click', category: cat })}
                    className="flex shrink-0 items-center gap-1 rounded-full bg-[#254642]/10 px-3 py-1.5 text-xs font-bold text-[#254642] hover:bg-[#254642]/20"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" /> Ver en la tienda
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onReplay}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#254642] py-3 text-sm font-black text-[#F5F5DC] hover:bg-[#1c3632]"
          >
            <RotateCcw className="h-4 w-4" /> Cebar otro
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center gap-1.5 rounded-2xl bg-[#D4AF37] py-3 text-sm font-black text-[#1c3632] hover:brightness-105"
          >
            <Share2 className="h-4 w-4" /> Compartir
          </button>
          <button
            type="button"
            onClick={onReset}
            className="col-span-2 rounded-2xl border-2 border-[#254642]/20 py-2.5 text-sm font-bold text-[#254642] hover:bg-[#254642]/5"
          >
            Elegir otro equipo
          </button>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          ¿Querés los secretos de la ronda?{' '}
          <Link
            href="/blog/como-cebar-un-mate-paso-a-paso"
            className="font-semibold text-[#254642] underline"
          >
            Leé la guía completa
          </Link>{' '}
          o{' '}
          <Link href="/shop" className="font-semibold text-[#254642] underline">
            mirá la tienda
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
