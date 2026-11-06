/**
 * Modelos 3D del playground hechos 100 % por código (sin archivos que descargar):
 * paquetes de yerba con su etiqueta pintada en un <canvas> y mates hechos con
 * LatheGeometry (un perfil 2D que se gira 360°, como en un torno).
 */
import * as THREE from 'three';

import type { BombillaStyle, MateStyle, TermoStyle, YerbaBrand } from './catalog';

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
  cosmico: {
    format: 'caja',
    w: 0.1,
    h: 0.2,
    d: 0.065,
    top: '#efe8d8',
    front: (ctx, w, h) => {
      const G = '#2f5a3c';
      ctx.fillStyle = '#f1ebdd';
      ctx.fillRect(0, 0, w, h);
      // Filete superior punteado con el emblema
      ctx.fillStyle = G;
      ctx.fillRect(0, h * 0.085, w, 3);
      ctx.fillRect(0, h * 0.11, w, 3);
      const r = rng(101);
      for (let i = 0; i < 260; i++) {
        ctx.fillRect(r() * w * 0.3, h * 0.09 + r() * h * 0.018, 2, 2);
        ctx.fillRect(w * 0.7 + r() * w * 0.3, h * 0.09 + r() * h * 0.018, 2, 2);
      }
      ctx.fillStyle = '#f1ebdd';
      ctx.fillRect(w * 0.42, h * 0.075, w * 0.16, h * 0.045);
      ctx.strokeStyle = G;
      ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.43, h * 0.078, w * 0.14, h * 0.04);
      // "YERBA MATE" en arco
      ctx.save();
      ctx.translate(w * 0.5, h * 0.52);
      const word = 'YERBA MATE';
      for (let i = 0; i < word.length; i++) {
        ctx.save();
        ctx.rotate(-0.55 + (i / (word.length - 1)) * 1.1);
        text(ctx, word[i], 0, -h * 0.21, 'bold 44px Georgia, serif', G);
        ctx.restore();
      }
      ctx.restore();
      // Emblema circular con la C y el árbol
      ctx.strokeStyle = G;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(w * 0.5, h * 0.4, 44, 56, 0, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, 'C', w * 0.5, h * 0.41, 'bold 56px Georgia, serif', G);
      leaf(ctx, w * 0.47, h * 0.37, 12, -0.5, G);
      leaf(ctx, w * 0.53, h * 0.37, 12, 0.5, G);
      text(ctx, 'Selección', w * 0.2, h * 0.42, 'italic 30px Georgia, serif', G);
      text(ctx, 'Especial', w * 0.8, h * 0.42, 'italic 30px Georgia, serif', G);
      text(ctx, 'CÓSMICO', w * 0.5, h * 0.53, 'bold 108px Georgia, serif', G, { maxW: w * 0.9 });
      text(ctx, 'ELABORADA CON PALO', w * 0.5, h * 0.6, '34px Georgia, serif', G);
      // Sellos inferiores
      ctx.beginPath();
      ctx.arc(w * 0.18, h * 0.86, 44, 0, Math.PI * 2);
      ctx.stroke();
      text(ctx, '500G', w * 0.18, h * 0.865, 'bold 28px Georgia, serif', G);
      text(ctx, 'INDUSTRIA', w * 0.5, h * 0.85, '18px system-ui', G);
      text(ctx, 'Argentina', w * 0.5, h * 0.875, 'italic 28px Georgia, serif', G);
      ctx.save();
      ctx.translate(w * 0.82, h * 0.86);
      ctx.rotate(Math.PI / 4);
      ctx.strokeRect(-34, -34, 68, 68);
      ctx.restore();
      text(ctx, 'SUAVE', w * 0.82, h * 0.86, 'bold 20px system-ui', G);
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#ebe4d4';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f5a3c';
      ctx.fillRect(0, h * 0.085, w, 3);
      ctx.fillRect(0, h * 0.11, w, 3);
    },
  },

  cbse: {
    format: 'bolsa',
    w: 0.11,
    h: 0.19,
    d: 0.07,
    top: '#ffffff',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      // Rayos de sol grises
      ctx.strokeStyle = 'rgba(150,150,150,0.35)';
      ctx.lineWidth = 6;
      for (let i = 0; i < 24; i++) {
        const a = (i / 24) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(w * 0.5 + Math.cos(a) * w * 0.4, h * 0.48 + Math.sin(a) * w * 0.4);
        ctx.lineTo(w * 0.5 + Math.cos(a) * w * 0.75, h * 0.48 + Math.sin(a) * w * 0.75);
        ctx.stroke();
      }
      // Hojas en las esquinas
      const r = rng(111);
      for (let i = 0; i < 16; i++) {
        const corner = i % 4;
        const cx = corner % 2 ? w * (0.85 + r() * 0.2) : w * (r() * 0.2 - 0.05);
        const cy = corner < 2 ? h * (r() * 0.15) : h * (0.85 + r() * 0.15);
        leaf(ctx, cx, cy, 50 + r() * 50, r() * Math.PI, ['#7cc04a', '#5fae3a', '#9fd36a'][i % 3]);
      }
      // Silueta de mate con bombilla
      ctx.strokeStyle = '#2f8a34';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(w * 0.36, h * 0.3);
      ctx.bezierCurveTo(w * 0.05, h * 0.36, w * 0.05, h * 0.68, w * 0.5, h * 0.7);
      ctx.bezierCurveTo(w * 0.95, h * 0.68, w * 0.95, h * 0.36, w * 0.64, h * 0.3);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w * 0.55, h * 0.31);
      ctx.lineTo(w * 0.66, h * 0.12);
      ctx.stroke();
      text(ctx, 'Yerba Mate', w * 0.5, h * 0.39, 'italic bold 44px Georgia, serif', '#d4202a');
      text(ctx, 'CBSé', w * 0.5, h * 0.48, '900 124px system-ui, sans-serif', '#d4202a', {
        stroke: '#ffffff',
        strokeW: 8,
      });
      text(ctx, 'HIERBAS', w * 0.5, h * 0.56, 'bold 40px system-ui', '#2f8a34');
      text(ctx, 'SERRANAS', w * 0.5, h * 0.6, 'bold 40px system-ui', '#2f8a34');
      // Franja "REÚNE lo BUENO"
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(w * 0.18, h * 0.735, w * 0.64, h * 0.05);
      text(ctx, 'REÚNE lo BUENO', w * 0.5, h * 0.76, 'bold 34px system-ui', '#fff');
      // "LIBRE de ACIDEZ"
      ctx.fillStyle = '#2f8a34';
      ctx.beginPath();
      ctx.arc(w * 0.17, h * 0.1, 56, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'LIBRE de', w * 0.17, h * 0.09, 'bold 20px system-ui', '#fff');
      text(ctx, 'ACIDEZ', w * 0.17, h * 0.11, 'bold 24px system-ui', '#fff');
      text(ctx, 'PESO NETO 1kg', w * 0.5, h * 0.83, 'bold 26px system-ui', '#333');
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.1, h * 0.1, w * 0.8, h * 0.8);
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(w * 0.14, h * 0.14, w * 0.72, h * 0.72);
    },
  },

  pipore: {
    format: 'bolsa',
    w: 0.1,
    h: 0.2,
    d: 0.055,
    top: '#4caf3c',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#4caf3c';
      ctx.fillRect(0, 0, w, h);
      // Hojas en trazo arriba y franja inferior más oscura
      ctx.strokeStyle = 'rgba(20,80,20,0.45)';
      ctx.lineWidth = 3;
      const r = rng(121);
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.ellipse(r() * w, h * (0.03 + r() * 0.1), 40 + r() * 30, 18, r() * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        ctx.ellipse(r() * w, h * (0.76 + r() * 0.22), 40 + r() * 30, 18, r() * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = '#d8e86a';
      for (const y of [0.155, 0.165, 0.7, 0.71]) ctx.fillRect(0, h * y, w, 4);
      text(
        ctx,
        'YERBA MATE ELABORADA CON PALO COMPUESTA',
        w * 0.5,
        h * 0.18,
        'bold 17px system-ui',
        '#fff',
        { maxW: w * 0.92 }
      );
      text(
        ctx,
        'POLEO • PEPERINA • MENTA • CEDRÓN',
        w * 0.5,
        h * 0.195,
        'bold 17px system-ui',
        '#fff'
      );
      text(ctx, 'YERBA MATE', w * 0.56, h * 0.26, 'bold 36px system-ui', '#1f4f1f');
      text(ctx, 'Piporé', w * 0.48, h * 0.335, 'bold 120px Georgia, serif', '#ffffff', {
        stroke: '#1f4f1f',
        strokeW: 10,
        maxW: w * 0.86,
      });
      // Rombo amarillo con el mapa rojo y la plantita
      ctx.save();
      ctx.translate(w * 0.5, h * 0.48);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#f5d000';
      ctx.fillRect(-62, -62, 124, 124);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(-62, -62, 124, 124);
      ctx.restore();
      ctx.fillStyle = '#d4202a';
      ctx.beginPath();
      ctx.ellipse(w * 0.53, h * 0.5, 48, 18, -0.6, 0, Math.PI * 2);
      ctx.fill();
      leaf(ctx, w * 0.46, h * 0.46, 18, -0.4, '#1f4f1f');
      leaf(ctx, w * 0.51, h * 0.455, 18, 0.4, '#1f4f1f');
      for (let i = 0; i < 7; i++)
        leaf(ctx, w * (0.38 + i * 0.04), h * 0.6, 22, r() * 3, ['#2e7d32', '#66bb6a'][i % 2]);
      // Cinta "HIERBAS SERRANAS"
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(w * 0.12, h * 0.63, w * 0.76, h * 0.045, 20);
      ctx.fill();
      text(ctx, 'HIERBAS SERRANAS', w * 0.5, h * 0.653, 'bold 38px system-ui', '#2f8a34', {
        maxW: w * 0.7,
      });
      text(ctx, 'INDUSTRIA ARGENTINA', w * 0.26, h * 0.85, 'bold 18px system-ui', '#fff');
      text(ctx, 'PESO NETO 500g', w * 0.74, h * 0.85, 'bold 22px system-ui', '#fff');
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#46a537';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#2f8a34';
      ctx.fillRect(0, h * 0.72, w, h * 0.28);
    },
  },

  rosamonte: {
    format: 'caja',
    w: 0.11,
    h: 0.19,
    d: 0.075,
    top: '#d8231d',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#e0251f';
      ctx.fillRect(0, 0, w, h);
      // Franja negra a la derecha
      ctx.fillStyle = '#141414';
      ctx.fillRect(w * 0.72, 0, w * 0.28, h);
      // Rama de yerba a la izquierda
      ctx.strokeStyle = '#3d6b2a';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(w * 0.12, h * 0.62);
      ctx.quadraticCurveTo(w * 0.16, h * 0.4, w * 0.12, h * 0.2);
      ctx.stroke();
      const r = rng(131);
      for (let i = 0; i < 9; i++) {
        const y = h * (0.22 + i * 0.045);
        leaf(
          ctx,
          w * (0.08 + (i % 2) * 0.1),
          y,
          34 + r() * 12,
          (i % 2 ? 0.9 : -0.9) + (r() - 0.5) * 0.3,
          ['#3f8f3a', '#2e7d32', '#58a845'][i % 3]
        );
      }
      text(ctx, 'YERBA MATE', w * 0.44, h * 0.22, 'bold 40px system-ui', '#f5d000');
      text(ctx, 'ELABORADA CON PALO', w * 0.44, h * 0.25, '18px system-ui', '#fff');
      text(ctx, 'LIBRE DE GLUTEN', w * 0.44, h * 0.27, '18px system-ui', '#fff');
      // Rosa con hojitas y ornamento dorado
      ctx.fillStyle = '#c2185b';
      for (let k = 0; k < 6; k++) {
        ctx.beginPath();
        ctx.arc(w * 0.44 + Math.cos(k) * 12, h * 0.4 + Math.sin(k) * 12, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ff5c8a';
      ctx.beginPath();
      ctx.arc(w * 0.44, h * 0.4, 12, 0, Math.PI * 2);
      ctx.fill();
      leaf(ctx, w * 0.36, h * 0.44, 16, 1.2, '#2e7d32');
      leaf(ctx, w * 0.52, h * 0.44, 16, -1.2, '#2e7d32');
      ctx.strokeStyle = '#e8b931';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(w * 0.26, h * 0.47);
      ctx.quadraticCurveTo(w * 0.44, h * 0.43, w * 0.62, h * 0.47);
      ctx.stroke();
      text(
        ctx,
        'ROSAMONTE',
        w * 0.44,
        h * 0.54,
        'bold 96px Impact, "Arial Narrow", system-ui',
        '#ffffff',
        { maxW: w * 0.62 }
      );
      ctx.beginPath();
      ctx.moveTo(w * 0.3, h * 0.62);
      ctx.quadraticCurveTo(w * 0.44, h * 0.6, w * 0.58, h * 0.62);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(w * 0.05, h * 0.86, w * 0.62, 3);
      text(ctx, 'INDUSTRIA ARGENTINA', w * 0.2, h * 0.88, 'bold 16px system-ui', '#fff');
      text(ctx, 'PESO NETO 1Kg', w * 0.55, h * 0.88, 'bold 18px system-ui', '#fff');
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#141414';
      ctx.fillRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w * 0.5, h * 0.55);
      ctx.rotate(-Math.PI / 2);
      text(ctx, 'ROSAMONTE', 0, 0, 'bold 70px Impact, "Arial Narrow", system-ui', '#fff');
      ctx.restore();
    },
  },

  kalena: {
    format: 'bolsa',
    w: 0.1,
    h: 0.19,
    d: 0.06,
    top: '#5f7f5a',
    front: (ctx, w, h) => {
      ctx.fillStyle = '#3d9be0';
      ctx.fillRect(0, 0, w, h);
      const r = rng(141);
      for (let i = 0; i < 20; i++)
        leaf(ctx, r() * w, r() * h, 50 + r() * 60, r() * Math.PI, 'rgba(160,215,250,0.35)');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h * 0.02, 6, h);
      ctx.fillRect(w - 6, h * 0.02, 6, h);
      text(ctx, 'YERBA MATE', w * 0.5, h * 0.17, 'bold 46px system-ui', '#ffffff', {
        stroke: '#1f5fa8',
        strokeW: 4,
      });
      text(ctx, 'ELABORADA DESPALADA', w * 0.5, h * 0.21, 'bold 24px system-ui', '#1f4f8a');
      // Logo circular
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.4, w * 0.27, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1f5fa8';
      ctx.lineWidth = 6;
      ctx.stroke();
      leaf(ctx, w * 0.4, h * 0.38, 46, -0.6, '#2e8b3a');
      ctx.fillStyle = '#d4202a';
      for (let k = 0; k < 9; k++) {
        ctx.beginPath();
        ctx.arc(
          w * (0.58 + (k % 3) * 0.04),
          h * (0.33 + Math.floor(k / 3) * 0.022),
          9,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
      text(ctx, 'K', w * 0.53, h * 0.43, 'bold 90px Georgia, serif', '#2e8b3a');
      text(ctx, 'KALENA', w * 0.5, h * 0.58, 'bold 92px system-ui, sans-serif', '#ffffff', {
        stroke: '#1f5fa8',
        strokeW: 6,
        maxW: w * 0.86,
      });
      text(ctx, 'ENVASADA EN ORIGEN', w * 0.5, h * 0.63, 'bold 30px system-ui', '#fff');
      text(
        ctx,
        'Estacionamiento Natural',
        w * 0.5,
        h * 0.665,
        'italic 24px Georgia, serif',
        '#e8f4ff'
      );
      text(ctx, '500 g', w * 0.3, h * 0.76, 'bold 30px system-ui', '#fff');
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#3591d6';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 4, h);
      ctx.fillRect(w - 4, 0, 4, h);
    },
  },
  solylluvia: {
    format: 'bolsa',
    w: 0.1,
    h: 0.2,
    d: 0.055,
    top: '#8f94d8',
    front: (ctx, w, h) => {
      // Franja lila superior
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.25);
      g.addColorStop(0, '#a3a6e6');
      g.addColorStop(1, '#7f86cf');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h * 0.25);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, h * 0.25, w, h * 0.55);
      ctx.fillStyle = '#2b3a8c';
      ctx.fillRect(0, h * 0.25, w, 8);
      // Sol naciente con rayos
      ctx.fillStyle = '#f5c400';
      for (let i = 0; i < 9; i++) {
        const a0 = -Math.PI * 0.05 - (i / 9) * Math.PI * 0.55;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, h * 0.66);
        ctx.lineTo(w * 0.15 + Math.cos(a0) * w * 1.2, h * 0.66 + Math.sin(a0) * w * 1.2);
        ctx.lineTo(
          w * 0.15 + Math.cos(a0 - 0.12) * w * 1.2,
          h * 0.66 + Math.sin(a0 - 0.12) * w * 1.2
        );
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(w * 0.15, h * 0.66, w * 0.16, 0, Math.PI * 2);
      ctx.fill();
      // Lomas verdes
      ctx.fillStyle = '#3f9a3a';
      ctx.beginPath();
      ctx.moveTo(0, h * 0.66);
      ctx.quadraticCurveTo(w * 0.5, h * 0.6, w, h * 0.64);
      ctx.lineTo(w, h * 0.8);
      ctx.lineTo(0, h * 0.8);
      ctx.fill();
      // Nube azul
      ctx.fillStyle = '#4c8fd6';
      for (const [cx, cy, r] of [
        [0.66, 0.52, 40],
        [0.76, 0.5, 48],
        [0.86, 0.53, 36],
        [0.72, 0.555, 34],
      ]) {
        ctx.beginPath();
        ctx.arc(w * cx, h * cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      const ribbon = (y: number, hh: number) => {
        ctx.fillStyle = '#c8202a';
        ctx.beginPath();
        ctx.moveTo(w * 0.06, y + hh * 0.2);
        ctx.quadraticCurveTo(w * 0.5, y - hh * 0.3, w * 0.94, y + hh * 0.2);
        ctx.lineTo(w * 0.94, y + hh * 1.1);
        ctx.quadraticCurveTo(w * 0.5, y + hh * 0.6, w * 0.06, y + hh * 1.1);
        ctx.fill();
      };
      ribbon(h * 0.27, h * 0.06);
      text(ctx, 'YERBA MATE', w * 0.5, h * 0.302, 'bold 40px system-ui', '#fff');
      text(ctx, 'Barbacuá', w * 0.36, h * 0.37, 'italic bold 36px Georgia, serif', '#2b3a8c');
      text(
        ctx,
        'Sol y Lluvia',
        w * 0.5,
        h * 0.44,
        'italic bold 86px "Brush Script MT", Georgia, cursive',
        '#d4202a',
        {
          stroke: '#2b3a8c',
          strokeW: 6,
          maxW: w * 0.92,
        }
      );
      ribbon(h * 0.68, h * 0.07);
      text(ctx, 'YERBA MATE ELABORADA CON PALO', w * 0.5, h * 0.71, 'bold 18px system-ui', '#fff', {
        maxW: w * 0.8,
      });
      text(ctx, 'ESTACIONAMIENTO NATURAL', w * 0.5, h * 0.733, 'bold 22px system-ui', '#fff', {
        maxW: w * 0.8,
      });
      ctx.fillStyle = '#2b3a8c';
      ctx.fillRect(0, h * 0.8, w, h * 0.13);
      text(ctx, 'PESO NETO 500g', w * 0.5, h * 0.85, 'bold 40px system-ui', '#fff');
      text(ctx, 'INDUSTRIA ARGENTINA', w * 0.5, h * 0.895, 'bold 22px system-ui', '#fff');
      ctx.fillStyle = '#d4202a';
      ctx.fillRect(0, h * 0.93, w, h * 0.07);
    },
    side: (ctx, w, h) => {
      ctx.fillStyle = '#f5c400';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#8f94d8';
      ctx.fillRect(0, 0, w, h * 0.25);
      ctx.fillStyle = '#2b3a8c';
      ctx.fillRect(0, h * 0.8, w, h * 0.13);
      ctx.fillStyle = '#d4202a';
      ctx.fillRect(0, h * 0.93, w, h * 0.07);
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
  /** Tres patitas de cuero en la base (camionero clásico). */
  feet?: string;
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
  torpedoCriollo: {
    height: 0.135,
    radius: (t) =>
      0.04 +
      0.006 * Math.sin(Math.min(t / 0.55, 1) * (Math.PI / 2)) -
      (t > 0.6 ? (t - 0.6) * 0.012 : 0),
    bodyRough: 0.55,
    inner: '#b08048',
    body: (ctx, w, h) => gourd(ctx, w, h, '#b57a42', '#6a4020', 151),
    band: {
      to: 0.42,
      draw: (ctx, w, h) => {
        leather(ctx, w, h, '#c99c6a', 152);
        // Trenzado de tiento blanco arriba y abajo
        ctx.strokeStyle = '#f4efe4';
        ctx.lineWidth = 5;
        for (const y of [h * 0.1, h * 0.9]) {
          for (let x = 0; x < w; x += 22) {
            ctx.beginPath();
            ctx.moveTo(x, y - 12);
            ctx.lineTo(x + 16, y + 12);
            ctx.moveTo(x + 16, y - 12);
            ctx.lineTo(x, y + 12);
            ctx.stroke();
          }
        }
      },
    },
    virola: {
      points: [
        [0.0458, 0.098],
        [0.0468, 0.105],
        [0.0475, 0.125],
        [0.0455, 0.135],
        [0.041, 0.137],
        [0.0395, 0.134],
      ],
      draw: (ctx, w, h) => {
        chisel(ctx, w, h, 153);
        // Rombos repujados
        ctx.strokeStyle = 'rgba(50,50,50,0.6)';
        ctx.lineWidth = 3;
        for (let x = 20; x < w; x += 64) {
          ctx.beginPath();
          ctx.moveTo(x, h * 0.25);
          ctx.lineTo(x + 18, h * 0.5);
          ctx.lineTo(x, h * 0.75);
          ctx.lineTo(x - 18, h * 0.5);
          ctx.closePath();
          ctx.stroke();
        }
      },
    },
  },

  camioneroClasico: {
    height: 0.115,
    radius: (t) => 0.034 + 0.022 * Math.sin(Math.min(t / 0.7, 1) * (Math.PI / 2)),
    bodyRough: 0.6,
    inner: '#a8743f',
    feet: '#2b2321',
    body: (ctx, w, h) => {
      leather(ctx, w, h, '#2b2321', 161);
      // Costuras verticales del cuero
      ctx.strokeStyle = 'rgba(200,190,175,0.7)';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 10]);
      for (const u of [0.17, 0.5, 0.83]) {
        ctx.beginPath();
        ctx.moveTo(w * u, h * 0.12);
        ctx.lineTo(w * u, h);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    },
    virola: {
      points: [
        [0.0555, 0.1],
        [0.059, 0.104],
        [0.0605, 0.118],
        [0.057, 0.121],
        [0.053, 0.12],
      ],
      draw: (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#f2f2ee');
        g.addColorStop(0.5, '#cfcdc6');
        g.addColorStop(1, '#e8e6e0');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      },
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

  if (def.feet) {
    const footMat = std(def.feet, { roughness: 0.6 });
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), footMat);
      foot.scale.set(1.1, 0.7, 1.1);
      foot.position.set(Math.sin(a) * 0.03, 0.007, Math.cos(a) * 0.03);
      g.add(foot);
    }
  }

  return { group: g, profile, top };
}

// ─── Bombillas ──────────────────────────────────────────────────────────────
// El origen (0,0,0) es la punta del filtro: así el motor la "clava" en la yerba.

function holesTexture(base: string) {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(30,30,30,0.85)';
    for (let y = 14; y < h; y += 16) {
      for (let x = 10 + ((y / 16) % 2) * 8; x < w; x += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function knurlTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c9ccd0';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,40,40,0.55)';
    ctx.lineWidth = 2;
    for (let i = -h; i < w + h; i += 9) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h, h);
      ctx.moveTo(i + h, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
  });
}

/** Filtro tipo "paleta" (cuchara plana con agujeritos). */
function paleta(metal: THREE.Material, holes: THREE.Material, r: number, tilt = 0) {
  const g = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 14), metal);
  shell.scale.set(1.25, 1.7, 0.42);
  const face = new THREE.Mesh(new THREE.CircleGeometry(r * 0.92, 24), holes);
  face.scale.set(1.25, 1.7, 1);
  face.position.z = r * 0.43;
  const back = face.clone();
  back.rotation.y = Math.PI;
  back.position.z = -r * 0.43;
  g.add(shell, face, back);
  g.position.y = r * 1.7;
  g.rotation.x = tilt;
  return g;
}

export function buildBombillaModel(style: BombillaStyle) {
  const g = new THREE.Group();
  const alpaca = std('#d9d6cf', { metalness: 0.95, roughness: 0.22 });
  const inox = std('#c7cbcf', { metalness: 1, roughness: 0.18 });
  const gold = std('#d2b056', { metalness: 1, roughness: 0.25 });

  if (style === 'bombillon') {
    // Bombillón de alpaca: caño grueso torneado en espiral y boquilla dorada ancha
    g.add(
      paleta(
        alpaca,
        std('#ffffff', {
          map: holesTexture('#d9d6cf'),
          metalness: 0.9,
          roughness: 0.3,
          side: THREE.DoubleSide,
        }),
        0.012
      )
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.0042, 0.0042, 0.2, 14).translate(0, 0.13, 0),
        alpaca
      )
    );
    for (let k = 0; k < 3; k++) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 80; i++) {
        const t = i / 80;
        const a = t * Math.PI * 2 * 7 + (k * Math.PI * 2) / 3;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.0047, 0.06 + t * 0.12, Math.sin(a) * 0.0047));
      }
      g.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0016, 6),
          alpaca
        )
      );
    }
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0062, 0.0062, 0.008, 16).translate(0, 0.19, 0),
      gold
    );
    const mouth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0055, 0.045, 16).translate(0, 0.217, 0),
      gold
    );
    mouth.scale.z = 0.4;
    g.add(collar, mouth);
  } else if (style === 'inoxCurva') {
    // Acero inoxidable: curva arriba, zona de agarre moleteada y filtro de paleta
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.03, 0),
      new THREE.Vector3(0, 0.18, 0),
      new THREE.Vector3(0.006, 0.215, 0),
      new THREE.Vector3(0.026, 0.25, 0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0034, 10), inox));
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.0043, 0.0043, 0.075, 16).translate(0, 0.095, 0),
        std('#ffffff', { map: knurlTexture(), metalness: 0.9, roughness: 0.4 })
      )
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.0046, 0.0046, 0.004, 16).translate(0, 0.135, 0),
        std('#3a3d40', { metalness: 0.8, roughness: 0.4 })
      )
    );
    g.add(
      paleta(
        inox,
        std('#ffffff', {
          map: holesTexture('#c7cbcf'),
          metalness: 0.9,
          roughness: 0.3,
          side: THREE.DoubleSide,
        }),
        0.0105,
        0.25
      )
    );
  } else if (style === 'chata') {
    // Chata: caño aplanado de acero con anillo dorado y ranuras abajo
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, 0.24, 16).translate(0, 0.12, 0),
      inox
    );
    tube.scale.set(1.5, 1, 0.45);
    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0049, 0.0049, 0.012, 16).translate(0, 0.13, 0),
      gold
    );
    ring.scale.set(1.5, 1, 0.5);
    g.add(tube, ring);
    const slot = std('#2a2c2e', { roughness: 0.6 });
    for (let k = 0; k < 4; k++) {
      for (const z of [-0.0021, 0.0021]) {
        const sl = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.006, 0.0004), slot);
        sl.position.set(0, 0.008 + k * 0.008, z);
        g.add(sl);
      }
    }
  } else if (style === 'bohr') {
    // Bohr: acero, curva suave, boquilla aplanada con dos anillos y filtro redondo
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.03, 0),
      new THREE.Vector3(0, 0.17, 0),
      new THREE.Vector3(0.004, 0.205, 0),
      new THREE.Vector3(0.018, 0.235, 0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.0034, 10), inox));
    const dark = std('#3a3d40', { metalness: 0.8, roughness: 0.4 });
    for (const y of [0.15, 0.158]) {
      g.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.0041, 0.0041, 0.0025, 16).translate(0, y, 0),
          dark
        )
      );
    }
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.004, 0.022, 14), inox);
    mouth.position.set(0.02, 0.242, 0);
    mouth.rotation.z = -0.9;
    mouth.scale.z = 0.45;
    g.add(mouth);
    g.add(
      paleta(
        inox,
        std('#ffffff', {
          map: holesTexture('#c7cbcf'),
          metalness: 0.9,
          roughness: 0.3,
          side: THREE.DoubleSide,
        }),
        0.0125,
        0.15
      )
    );
  } else {
    // Dos bochas: caño recto con dos esferas, boquilla plana y filtro redondo grande
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.0034, 0.0034, 0.2, 12).translate(0, 0.13, 0),
        alpaca
      )
    );
    for (const y of [0.1, 0.165]) {
      g.add(new THREE.Mesh(new THREE.SphereGeometry(0.0085, 20, 14).translate(0, y, 0), alpaca));
      for (const dy of [-0.012, 0.012]) {
        g.add(
          new THREE.Mesh(
            new THREE.CylinderGeometry(0.0048, 0.0048, 0.003, 14).translate(0, y + dy, 0),
            alpaca
          )
        );
      }
    }
    const mouth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0045, 0.035, 14).translate(0, 0.245, 0),
      alpaca
    );
    mouth.scale.z = 0.4;
    g.add(mouth);
    const filtro = paleta(
      alpaca,
      std('#ffffff', {
        map: holesTexture('#d9d6cf'),
        metalness: 0.9,
        roughness: 0.3,
        side: THREE.DoubleSide,
      }),
      0.0145
    );
    filtro.scale.set(1.05, 0.85, 1);
    g.add(filtro);
  }
  return { group: g };
}

// ─── Termos ─────────────────────────────────────────────────────────────────
// El pico (por donde sale el agua) queda del lado -x y la manija del lado +x.

function hammertone(base: string, seed: number) {
  return canvasTexture(1024, 512, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(r() * w, r() * h, 3 + r() * 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Logo
    atFront(ctx, w, (x) => {
      text(ctx, 'STANLEY', x, h * 0.28, 'bold 44px Georgia, serif', '#1d3a2a');
      ctx.fillStyle = '#1d3a2a';
      ctx.beginPath();
      ctx.ellipse(x, h * 0.2, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'SINCE 1913', x, h * 0.33, '16px Georgia, serif', '#1d3a2a');
    });
  });
}

function brushedSteel(withLumilagro: boolean) {
  return canvasTexture(1024, 1024, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, '#e4e6e8');
    g.addColorStop(0.25, '#b9bdc1');
    g.addColorStop(0.5, '#eceef0');
    g.addColorStop(0.75, '#b5b9bd');
    g.addColorStop(1, '#e4e6e8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(81);
    for (let i = 0; i < 400; i++) {
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.12})`;
      ctx.fillRect(r() * w, 0, 1, h);
    }
    if (withLumilagro) {
      ctx.fillStyle = '#1b1b1b';
      for (const y of [0.06, 0.075, 0.905, 0.92]) ctx.fillRect(0, h * y, w, 6);
      atFront(ctx, w, (x) => {
        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(x - 95, h * 0.74, 190, 62, 14);
        ctx.stroke();
        text(ctx, 'LUMILAGRO', x, h * 0.74 + 32, '600 34px system-ui, sans-serif', '#2a2a2a');
        text(ctx, 'VA CON VOS, SIEMPRE.', x, h * 0.74 + 82, '15px system-ui', '#3a3a3a');
      });
    }
  });
}

function loopHandle(points: [number, number][], radius: number, mat: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y]) => new THREE.Vector3(x, y, 0)));
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 10), mat);
}

export function buildTermoModel(style: TermoStyle) {
  const g = new THREE.Group();
  const black = std('#151617', { roughness: 0.45 });
  let h: number;

  if (style === 'pico') {
    // Acero con tapón cebador negro, gatillo rojo y manija negra
    h = 0.33;
    const r = 0.043;
    const bodyH = 0.25;
    const steel = std('#ffffff', { map: brushedSteel(false), metalness: 0.9, roughness: 0.25 });
    g.add(
      new THREE.Mesh(new THREE.CylinderGeometry(r, r, bodyH, 48).translate(0, bodyH / 2, 0), steel)
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.006, 48).translate(0, 0.014, 0),
        std('#8d9196', { metalness: 1, roughness: 0.3 })
      )
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.046, 0.046, 0.04, 48).translate(0, bodyH + 0.02, 0),
        black
      )
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.044, 0.025, 40).translate(0, bodyH + 0.052, 0),
        black
      )
    );
    for (let i = 0; i < 4; i++) {
      g.add(
        new THREE.Mesh(
          new THREE.TorusGeometry(0.036, 0.0015, 6, 40)
            .rotateX(Math.PI / 2)
            .translate(0, bodyH + 0.045 + i * 0.006, 0),
          black
        )
      );
    }
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.033, 0.012, 32).translate(0, h - 0.006, 0),
        black
      )
    );
    const gatillo = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.009, 0.014),
      std('#c8202a', { roughness: 0.35 })
    );
    gatillo.position.set(-0.012, h + 0.006, 0);
    gatillo.rotation.z = 0.45;
    g.add(gatillo);
    g.add(
      loopHandle(
        [
          [0.044, bodyH + 0.03],
          [0.068, bodyH + 0.02],
          [0.076, bodyH - 0.03],
          [0.074, bodyH - 0.12],
          [0.068, bodyH - 0.13],
        ],
        0.0055,
        black
      )
    );
  } else if (style === 'lumilagro') {
    // Acero con vaso negro arriba, base negra y filetes negros
    h = 0.34;
    const r = 0.042;
    const steel = std('#ffffff', { map: brushedSteel(true), metalness: 0.9, roughness: 0.25 });
    const bodyH = 0.25;
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(r * 0.93, r, bodyH, 48).translate(0, 0.012 + bodyH / 2, 0),
        steel
      )
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.022, 48).translate(0, 0.011, 0),
        black
      )
    );
    const cupProfile: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const y = 0.262 + t * 0.078;
      const rr = t < 0.7 ? 0.04 : 0.04 * Math.cos(((t - 0.7) / 0.3) * (Math.PI / 2) * 0.85);
      cupProfile.push(new THREE.Vector2(rr, y));
    }
    cupProfile.push(new THREE.Vector2(0, h));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 48), black));
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.0405, 0.0405, 0.002, 48).translate(0, 0.29, 0),
        std('#3a3b3d', { roughness: 0.4 })
      )
    );
  } else {
    // Stanley Classic: verde martillado, base y cuello de acero, manija negra
    h = 0.33;
    const r = 0.05;
    const green = std('#ffffff', {
      map: hammertone('#5d8a68', 91),
      metalness: 0.35,
      roughness: 0.55,
    });
    const steel = std('#c9cdd1', { metalness: 1, roughness: 0.25 });
    const stopper = std('#4f7a5a', { roughness: 0.6 });
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 48).translate(0, 0.02, 0), steel));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.2, 48).translate(0, 0.14, 0), green));
    g.add(
      new THREE.Mesh(new THREE.CylinderGeometry(0.036, r, 0.025, 48).translate(0, 0.2525, 0), green)
    );
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.034, 0.018, 40).translate(0, 0.274, 0),
        steel
      )
    );
    for (let i = 0; i < 4; i++) {
      g.add(
        new THREE.Mesh(
          new THREE.TorusGeometry(0.031, 0.0035, 8, 40)
            .rotateX(Math.PI / 2)
            .translate(0, 0.288 + i * 0.008, 0),
          stopper
        )
      );
    }
    g.add(
      new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.03, 0.018, 32).translate(0, 0.321, 0),
        stopper
      )
    );
    const flip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.012, 0.03), stopper);
    flip.position.set(-0.008, h + 0.004, 0);
    g.add(flip);
    g.add(
      loopHandle(
        [
          [0.05, 0.235],
          [0.074, 0.225],
          [0.079, 0.17],
          [0.077, 0.09],
          [0.05, 0.075],
        ],
        0.007,
        black
      )
    );
  }

  return { group: g, height: h, mouth: new THREE.Vector3(-0.03, h - 0.005, 0) };
}

// ─── Repisa de yerbas ───────────────────────────────────────────────────────

export const SHELF = {
  width: 0.68,
  depth: 0.15,
  board: 0.018,
  /** Altura libre de cada estante (el paquete más alto mide ~0.23 m). */
  gap: 0.26,
  tiers: 2,
};

/** Repisa de madera abierta (sin fondo, para no tapar la ventana). Origen: centro de la base. */
export function buildShelf(width = SHELF.width) {
  const g = new THREE.Group();
  const tex = woodTexture('#9a6a3e', '#4e3018', 1, 17);
  const wood = std('#ffffff', { map: tex, roughness: 0.55 });
  const { depth, board, gap, tiers } = SHELF;
  const totalH = tiers * (gap + board) + board;
  for (let i = 0; i <= tiers; i++) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(width, board, depth), wood);
    m.position.y = i * (gap + board) + board / 2;
    g.add(m);
  }
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(board, totalH, depth), wood);
    side.position.set(sx * (width / 2 + board / 2), totalH / 2, 0);
    g.add(side);
  }
  // Travesaño trasero fino (da estructura sin tapar el paisaje)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(width, 0.03, board), wood);
  rail.position.set(0, totalH - 0.05, -depth / 2 + board / 2);
  g.add(rail);
  return g;
}

/** Altura (desde la base de la repisa) de la superficie de cada estante, de arriba hacia abajo. */
export function shelfTierY(tier: number) {
  const { board, gap, tiers } = SHELF;
  return (tiers - 1 - tier) * (gap + board) + board;
}
