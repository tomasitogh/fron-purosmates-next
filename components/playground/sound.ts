/**
 * Sonidos del playground generados con Web Audio (sin archivos que descargar).
 * El AudioContext se crea recién en el primer toque, como piden los navegadores.
 */

export type Snack = 'medialuna' | 'tortita';

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

let muted = false;

/** Silencia todo (lo recuerda el botón de sonido de la UI). */
export function setMuted(on: boolean) {
  muted = on;
  if (on) {
    setPour('water', false);
    setPour('yerba', false);
  }
}

function audio() {
  if (typeof window === 'undefined' || muted) return null;
  if (!ctx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // Medio segundo de ruido blanco que se reutiliza en cada mordida
    noise = ctx.createBuffer(1, ctx.sampleRate / 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/**
 * Un "grano" de sonido: un pedacito de ruido muy corto filtrado. Muchos granos
 * juntos suenan a algo que se rompe en migas (y no a un golpe/aplauso).
 */
function grain(
  ac: AudioContext,
  out: AudioNode,
  at: number,
  freq: number,
  dur: number,
  gain: number
) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq;
  bp.Q.value = 3 + Math.random() * 3;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(gain, at + dur * 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(bp).connect(env).connect(out);
  src.start(at, Math.random() * 0.4, dur + 0.01);
}

/** Crujido: una nube de granos repartidos en `len` segundos. */
function crunch(
  ac: AudioContext,
  out: AudioNode,
  at: number,
  len: number,
  count: number,
  lo: number,
  hi: number,
  gain: number
) {
  for (let i = 0; i < count; i++) {
    // Más granos al principio (cuando se parte) y menos al final
    const t = at + Math.pow(Math.random(), 1.7) * len;
    grain(
      ac,
      out,
      t,
      lo + Math.random() * (hi - lo),
      0.006 + Math.random() * 0.018,
      gain * (0.4 + Math.random() * 0.6)
    );
  }
}

/** Sonido sordo de la boca/mandíbula: ruido grave con ataque suave (sin "clic"). */
function mouth(ac: AudioContext, out: AudioNode, at: number, dur: number, gain: number) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.5;
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 320 + Math.random() * 120;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.linearRampToValueAtTime(gain, at + dur * 0.35);
  env.gain.linearRampToValueAtTime(0.0001, at + dur);
  src.connect(lp).connect(env).connect(out);
  src.start(at, Math.random() * 0.3, dur + 0.02);
}

/**
 * Masticar: el mordisco (los dientes parten el bocado: crujido con la boca
 * abierta) y después varias masticadas con la boca cerrada, más apagadas.
 * La medialuna es hojaldrada (migas finitas); la tortita tiene la costra de
 * azúcar (crujido más grueso) y masa blanda debajo.
 */
export function playChew(kind: Snack) {
  const ac = audio();
  if (!ac || !noise) return;
  const t = ac.currentTime + 0.02;
  const flaky = kind === 'medialuna';

  const master = ac.createGain();
  master.gain.value = 0.9;
  master.connect(ac.destination);

  // Mordisco: boca abierta, más brillante
  const open = ac.createBiquadFilter();
  open.type = 'lowpass';
  open.frequency.value = flaky ? 6500 : 4500;
  open.connect(master);
  crunch(
    ac,
    open,
    t,
    flaky ? 0.16 : 0.13,
    flaky ? 46 : 30,
    flaky ? 1800 : 1100,
    flaky ? 6000 : 3800,
    0.16
  );
  mouth(ac, master, t + 0.02, 0.12, 0.08);

  // Masticadas: boca cerrada → todo pasa por un filtro grave
  const closed = ac.createBiquadFilter();
  closed.type = 'lowpass';
  closed.frequency.value = flaky ? 1700 : 1300;
  closed.Q.value = 0.7;
  closed.connect(master);
  const chews = 4 + Math.round(Math.random());
  let at = t + 0.38;
  for (let i = 0; i < chews; i++) {
    const fade = 1 - i * 0.17;
    mouth(ac, master, at, 0.16, 0.12 * fade);
    crunch(
      ac,
      closed,
      at + 0.03,
      0.1,
      Math.round((flaky ? 18 : 12) * fade),
      500,
      flaky ? 3000 : 2200,
      0.13 * fade
    );
    at += 0.25 + Math.random() * 0.07;
  }
}

// ─── Sonidos de la preparación ──────────────────────────────────────────────

type Pour = 'water' | 'yerba';
const pours: Partial<Record<Pour, { src: AudioBufferSourceNode; gain: GainNode }>> = {};

/**
 * Sonido continuo mientras se vuelca: el chorro de agua (ruido medio, redondo)
 * o la yerba cayendo (ruido agudo y seco). Se llama en cada frame con on/off.
 */
export function setPour(kind: Pour, on: boolean) {
  const cur = pours[kind];
  if (!on) {
    if (!cur) return;
    delete pours[kind];
    const t = cur.gain.context.currentTime;
    cur.gain.gain.cancelScheduledValues(t);
    cur.gain.gain.setTargetAtTime(0.0001, t, 0.05);
    cur.src.stop(t + 0.3);
    return;
  }
  if (cur) return;
  const ac = audio();
  if (!ac || !noise) return;
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const f1 = ac.createBiquadFilter();
  const f2 = ac.createBiquadFilter();
  if (kind === 'water') {
    f1.type = 'bandpass';
    f1.frequency.value = 1500;
    f1.Q.value = 0.9;
    f2.type = 'lowpass';
    f2.frequency.value = 3200;
  } else {
    f1.type = 'highpass';
    f1.frequency.value = 3800;
    f2.type = 'lowpass';
    f2.frequency.value = 9000;
  }
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, ac.currentTime);
  gain.gain.setTargetAtTime(kind === 'water' ? 0.11 : 0.05, ac.currentTime, 0.08);
  src.connect(f1).connect(f2).connect(gain).connect(ac.destination);
  src.start(ac.currentTime, Math.random() * 0.4);
  pours[kind] = { src, gain };
}

/** Campanita suave cuando un paso sale bien. */
export function playDing(good = true) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  const notes = good ? [784, 1175] : [392];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ac.createGain();
    const at = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.07, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 0.35);
    o.connect(g).connect(ac.destination);
    o.start(at);
    o.stop(at + 0.4);
  });
}

/** El "ruidito" del final del mate: aire y agua burbujeando por la bombilla. */
export function playSlurp() {
  const ac = audio();
  if (!ac || !noise) return;
  const t = ac.currentTime + 0.02;
  const dur = 0.95;
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.loop = true;
  const bp = ac.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = 2.2;
  bp.frequency.setValueAtTime(500, t);
  bp.frequency.linearRampToValueAtTime(1500, t + dur);
  // Gorgoteo: el volumen tiembla rápido
  const trem = ac.createGain();
  trem.gain.value = 0.5;
  const lfo = ac.createOscillator();
  lfo.type = 'square';
  lfo.frequency.setValueAtTime(22, t);
  lfo.frequency.linearRampToValueAtTime(34, t + dur);
  const depth = ac.createGain();
  depth.gain.value = 0.5;
  lfo.connect(depth).connect(trem.gain);
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(0.22, t + 0.12);
  env.gain.setValueAtTime(0.22, t + dur - 0.2);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(bp).connect(trem).connect(env).connect(ac.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
  lfo.start(t);
  lfo.stop(t + dur + 0.05);
}
