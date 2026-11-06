/**
 * Modelos 3D del playground hechos 100 % por código (sin archivos que descargar):
 * paquetes de yerba con su etiqueta pintada en un <canvas> y mates hechos con
 * LatheGeometry (un perfil 2D que se gira 360°, como en un torno).
 */
import * as THREE from 'three';

import type { MateStyle, YerbaBrand } from './catalog';

// ─── Helpers compartidos ────────────────────────────────────────────────────

export function canvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void
) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Pseudo-aleatorio determinístico para que la escena se vea igual siempre. */
export function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function std(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
}

function grain(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  dark: string,
  seed: number,
  lines = 70,
  vertical = false
) {
  const r = rng(seed);
  for (let i = 0; i < lines; i++) {
    ctx.strokeStyle = dark;
    ctx.globalAlpha = 0.05 + r() * 0.18;
    ctx.lineWidth = 0.6 + r() * 2.2;
    ctx.beginPath();
    const o = r() * (vertical ? w : h);
    for (let t = 0; t <= (vertical ? h : w); t += 32) {
      const wob = Math.sin(t * 0.008 + i) * (2 + r() * 5);
      if (vertical) ctx.lineTo(o + wob, t);
      else ctx.lineTo(t, o + wob);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export function woodTexture(base: string, dark: string, planks = 1, seed = 7) {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const ph = h / planks;
    for (let p = 0; p < planks; p++) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, p * ph, w, ph);
      ctx.clip();
      ctx.translate(0, p * ph);
      grain(ctx, w, ph, dark, seed + p);
      ctx.restore();
      if (planks > 1) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = dark;
        ctx.fillRect(0, p * ph, w, 2);
        ctx.globalAlpha = 1;
      }
    }
  });
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, alpha = 0.08) {
  const r = rng(seed);
  for (let i = 0; i < (w * h) / 40; i++) {
    ctx.fillStyle = r() > 0.5 ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha * 0.7})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
}

function text(
  ctx: CanvasRenderingContext2D,
  str: string,
  x: number,
  y: number,
  font: string,
  fill: string,
  opts: { stroke?: string; strokeW?: number; align?: CanvasTextAlign; maxW?: number } = {}
) {
  ctx.font = font;
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = 'middle';
  if (opts.stroke) {
    ctx.lineJoin = 'round';
    ctx.strokeStyle = opts.stroke;
    ctx.lineWidth = opts.strokeW ?? 6;
    ctx.strokeText(str, x, y, opts.maxW);
  }
  ctx.fillStyle = fill;
  ctx.fillText(str, x, y, opts.maxW);
}

function leaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  rot: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.45, s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = Math.max(1, s * 0.05);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.lineTo(0, s);
  ctx.stroke();
  ctx.restore();
}

// ─── Yerbas ─────────────────────────────────────────────────────────────────

type PackDef = {
  /** 'bolsa': paquete blando con pliegue arriba. 'caja': estuche de cartón. */
  format: 'bolsa' | 'caja';
  w: number;
  h: number;
  d: number;
  top: string;
  front: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  side: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
};

const PACKS: Record<YerbaBrand, PackDef> = {
  donomar: {
    format: 'bolsa',
    w: 0.1,
    h: 0.2,
    d: 0.055,
    top: '#d51f26',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#d51f26';
      ctx.fillRect(0, 0, w, h);
      // Panel blanco con el logo
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(w * 0.08, h * 0.05, w * 0.84, h * 0.26, 40);
      ctx.fill();
      leaf(ctx, w * 0.42, h * 0.085, 16, -0.6, '#3c9a3a');
      leaf(ctx, w * 0.47, h * 0.085, 16, 0.6, '#3c9a3a');
      text(ctx, 'dón', w * 0.33, h * 0.14, 'bold 92px Georgia, serif', '#1b1b1b');
      text(ctx, 'YERBA MATE', w * 0.7, h * 0.125, 'bold 34px system-ui, sans-serif', '#2f8a34');
      text(ctx, 'omar', w * 0.5, h * 0.235, 'bold 150px Georgia, serif', '#d51f26');
      // Franja verde
      ctx.fillStyle = '#1f7a3a';
      ctx.fillRect(w * 0.1, h * 0.315, w * 0.8, h * 0.045);
      text(
        ctx,
        'ESTACIONAMIENTO NATURAL',
        w * 0.5,
        h * 0.338,
        'bold 30px system-ui, sans-serif',
        '#fff',
        {
          maxW: w * 0.76,
        }
      );
      // Medallón con guarda y el gaucho
      const cx = w * 0.5;
      const cy = h * 0.6;
      const R = w * 0.36;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        ctx.save();
        ctx.translate(cx + Math.cos(a) * R * 0.9, cy + Math.sin(a) * R * 0.9);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? '#111' : '#fff';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.restore();
      }
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.8, 0, Math.PI * 2);
      ctx.stroke();
      // Gaucho
      ctx.fillStyle = '#3a3a3a';
      ctx.beginPath();
      ctx.moveTo(cx - R * 0.55, cy + R * 0.55);
      ctx.quadraticCurveTo(cx, cy - R * 0.05, cx + R * 0.55, cy + R * 0.55);
      ctx.fill();
      ctx.fillStyle = '#d9d2c8';
      ctx.beginPath();
      ctx.arc(cx, cy - R * 0.12, R * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.ellipse(cx, cy - R * 0.3, R * 0.42, R * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - R * 0.2, cy - R * 0.55, R * 0.4, R * 0.27);
      ctx.fillStyle = '#7a1414';
      ctx.fillRect(cx - R * 0.12, cy + R * 0.06, R * 0.24, R * 0.08);
      // Pie
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(w * 0.2, h * 0.84, w * 0.6, h * 0.03);
      text(ctx, 'BAJO CONTENIDO DE POLVO', w * 0.5, h * 0.855, 'bold 20px system-ui', '#fff', {
        maxW: w * 0.56,
      });
      text(ctx, 'Peso Neto 500g', w * 0.5, h * 0.93, '22px system-ui', '#fff');
      noise(ctx, w, h, 4, 0.04);
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#c81c22';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 5, 0.05);
    },
  },

  taragui: {
    format: 'bolsa',
    w: 0.1,
    h: 0.2,
    d: 0.055,
    top: '#1e2f6e',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#1e2f6e';
      ctx.fillRect(0, 0, w, h);
      // Franja amarilla "SIN PALO"
      ctx.fillStyle = '#c8202a';
      ctx.fillRect(w * 0.2, 0, w * 0.26, h * 0.42);
      ctx.fillStyle = '#f5d000';
      ctx.fillRect(w * 0.215, 0, w * 0.23, h * 0.42);
      ctx.fillStyle = '#1e2f6e';
      ctx.beginPath();
      ctx.arc(w * 0.33, h * 0.24, 46, 0, Math.PI * 2);
      ctx.fill();
      leaf(ctx, w * 0.33, h * 0.24, 26, 0.4, '#4caf50');
      text(ctx, 'SIN PALO', w * 0.33, h * 0.35, 'bold 32px system-ui, sans-serif', '#1e2f6e');
      text(ctx, 'YERBA MATE', w * 0.74, h * 0.25, 'bold 36px system-ui, sans-serif', '#fff');
      text(ctx, 'ELABORADA DESPALADA', w * 0.74, h * 0.28, '18px system-ui', '#fff');
      // Banda blanca con bordes rojos
      const band = (y: number, hh: number, color: string) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, y + 20);
        ctx.quadraticCurveTo(w * 0.5, y - 20, w, y + 10);
        ctx.lineTo(w, y + hh + 10);
        ctx.quadraticCurveTo(w * 0.5, y + hh - 20, 0, y + hh + 20);
        ctx.fill();
      };
      band(h * 0.42, h * 0.27, '#c8202a');
      band(h * 0.43, h * 0.25, '#ffffff');
      // Mapa de Corrientes
      ctx.fillStyle = '#1f62c8';
      ctx.beginPath();
      const pts = [
        [0.18, 0.47],
        [0.38, 0.44],
        [0.55, 0.46],
        [0.8, 0.43],
        [0.86, 0.52],
        [0.78, 0.6],
        [0.65, 0.66],
        [0.56, 0.74],
        [0.5, 0.67],
        [0.3, 0.64],
        [0.16, 0.58],
      ];
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x * w, y * h) : ctx.moveTo(x * w, y * h)));
      ctx.closePath();
      ctx.fill();
      text(ctx, 'TARAGÜI', w * 0.5, h * 0.555, 'italic 900 104px Georgia, serif', '#ffffff', {
        stroke: '#1e2f6e',
        strokeW: 10,
        maxW: w * 0.9,
      });
      text(ctx, 'PESO NETO 500g', w * 0.26, h * 0.86, 'bold 22px system-ui', '#fff');
      ctx.fillStyle = '#c9a25a';
      ctx.fillRect(w * 0.6, h * 0.76, w * 0.3, h * 0.12);
      text(ctx, 'LAS MARÍAS', w * 0.75, h * 0.82, 'bold 20px Georgia, serif', '#4a3412');
      noise(ctx, w, h, 6, 0.04);
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#1a2a63';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 7, 0.05);
    },
  },

  lamerced: {
    format: 'caja',
    w: 0.1,
    h: 0.17,
    d: 0.065,
    top: '#3f7f34',
    front: (ctx, w, h) => {
      drawLeaves(ctx, w, h, 11);
      // Panel crema
      ctx.fillStyle = '#9b1c2c';
      ctx.fillRect(w * 0.12, h * 0.1, w * 0.76, h * 0.8);
      ctx.fillStyle = '#f4edd8';
      ctx.fillRect(w * 0.14, h * 0.115, w * 0.72, h * 0.77);
      text(ctx, 'YERBA MATE', w * 0.5, h * 0.16, '22px Georgia, serif', '#5a4630');
      // Casona
      ctx.strokeStyle = '#6b5640';
      ctx.lineWidth = 3;
      const hx = w * 0.3;
      const hy = h * 0.22;
      const hw = w * 0.4;
      const hh = h * 0.13;
      ctx.strokeRect(hx, hy + hh * 0.3, hw, hh * 0.7);
      ctx.beginPath();
      ctx.moveTo(hx - 10, hy + hh * 0.32);
      ctx.lineTo(hx + hw / 2, hy);
      ctx.lineTo(hx + hw + 10, hy + hh * 0.32);
      ctx.stroke();
      for (let i = 0; i < 5; i++)
        ctx.strokeRect(hx + 10 + i * (hw / 5.3), hy + hh * 0.5, hw / 9, hh * 0.3);
      ctx.fillStyle = 'rgba(70,110,60,0.6)';
      ctx.beginPath();
      ctx.arc(hx - 12, hy + hh * 0.6, 26, 0, Math.PI * 2);
      ctx.arc(hx + hw + 12, hy + hh * 0.55, 30, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'LA MERCED', w * 0.5, h * 0.43, 'bold 62px Georgia, serif', '#3a2a1a', {
        maxW: w * 0.68,
      });
      ctx.fillStyle = '#9b1c2c';
      ctx.fillRect(w * 0.14, h * 0.48, w * 0.72, h * 0.08);
      text(ctx, 'BARBACUÁ', w * 0.5, h * 0.52, 'bold 54px Georgia, serif', '#f4edd8', {
        maxW: w * 0.64,
      });
      text(ctx, 'Ahumada y robusta', w * 0.5, h * 0.61, 'italic 34px Georgia, serif', '#3a2a1a');
      ctx.fillStyle = '#e4dcc4';
      ctx.fillRect(w * 0.3, h * 0.66, w * 0.4, h * 0.02);
      text(ctx, 'COSECHA LIMITADA', w * 0.5, h * 0.74, 'bold 22px Georgia, serif', '#9b1c2c');
      text(ctx, 'LAS MARÍAS', w * 0.5, h * 0.83, '20px Georgia, serif', '#5a4630');
    },
    side: (ctx, w, h) => drawLeaves(ctx, w, h, 12),
  },

  playadito: {
    format: 'bolsa',
    w: 0.1,
    h: 0.2,
    d: 0.055,
    top: '#f4d000',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#f4d000';
      ctx.fillRect(0, 0, w, h);
      // Insignia Liebig
      ctx.fillStyle = '#1f6b3a';
      ctx.beginPath();
      ctx.roundRect(w * 0.3, h * 0.015, w * 0.4, h * 0.045, 14);
      ctx.fill();
      text(ctx, 'LIEBIG', w * 0.5, h * 0.038, 'bold 30px Georgia, serif', '#fff');
      // Panel crema con borde dorado
      ctx.fillStyle = '#c9a53a';
      ctx.fillRect(w * 0.12, h * 0.17, w * 0.76, h * 0.7);
      ctx.fillStyle = '#f7efbe';
      ctx.fillRect(w * 0.135, h * 0.178, w * 0.73, h * 0.684);
      // Cinta verde "YERBA MATE"
      ctx.fillStyle = '#1f6b3a';
      ctx.beginPath();
      ctx.moveTo(w * 0.16, h * 0.105);
      ctx.quadraticCurveTo(w * 0.5, h * 0.085, w * 0.84, h * 0.105);
      ctx.lineTo(w * 0.84, h * 0.15);
      ctx.quadraticCurveTo(w * 0.5, h * 0.13, w * 0.16, h * 0.15);
      ctx.fill();
      text(ctx, 'YERBA MATE', w * 0.5, h * 0.12, 'bold 40px Georgia, serif', '#fff');
      text(ctx, 'PLAYADITO', w * 0.5, h * 0.24, 'bold 92px Georgia, serif', '#c8201f', {
        stroke: '#ffffff',
        strokeW: 8,
        maxW: w * 0.7,
      });
      text(ctx, 'Elaborada con Palo', w * 0.5, h * 0.3, 'bold 30px Georgia, serif', '#1f6b3a');
      text(ctx, 'BAJO CONTENIDO DE POLVO', w * 0.5, h * 0.325, '18px Georgia, serif', '#1f6b3a');
      text(ctx, 'Desde 1926', w * 0.4, h * 0.42, 'italic 40px Georgia, serif', '#333');
      // Hoja-mapa
      const r = rng(21);
      for (let i = 0; i < 14; i++) {
        leaf(
          ctx,
          w * (0.28 + i * 0.035 + (r() - 0.5) * 0.04),
          h * (0.72 - i * 0.017 + (r() - 0.5) * 0.04),
          40 + r() * 30,
          r() * Math.PI,
          ['#2e7d32', '#3f8f3a', '#246b2a'][i % 3]
        );
      }
      ctx.fillStyle = '#c8201f';
      ctx.beginPath();
      ctx.moveTo(w * 0.6, h * 0.63);
      ctx.lineTo(w * 0.62, h * 0.66);
      ctx.lineTo(w * 0.58, h * 0.66);
      ctx.fill();
      text(ctx, 'PESO NETO', w * 0.22, h * 0.92, '18px Georgia, serif', '#333');
      text(ctx, '500g', w * 0.22, h * 0.95, 'bold 38px Georgia, serif', '#333');
      noise(ctx, w, h, 8, 0.03);
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#eec800';
      ctx.fillRect(0, 0, w, h);
      noise(ctx, w, h, 9, 0.04);
    },
  },

  baldo: {
    format: 'caja',
    w: 0.11,
    h: 0.18,
    d: 0.075,
    top: '#c8202a',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      // Hoja verde a la izquierda
      ctx.fillStyle = '#2f8a3c';
      ctx.fillRect(0, h * 0.1, w * 0.24, h * 0.62);
      leaf(ctx, w * 0.1, h * 0.35, 90, 0.4, '#3fa04a');
      leaf(ctx, w * 0.16, h * 0.55, 70, -0.5, '#358f40');
      stripes(ctx, w, 0, h * 0.1);
      // Bloque rojo inferior
      ctx.fillStyle = '#d4202a';
      ctx.fillRect(0, h * 0.72, w, h * 0.17);
      text(ctx, 'CONT.', w * 0.62, h * 0.765, 'bold 24px system-ui', '#fff', { align: 'right' });
      text(ctx, 'NETO', w * 0.62, h * 0.8, 'bold 24px system-ui', '#fff', { align: 'right' });
      text(ctx, '1kg', w * 0.65, h * 0.785, 'bold 70px system-ui', '#fff', { align: 'left' });
      stripes(ctx, w, h * 0.89, h * 0.11);
      text(ctx, 'YERBA MATE', w * 0.47, h * 0.17, 'bold 30px system-ui', '#222', { align: 'left' });
      text(
        ctx,
        'Baldo',
        w * 0.58,
        h * 0.39,
        'italic bold 150px "Brush Script MT", Georgia, cursive',
        '#1b3a8c',
        {
          stroke: '#d4202a',
          strokeW: 4,
          maxW: w * 0.72,
        }
      );
      // Escudito
      ctx.fillStyle = '#1b3a8c';
      ctx.beginPath();
      ctx.moveTo(w * 0.72, h * 0.5);
      ctx.lineTo(w * 0.86, h * 0.5);
      ctx.lineTo(w * 0.86, h * 0.56);
      ctx.lineTo(w * 0.79, h * 0.6);
      ctx.lineTo(w * 0.72, h * 0.56);
      ctx.fill();
      text(ctx, 'PROCEDENTE DE RESERVAS', w * 0.55, h * 0.66, '17px system-ui', '#222');
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#2f8a3c';
      ctx.fillRect(0, 0, w, h);
      stripes(ctx, w, 0, h * 0.1);
      ctx.fillStyle = '#d4202a';
      ctx.fillRect(0, h * 0.72, w, h * 0.17);
      stripes(ctx, w, h * 0.89, h * 0.11);
    },
  },
};

function drawLeaves(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  const r = rng(seed);
  ctx.fillStyle = '#3f7f34';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    leaf(
      ctx,
      r() * w,
      r() * h,
      50 + r() * 80,
      r() * Math.PI,
      ['#4f9a40', '#2f6a2a', '#5fae4c', '#3c8532'][i % 4]
    );
  }
}

function stripes(ctx: CanvasRenderingContext2D, w: number, y: number, hh: number) {
  const cols = ['#2f8a3c', '#d4202a', '#1b3a8c', '#d4202a', '#2f8a3c', '#ffffff'];
  const sh = hh / cols.length;
  cols.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(0, y + i * sh, w, sh);
  });
}

export function buildYerbaPack(brand: YerbaBrand) {
  const def = PACKS[brand];
  const { w, h, d } = def;
  const g = new THREE.Group();
  const front = std('#ffffff', {
    map: canvasTexture(512, Math.round((512 * h) / w), def.front),
    roughness: def.format === 'bolsa' ? 0.45 : 0.75,
  });
  const side = std('#ffffff', {
    map: canvasTexture(128, Math.round((512 * h) / w), def.side),
    roughness: def.format === 'bolsa' ? 0.45 : 0.75,
  });
  const top = std(def.top, { roughness: 0.7 });
  // Orden de materiales de BoxGeometry: +x, -x, +y, -y, +z (frente), -z (atrás)
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [
    side,
    side,
    top,
    top,
    front,
    front,
  ]);
  g.add(body);
  if (def.format === 'bolsa') {
    // Pliegue superior típico del paquete de yerba
    const fold = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.98, 0.018, d * 0.35).translate(0, h + 0.009, 0),
      top
    );
    g.add(fold);
  }
  return { group: g, mouth: new THREE.Vector3(w * 0.42, h + 0.01, 0), width: w };
}

// ─── Mates ──────────────────────────────────────────────────────────────────

type MateDef = {
  height: number;
  /** Radio exterior en función de t (0 = base, 1 = boca). */
  radius: (t: number) => number;
  body: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  bodyRough: number;
  inner: string;
  /** Banda de cuero en relieve: desde la base hasta `to` (0–1). */
  band?: { to: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void };
  /** Virola de alpaca: perfil [radio, y] + dibujo cincelado. */
  virola?: {
    points: [number, number][];
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
  };
  /** Labio superior (un toro fino) cuando no hay virola. */
  lip?: string;
};

const ALPACA = '#d8d6d0';

function chisel(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) {
  ctx.fillStyle = ALPACA;
  ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  ctx.strokeStyle = 'rgba(60,60,60,0.55)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 120; i++) {
    const x = r() * w;
    const y = h * 0.15 + r() * h * 0.7;
    ctx.beginPath();
    ctx.arc(x, y, 6 + r() * 14, r() * 6, r() * 6 + 2.5);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(40,40,40,0.5)';
  ctx.fillRect(0, h * 0.08, w, 3);
  ctx.fillRect(0, h * 0.9, w, 3);
}

function guarda(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = ALPACA;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2c2f2e';
  ctx.fillRect(0, h * 0.2, w, h * 0.6);
  // Guarda pampa escalonada
  ctx.fillStyle = '#c9c7c0';
  const step = w / 18;
  for (let i = 0; i < 18; i++) {
    const x = i * step;
    const y = h * 0.28;
    const s = h * 0.11;
    ctx.fillRect(x + step * 0.1, y, step * 0.25, s * 4);
    ctx.fillRect(x + step * 0.1, y + s * 1.5, step * 0.7, s);
    ctx.fillRect(x + step * 0.55, y, step * 0.25, s * 2);
    ctx.fillRect(x + step * 0.35, y + s * 3, step * 0.45, s);
  }
}

function leather(ctx: CanvasRenderingContext2D, w: number, h: number, base: string, seed: number) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  noise(ctx, w, h, seed, 0.06);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(0,0,0,0.25)');
  g.addColorStop(0.15, 'rgba(0,0,0,0)');
  g.addColorStop(0.85, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.3)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function gourd(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: string,
  spot: string,
  seed: number
) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);
  const r = rng(seed);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = spot;
    ctx.globalAlpha = 0.08 + r() * 0.18;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, 10 + r() * 40, 6 + r() * 25, r() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  noise(ctx, w, h, seed + 1, 0.05);
}

/** Dibuja algo en el frente (u≈0 y u≈1 del lathe miran a la cámara). */
function atFront(ctx: CanvasRenderingContext2D, w: number, fn: (x: number) => void) {
  fn(0);
  fn(w);
}

const MATES: Record<MateStyle, MateDef> = {
  mu: {
    height: 0.13,
    radius: (t) => {
      const k = Math.min(t / 0.88, 1);
      return (
        0.02 +
        0.037 * Math.pow(Math.sin((k * Math.PI) / 2), 0.75) -
        (t > 0.88 ? (t - 0.88) * 0.05 : 0)
      );
    },
    bodyRough: 0.6,
    inner: '#b9824c',
    lip: '#f4f1ea',
    body: (ctx, w, h) => {
      ctx.fillStyle = '#c38d55';
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, '#7a4a22', 31, 60, true);
      // Manchas de vaca y pintura que chorrea desde la boca
      ctx.fillStyle = '#f4f1ea';
      const r = rng(32);
      ctx.fillRect(0, 0, w, h * 0.05);
      for (let i = 0; i < 9; i++) {
        const x = r() * w;
        const dw = 30 + r() * 60;
        const dh = h * (0.08 + r() * 0.35);
        ctx.beginPath();
        ctx.moveTo(x - dw / 2, 0);
        ctx.lineTo(x + dw / 2, 0);
        ctx.quadraticCurveTo(x + dw * 0.4, dh * 0.8, x, dh);
        ctx.quadraticCurveTo(x - dw * 0.4, dh * 0.8, x - dw / 2, 0);
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const x = r() * w;
        const y = h * (0.45 + r() * 0.45);
        for (let k = 0; k < 6; k++) {
          ctx.ellipse(
            x + (r() - 0.5) * 60,
            y + (r() - 0.5) * 60,
            20 + r() * 35,
            15 + r() * 30,
            r() * 3,
            0,
            Math.PI * 2
          );
        }
        ctx.fill();
      }
      // Puntitos de pirograbado
      ctx.fillStyle = '#8a8f96';
      for (let i = 0; i < 26; i++) {
        ctx.beginPath();
        ctx.arc(r() * w, h * (0.15 + r() * 0.5), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },

  criollo: {
    height: 0.125,
    radius: (t) =>
      0.041 +
      0.003 * Math.sin(t * Math.PI * 1.2) -
      0.003 * Math.sin(t * Math.PI) +
      (t > 0.85 ? (t - 0.85) * 0.04 : 0),
    bodyRough: 0.45,
    inner: '#a06a3a',
    lip: '#6b3a1e',
    body: (ctx, w, h) => {
      gourd(ctx, w, h, '#5e2c16', '#2a1008', 41);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(120,60,30,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    band: {
      to: 0.5,
      draw: (ctx, w, h) => {
        leather(ctx, w, h, '#b8875a', 42);
        // Costura y monograma grabado
        ctx.strokeStyle = '#6e4a2a';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(0, h * 0.08);
        ctx.lineTo(w, h * 0.08);
        ctx.moveTo(0, h * 0.92);
        ctx.lineTo(w, h * 0.92);
        ctx.stroke();
        ctx.setLineDash([]);
        atFront(ctx, w, (x) => {
          ctx.strokeStyle = 'rgba(90,55,25,0.7)';
          ctx.lineWidth = 4;
          ctx.strokeRect(x - 70, h * 0.2, 140, h * 0.62);
          text(ctx, 'MG', x, h * 0.37, 'bold 56px Georgia, serif', 'rgba(90,55,25,0.75)');
          text(ctx, 'BC', x, h * 0.66, 'bold 56px Georgia, serif', 'rgba(90,55,25,0.75)');
        });
      },
    },
  },

  criolloPremium: {
    height: 0.14,
    radius: (t) =>
      0.038 +
      0.01 * Math.sin(Math.min(t / 0.5, 1) * (Math.PI / 2)) -
      (t > 0.55 ? (t - 0.55) * 0.016 : 0),
    bodyRough: 0.55,
    inner: '#b08048',
    body: (ctx, w, h) => gourd(ctx, w, h, '#c49a5c', '#7a5226', 51),
    band: {
      to: 0.45,
      draw: (ctx, w, h) => {
        leather(ctx, w, h, '#4a2a18', 52);
        // Lazo de cuero crudo en X
        atFront(ctx, w, (x) => {
          ctx.fillStyle = '#3a2012';
          ctx.fillRect(x - 26, 0, 52, h);
          ctx.strokeStyle = '#f2eee6';
          ctx.lineWidth = 7;
          for (let y = h * 0.06; y < h * 0.94; y += 34) {
            ctx.beginPath();
            ctx.moveTo(x - 18, y);
            ctx.lineTo(x + 18, y + 26);
            ctx.moveTo(x + 18, y);
            ctx.lineTo(x - 18, y + 26);
            ctx.stroke();
          }
        });
      },
    },
    virola: {
      points: [
        [0.0428, 0.126],
        [0.0448, 0.129],
        [0.0468, 0.135],
        [0.0468, 0.146],
        [0.0428, 0.149],
        [0.0385, 0.147],
      ],
      draw: (ctx, w, h) => chisel(ctx, w, h, 53),
    },
  },

  imperialAlgarrobo: {
    height: 0.12,
    radius: (t) =>
      0.03 +
      0.029 * Math.sin(Math.min(t / 0.5, 1) * (Math.PI / 2)) -
      (t > 0.5 ? (t - 0.5) * 0.03 : 0),
    bodyRough: 0.5,
    inner: '#b85a2a',
    body: (ctx, w, h) => {
      ctx.fillStyle = '#c4632e';
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, '#7a3416', 61, 80);
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,170,110,0.15)');
      g.addColorStop(1, 'rgba(60,20,5,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    virola: {
      points: [
        [0.0548, 0.082],
        [0.0488, 0.11],
        [0.0465, 0.12],
        [0.048, 0.124],
        [0.046, 0.13],
        [0.04, 0.129],
        [0.038, 0.124],
      ],
      draw: (ctx, w, h) => guarda(ctx, w, h),
    },
  },

  camionero: {
    height: 0.1,
    radius: (t) => 0.032 + 0.022 * Math.pow(t, 0.8),
    bodyRough: 0.7,
    inner: '#a8743f',
    body: (ctx, w, h) => leather(ctx, w, h, '#1d1b1a', 71),
    virola: {
      // Virola "volcada": ala ancha y doblada hacia afuera
      points: [
        [0.0535, 0.088],
        [0.0565, 0.1],
        [0.06, 0.106],
        [0.072, 0.11],
        [0.08, 0.112],
        [0.082, 0.108],
        [0.078, 0.106],
        [0.066, 0.104],
        [0.056, 0.1],
        [0.052, 0.098],
      ],
      draw: (ctx, w, h) => chisel(ctx, w, h, 72),
    },
  },
};

export function buildMateModel(style: MateStyle) {
  const def = MATES[style];
  const g = new THREE.Group();
  const N = 28;
  const H = def.height;
  const profile: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    profile.push(new THREE.Vector2(def.radius(t), t * H));
  }

  const bodyMat = std('#ffffff', {
    map: canvasTexture(1024, 512, def.body),
    roughness: def.bodyRough,
  });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 64), bodyMat));

  // Interior de calabaza/madera (se ve por la boca)
  const innerProfile = profile
    .slice(1)
    .map((p) => new THREE.Vector2(p.x * 0.9, Math.max(p.y, H * 0.05)));
  g.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(innerProfile, 48),
      std(def.inner, { roughness: 0.9, side: THREE.BackSide })
    )
  );

  if (def.band) {
    const n = Math.round(N * def.band.to);
    const bandProfile = profile.slice(1, n + 2).map((p) => new THREE.Vector2(p.x + 0.0022, p.y));
    g.add(
      new THREE.Mesh(
        new THREE.LatheGeometry(bandProfile, 64),
        std('#ffffff', { map: canvasTexture(1024, 256, def.band.draw), roughness: 0.75 })
      )
    );
  }

  let top = H;
  if (def.virola) {
    const pts = def.virola.points.map(([x, y]) => new THREE.Vector2(x, y));
    g.add(
      new THREE.Mesh(
        new THREE.LatheGeometry(pts, 64),
        std('#ffffff', {
          map: canvasTexture(1024, 128, def.virola.draw),
          metalness: 0.95,
          roughness: 0.28,
          side: THREE.DoubleSide,
        })
      )
    );
    top = Math.max(H, ...def.virola.points.map((p) => p[1]));
  } else if (def.lip) {
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius(1) * 0.95, 0.0025, 8, 64),
      std(def.lip, { roughness: 0.6 })
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = H;
    g.add(lip);
  }

  return { group: g, profile, top };
}
