/**
 * Sonidos del playground generados con Web Audio (sin archivos que descargar).
 * El AudioContext se crea recién en el primer toque, como piden los navegadores.
 */

export type Snack = 'medialuna' | 'tortita';

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === 'undefined') return null;
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

/** Un golpe de ruido filtrado con envolvente corta: el "crunch". */
function burst(
  ac: AudioContext,
  at: number,
  {
    freq,
    q,
    dur,
    gain,
    type,
  }: { freq: number; q: number; dur: number; gain: number; type: BiquadFilterType }
) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  src.playbackRate.value = 0.8 + Math.random() * 0.4;
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const env = ac.createGain();
  env.gain.setValueAtTime(0.0001, at);
  env.gain.exponentialRampToValueAtTime(gain, at + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(env).connect(ac.destination);
  src.start(at, Math.random() * 0.3, dur + 0.02);
}

/**
 * Sonido de masticar: una mordida crocante y después 3–4 masticadas más suaves.
 * La medialuna suena más hojaldrada (agudo y con migas); la tortita, más
 * azucarada y grave.
 */
export function playChew(kind: Snack) {
  const ac = audio();
  if (!ac || !noise) return;
  const t = ac.currentTime + 0.02;
  const crisp = kind === 'medialuna';
  // Mordida
  burst(ac, t, { freq: crisp ? 2600 : 1700, q: 0.7, dur: 0.11, gain: 0.55, type: 'bandpass' });
  for (let k = 0; k < (crisp ? 6 : 4); k++) {
    burst(ac, t + 0.015 + Math.random() * 0.07, {
      freq: (crisp ? 4200 : 2800) + Math.random() * 1500,
      q: 2,
      dur: 0.025,
      gain: 0.18,
      type: 'bandpass',
    });
  }
  // Masticadas: un golpe grave de la boca + un crujido más chico cada vez
  const chews = 3 + Math.round(Math.random());
  for (let i = 0; i < chews; i++) {
    const at = t + 0.32 + i * (0.27 + Math.random() * 0.05);
    const fade = 1 - i * 0.2;
    burst(ac, at, { freq: 260, q: 0.9, dur: 0.12, gain: 0.32 * fade, type: 'lowpass' });
    burst(ac, at + 0.01, {
      freq: (crisp ? 2100 : 1400) + Math.random() * 500,
      q: 1.1,
      dur: 0.07,
      gain: 0.22 * fade,
      type: 'bandpass',
    });
  }
}
