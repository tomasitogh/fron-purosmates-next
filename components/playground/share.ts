/**
 * Compartir el resultado del playground: texto + link con el puntaje (que arma
 * el desafío para quien lo abre) y una imagen lista para estados e historias.
 * No importa Three.js: recibe el lienzo ya dibujado por el motor.
 */

export const PLAYGROUND_URL = 'https://www.purosmates.com.ar/playground';

export type ScoreLine = { label: string; score: number };

export type ShareData = {
  score: number;
  title: string;
  lines: ScoreLine[];
  /** Equipo elegido, en una línea ("Imperial de algarrobo · Playadito"). */
  gear: string;
};

/** Link que abre el juego con el puntaje a superar. */
export function challengeUrl(score: number) {
  return `${PLAYGROUND_URL}?p=${score}`;
}

export function shareText(score: number) {
  return `Saqué ${score}/100 cebando un mate en 3D 🧉 ¿Me ganás?`;
}

export function whatsappUrl(score: number) {
  return `https://wa.me/?text=${encodeURIComponent(`${shareText(score)} ${challengeUrl(score)}`)}`;
}

/** Lee el puntaje a superar de `?p=` (entero 0–100) o devuelve null. */
export function parseChallenge(raw: string | string[] | undefined | null) {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !/^\d{1,3}$/.test(v)) return null;
  const n = Number(v);
  return n >= 0 && n <= 100 ? n : null;
}

const GREEN = '#254642';
const DARK = '#1c3632';
const GOLD = '#D4AF37';
const CREAM = '#F5F5DC';
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Arma la tarjeta (1080×1350, formato 4:5) con una foto de la mesa, el puntaje,
 * el desglose y el link. `scene` es el lienzo WebGL recién dibujado.
 */
export function buildShareCard(scene: HTMLCanvasElement, data: ShareData): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const PHOTO_H = 640;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return Promise.resolve(null);

  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, W, H);

  // Foto de la mesa: recorte "cover" corrido hacia abajo para que el mate quede arriba del círculo del puntaje
  const dstAspect = W / PHOTO_H;
  let sw = scene.width;
  let sh = sw / dstAspect;
  if (sh > scene.height) {
    sh = scene.height;
    sw = sh * dstAspect;
  }
  const sx = (scene.width - sw) / 2;
  const sy = Math.min(Math.max(scene.height * 0.55 - sh / 2, 0), scene.height - sh);
  ctx.drawImage(scene, sx, sy, sw, sh, 0, 0, W, PHOTO_H);
  const fade = ctx.createLinearGradient(0, PHOTO_H - 220, 0, PHOTO_H);
  fade.addColorStop(0, 'rgba(37,70,66,0)');
  fade.addColorStop(1, GREEN);
  ctx.fillStyle = fade;
  ctx.fillRect(0, PHOTO_H - 220, W, 220);

  // Marca arriba
  ctx.fillStyle = 'rgba(28,54,50,0.82)';
  roundRect(ctx, 40, 40, 330, 76, 38);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.font = `800 36px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🧉 Puros Mates', 72, 80);

  // Puntaje
  const cy = PHOTO_H + 10;
  ctx.beginPath();
  ctx.arc(W / 2, cy, 150, 0, Math.PI * 2);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = GREEN;
  ctx.stroke();
  ctx.fillStyle = DARK;
  ctx.textAlign = 'center';
  ctx.font = `900 150px ${FONT}`;
  ctx.fillText(String(data.score), W / 2, cy - 12);
  ctx.font = `800 38px ${FONT}`;
  ctx.fillText('/ 100', W / 2, cy + 86);

  // Título
  ctx.fillStyle = CREAM;
  ctx.font = `900 68px ${FONT}`;
  ctx.fillText(data.title, W / 2, cy + 232, W - 120);
  ctx.fillStyle = 'rgba(245,245,220,0.75)';
  ctx.font = `600 36px ${FONT}`;
  ctx.fillText(data.gear, W / 2, cy + 300, W - 120);

  // Desglose en una fila
  const n = data.lines.length;
  const colW = (W - 120) / n;
  data.lines.forEach((l, i) => {
    const x = 60 + colW * (i + 0.5);
    ctx.fillStyle = GOLD;
    ctx.font = `900 60px ${FONT}`;
    ctx.fillText(String(l.score), x, cy + 400);
    ctx.fillStyle = 'rgba(245,245,220,0.8)';
    ctx.font = `700 28px ${FONT}`;
    ctx.fillText(l.label, x, cy + 452, colW - 12);
  });

  // Desafío
  ctx.fillStyle = GOLD;
  roundRect(ctx, 60, H - 190, W - 120, 130, 36);
  ctx.fill();
  ctx.fillStyle = DARK;
  ctx.font = `900 50px ${FONT}`;
  ctx.fillText('¿Me ganás?', W / 2, H - 148);
  ctx.font = `700 36px ${FONT}`;
  ctx.fillText('purosmates.com.ar/playground', W / 2, H - 96);

  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.9));
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
