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

/** Variante de color de un mate (las ids coinciden con `colors` del catálogo). */
type MateColor = { id: string; leather?: string; paint?: string; thread?: string };

export const LEATHER = {
  negro: { id: 'negro', leather: '#1f1d1c', thread: '#6e6157' },
  chocolate: { id: 'chocolate', leather: '#4a2a19', thread: '#a0523a' },
};

type MateDef = {
  height: number;
  /** Radio exterior en función de t (0 = base, 1 = boca). */
  radius: (t: number) => number;
  body: (ctx: CanvasRenderingContext2D, w: number, h: number, c: MateColor) => void;
  bodyRough: number;
  /** Colores elegibles; el primero es el que se muestra de entrada. */
  colors?: MateColor[];
  /** Sección con lóbulos (no redonda) y boca ondulada (mate mu). */
  lobes?: { n: number; amp: number; rimWave: number };
  /** El interior lleva una franja pintada en el borde (color de la pintura). */
  innerPaint?: boolean;
  /** Base de cuero con 4 patas cosidas (mate imperial). */
  legs?: boolean;
  inner: string;
  /** Banda de cuero en relieve: desde la base hasta `to` (0–1). */
  band?: {
    to: number;
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
    /** Funda recta (cilindro de este radio) en vez de seguir la forma del mate. */
    straight?: number;
    /** Trenza de tiento en el borde de arriba de la funda. */
    braid?: boolean;
  };
  /** Virola de alpaca: perfil [radio, y] + dibujo cincelado. */
  virola?: {
    points: [number, number][];
    draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
    /** Tono del metal (blanco = alpaca; algo dorado para virolas de bronce/alpaca dorada). */
    tint?: string;
    /** Cordón retorcido en el borde exterior: radio y altura. */
    rope?: { r: number; y: number };
  };
  /** Labio superior (un toro fino) cuando no hay virola. */
  lip?: string;
  /** Tres patitas de cuero en la base (camionero clásico); toman el color del cuero. */
  feet?: boolean;
};

/**
 * Virola del imperial de algarrobo: banda inferior con guarda pampa escalonada
 * en relieve (alpaca mate sobre fondo picado) y borde superior liso y pulido.
 */
function guardaPampa(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f6f6f3');
  g.addColorStop(0.3, '#cfcfcb');
  g.addColorStop(1, '#ecebe7');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const y0 = h * 0.38;
  const bh = h - y0;
  // Fondo picado (más oscuro)
  ctx.fillStyle = '#c2c0ba';
  ctx.fillRect(0, y0 + bh * 0.1, w, bh * 0.8);
  const r = rng(71);
  ctx.fillStyle = 'rgba(70,70,66,0.35)';
  for (let i = 0; i < 2200; i++) ctx.fillRect(r() * w, y0 + bh * 0.1 + r() * bh * 0.8, 2, 2);
  // Escalones de la guarda en relieve
  ctx.fillStyle = '#f2f1ee';
  const step = w / 22;
  const u = (bh * 0.8) / 5;
  const top = y0 + bh * 0.1;
  for (let i = 0; i < 22; i++) {
    const x = i * step;
    ctx.fillRect(x, top + u * 2, step * 0.18, u);
    ctx.fillRect(x + step * 0.18, top + u, step * 0.18, u * 3);
    ctx.fillRect(x + step * 0.36, top, step * 0.28, u);
    ctx.fillRect(x + step * 0.36, top + u * 4, step * 0.28, u);
    ctx.fillRect(x + step * 0.64, top + u, step * 0.18, u * 3);
    ctx.fillRect(x + step * 0.82, top + u * 2, step * 0.18, u);
  }
  ctx.fillStyle = 'rgba(40,40,38,0.6)';
  ctx.fillRect(0, y0 + bh * 0.08, w, 2);
  ctx.fillRect(0, y0 + bh * 0.9, w, 2);
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

/**
 * Virola del imperial. El lathe va de abajo (v=0) a la boca (v=1): el tercio de
 * abajo del canvas es la banda cincelada (medallones ovalados con volutas) y el
 * resto es el borde plano pulido.
 */
/** Trenza de tiento crudo (para el toro del borde de la funda). */
function braidTexture() {
  const tex = canvasTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#e9e2d4';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(120,100,75,0.55)';
    ctx.lineWidth = 3;
    for (let x = 0; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 10, h / 2, x, h);
      ctx.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

/**
 * Virola del torpedo criollo: hombro abombado y pulido, con rombos repujados y
 * arcos en punta rellenos de picado (punteado).
 */
function torpedoVirola(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f6f6f3');
  g.addColorStop(0.4, '#d6d6d2');
  g.addColorStop(0.75, '#f0f0ed');
  g.addColorStop(1, '#c9c9c4');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const ink = 'rgba(55,55,52,0.55)';
  // Filete inferior
  ctx.fillStyle = ink;
  ctx.fillRect(0, h * 0.93, w, 2);
  const step = w / 8;
  for (let i = 0; i < 8; i++) {
    const x = i * step + step / 2;
    // Arco en punta que cuelga desde arriba, relleno de picado
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - step * 0.42, h * 0.25);
    ctx.quadraticCurveTo(x - step * 0.3, h * 0.55, x, h * 0.62);
    ctx.quadraticCurveTo(x + step * 0.3, h * 0.55, x + step * 0.42, h * 0.25);
    ctx.closePath();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.clip();
    ctx.fillStyle = 'rgba(60,60,58,0.45)';
    const r = rng(300 + i);
    for (let k = 0; k < 160; k++)
      ctx.fillRect(x - step / 2 + r() * step, h * 0.25 + r() * h * 0.4, 2, 2);
    ctx.restore();
    // Rombo repujado entre arcos
    const dx = x + step / 2;
    ctx.beginPath();
    ctx.moveTo(dx, h * 0.42);
    ctx.lineTo(dx + step * 0.18, h * 0.66);
    ctx.lineTo(dx, h * 0.9);
    ctx.lineTo(dx - step * 0.18, h * 0.66);
    ctx.closePath();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(60,60,58,0.5)';
    const r2 = rng(400 + i);
    for (let k = 0; k < 90; k++)
      ctx.fillRect(dx - step * 0.18 + r2() * step * 0.36, h * 0.42 + r2() * h * 0.48, 2, 2);
    ctx.restore();
  }
  // Banda superior pulida con un filete
  ctx.fillStyle = ink;
  ctx.fillRect(0, h * 0.22, w, 2);
}

/**
 * Mu negro: madera rojiza, borde negro grueso con chorreados redondeados y
 * cuatro lunares pintados en cada panel (no lleva franjas ni tachas).
 */
function muNegro(ctx: CanvasRenderingContext2D, w: number, h: number, paint: string) {
  ctx.fillStyle = '#c4703e';
  ctx.fillRect(0, 0, w, h);
  grain(ctx, w, h, '#8a4320', 33, 60, true);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, 'rgba(255,180,130,0.08)');
  g.addColorStop(1, 'rgba(80,30,10,0.18)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = paint;
  const r = rng(34);
  ctx.fillRect(0, 0, w, h * 0.09);
  // Chorreados: lenguas anchas con la punta redonda
  const drips = [0.02, 0.13, 0.29, 0.4, 0.55, 0.68, 0.84, 0.95];
  for (const u of drips) {
    const cx = u * w;
    const half = w * (0.022 + r() * 0.014);
    const len = h * (0.2 + r() * 0.17);
    ctx.beginPath();
    ctx.moveTo(cx - half, 0);
    ctx.lineTo(cx - half, len - half);
    ctx.arc(cx, len - half, half, Math.PI, 0, true);
    ctx.lineTo(cx + half, 0);
    ctx.fill();
  }
  // Lunares: uno arriba, dos al medio y uno abajo, en cada panel
  for (const u of [1 / 6, 1 / 2, 5 / 6]) {
    for (const [du, dv] of [
      [0.012, 0.36],
      [-0.02, 0.5],
      [0.026, 0.53],
      [0.0, 0.7],
    ]) {
      ctx.beginPath();
      ctx.arc((u + du) * w, h * dv, 7.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Cordón retorcido (vetas en diagonal que se repiten). */
function ropeTexture() {
  const tex = canvasTexture(256, 32, (ctx, w, h) => {
    ctx.fillStyle = '#e9e5da';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(60,55,40,0.6)';
    ctx.lineWidth = 3;
    for (let x = -h; x < w + h; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + h, h);
      ctx.stroke();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(24, 1);
  return tex;
}

/**
 * Virola volcada (plato). El lathe va del cuello de la boca (v=0, abajo del
 * canvas) al borde exterior (v=1, arriba): abajo una guarda de espirales y en el
 * plato flores en abanico repujadas.
 */
function volcadaVirola(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f3f2ee');
  g.addColorStop(0.5, '#dcdbd6');
  g.addColorStop(0.82, '#f1f0ec');
  g.addColorStop(1, '#c9c4b2');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const ink = 'rgba(55,52,40,0.55)';
  // Guarda de espirales en el cuello
  const y0 = h * (5 / 6);
  ctx.fillStyle = '#cfc8ad';
  ctx.fillRect(0, y0, w, h - y0);
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  const cy = y0 + (h - y0) / 2;
  for (let x = 10; x < w; x += 26) {
    ctx.beginPath();
    for (let k = 0; k <= 20; k++) {
      const a = (k / 20) * Math.PI * 3;
      const r = 1 + (k / 20) * 9;
      const px = x + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r * 0.8;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  }
  ctx.fillStyle = ink;
  ctx.fillRect(0, y0, w, 2);
  // Flores en abanico repujadas, apuntando hacia el borde
  const n = 9;
  const step = w / n;
  ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const x = i * step + step / 2;
    const base = h * 0.7;
    // Contorno en arco apuntado
    ctx.beginPath();
    ctx.moveTo(x - step * 0.42, base);
    ctx.quadraticCurveTo(x - step * 0.4, h * 0.2, x, h * 0.1);
    ctx.quadraticCurveTo(x + step * 0.4, h * 0.2, x + step * 0.42, base);
    ctx.stroke();
    // Pétalos en abanico
    for (let k = -3; k <= 3; k++) {
      const a = -Math.PI / 2 + k * 0.32;
      ctx.beginPath();
      ctx.moveTo(x, base - 6);
      ctx.quadraticCurveTo(
        x + Math.cos(a) * step * 0.18 + k * 3,
        base + Math.sin(a) * h * 0.25,
        x + Math.cos(a) * step * 0.3,
        base + Math.sin(a) * h * 0.42
      );
      ctx.stroke();
    }
    // Centro punteado
    ctx.fillStyle = ink;
    const r = rng(500 + i);
    for (let k = 0; k < 40; k++) {
      ctx.fillRect(x - 12 + r() * 24, base - 22 + r() * 18, 2, 2);
    }
    // Hojitas entre flores
    ctx.beginPath();
    ctx.ellipse(x + step / 2, h * 0.5, 4, 14, 0.3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/**
 * Virola del torpedo cincelado. v=0 (abajo del canvas) es el borde que toca el
 * cuero y v=1 (arriba) la boca: una fila de hojas en guirnalda abajo, escamas
 * superpuestas en el hombro y el canto de la boca con muescas.
 */
function torpedoCinceladoVirola(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f4f3ef');
  g.addColorStop(0.45, '#d2d1cc');
  g.addColorStop(1, '#eeede8');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const ink = 'rgba(55,55,52,0.55)';
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  // Canto de la boca con muescas
  ctx.fillStyle = ink;
  ctx.fillRect(0, h * 0.16, w, 2);
  for (let x = 6; x < w; x += 22) ctx.fillRect(x, 0, 2, h * 0.14);
  // Escamas superpuestas (filas de arcos)
  for (let row = 0; row < 3; row++) {
    const y = h * (0.26 + row * 0.11);
    const off = row % 2 ? 9 : 0;
    for (let x = -18 + off; x < w + 18; x += 18) {
      ctx.beginPath();
      ctx.arc(x, y, 9, 0, Math.PI);
      ctx.stroke();
      for (let k = 1; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(x - 6 + k * 4, y + 2);
        ctx.lineTo(x - 6 + k * 4, y + 7);
        ctx.stroke();
      }
    }
  }
  // Guirnalda de hojas en diagonal
  ctx.fillRect(0, h * 0.62, w, 2);
  ctx.fillRect(0, h * 0.95, w, 2);
  for (let x = 0; x < w + 30; x += 30) {
    ctx.save();
    ctx.translate(x, h * 0.785);
    ctx.rotate(-0.5);
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 6.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-13, 0);
    ctx.lineTo(13, 0);
    ctx.stroke();
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(k * 5, 0);
      ctx.lineTo(k * 5 + 3, -4);
      ctx.moveTo(k * 5, 0);
      ctx.lineTo(k * 5 + 3, 4);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/**
 * Virola del criollo premium. Canvas de abajo (v=0, canto de afuera) hacia arriba
 * (v=1, adentro de la boca): canto liso pulido, cara plana con arcos de hojas
 * cincelados y una fila de punzonados junto a la boca.
 */
function premiumVirola(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#bdbcb7');
  g.addColorStop(0.3, '#d9d8d3');
  g.addColorStop(0.62, '#f2f1ed');
  g.addColorStop(1, '#e6e5e0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const ink = 'rgba(45,45,42,0.6)';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  // Cara plana: entre v≈0.35 y v≈0.85 → en el canvas y entre h*0.15 y h*0.65
  const top = h * 0.17;
  const bot = h * 0.62;
  ctx.fillRect(0, bot, w, 2);
  ctx.fillRect(0, top, w, 2);
  const n = 14;
  const step = w / n;
  ctx.lineWidth = 2.2;
  for (let i = 0; i < n; i++) {
    const x = i * step + step / 2;
    // Arco (festón) que abre hacia afuera
    ctx.beginPath();
    ctx.moveTo(x - step / 2, bot - 4);
    ctx.quadraticCurveTo(x, top + (bot - top) * 0.15, x + step / 2, bot - 4);
    ctx.stroke();
    // Hojitas en abanico dentro del arco
    for (let k = -2; k <= 2; k++) {
      ctx.save();
      ctx.translate(x + k * step * 0.13, bot - (bot - top) * 0.32);
      ctx.rotate(k * 0.35);
      ctx.beginPath();
      ctx.ellipse(0, 0, 3, (bot - top) * 0.18, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
  // Punzonados junto a la boca
  for (let x = 4; x < w; x += 9) {
    ctx.beginPath();
    ctx.arc(x, top - h * 0.05, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function imperialVirola(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#f7f7f5');
  g.addColorStop(0.35, '#cfd0ce');
  g.addColorStop(0.66, '#f2f2f0');
  g.addColorStop(1, '#c9c7c0');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const y0 = h * 0.667;
  const bh = h - y0;
  ctx.fillStyle = '#dcdad3';
  ctx.fillRect(0, y0, w, bh);
  const ink = 'rgba(50,50,48,0.5)';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = 1.6;
  for (const y of [y0 + bh * 0.08, y0 + bh * 0.92]) ctx.fillRect(0, y - 1, w, 2);
  const cy = y0 + bh * 0.5;
  for (let x = 46; x < w + 46; x += 92) {
    // Medallón ovalado con rombo al centro
    ctx.beginPath();
    ctx.ellipse(x, cy, 20, bh * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, cy, 15, bh * 0.21, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, cy - bh * 0.15);
    ctx.lineTo(x + 7, cy);
    ctx.lineTo(x, cy + bh * 0.15);
    ctx.lineTo(x - 7, cy);
    ctx.closePath();
    ctx.stroke();
    // Volutas tipo paisley entre medallones
    for (const dir of [-1, 1]) {
      const sx = x + dir * 46;
      ctx.beginPath();
      ctx.moveTo(sx - dir * 18, cy + bh * 0.2);
      ctx.bezierCurveTo(sx - dir * 10, cy - bh * 0.35, sx + dir * 10, cy - bh * 0.1, sx, cy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, cy, 4, 0, Math.PI * 2);
      ctx.stroke();
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(
          sx - dir * (10 + k * 4),
          cy + bh * (0.05 + k * 0.04),
          3,
          1.5,
          dir * 0.6,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }
}

const MATES: Record<MateStyle, MateDef> = {
  mu: {
    // Forma de ubre: 3 lóbulos, punta redondeada abajo y boca ondulada
    height: 0.13,
    radius: (t) =>
      0.012 +
      0.046 * Math.pow(Math.sin(Math.min(t / 0.85, 1) * (Math.PI / 2)), 0.9) -
      (t > 0.85 ? (t - 0.85) * 0.04 : 0),
    bodyRough: 0.55,
    inner: '#c08550',
    lobes: { n: 3, amp: 0.07, rimWave: 0.005 },
    innerPaint: true,
    colors: [
      { id: 'blanco', paint: '#f4f2ec' },
      { id: 'negro', paint: '#1b1a1a' },
    ],
    body: (ctx, w, h, c) => {
      if (c.id === 'negro') return muNegro(ctx, w, h, c.paint ?? '#1b1a1a');
      const paint = c.paint ?? '#f4f2ec';
      ctx.fillStyle = '#b97c45';
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, '#86522a', 31, 70, true);
      const r = rng(32);
      ctx.fillStyle = paint;
      // Borde pintado (arriba del canvas = boca), con borde inferior irregular
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 16) ctx.lineTo(x, h * (0.06 + r() * 0.025));
      ctx.lineTo(w, 0);
      ctx.fill();
      // Franjas que bajan por las 3 aristas (u = 0, 1/3, 2/3) con chorreados
      for (const u of [0, 1 / 3, 2 / 3, 1]) {
        const cx = u * w;
        const half = w * 0.022;
        ctx.beginPath();
        ctx.moveTo(cx - half, 0);
        for (let y = 0; y <= h * 0.8; y += 12)
          ctx.lineTo(cx - half - Math.sin(y * 0.05 + u * 9) * 4 - r() * 3, y);
        for (let y = h * 0.8; y >= 0; y -= 12)
          ctx.lineTo(cx + half + Math.sin(y * 0.045 + u * 7) * 4 + r() * 3, y);
        ctx.fill();
        // Chorreados hacia los costados
        for (let k = 0; k < 3; k++) {
          const dir = r() > 0.5 ? 1 : -1;
          const y = h * (0.15 + r() * 0.5);
          const len = 14 + r() * 30;
          ctx.beginPath();
          ctx.ellipse(cx + dir * (half + len / 2), y, len / 2, 5 + r() * 4, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // Punta de abajo pintada entera, con borde de pinceladas
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 14) {
        const near = Math.min(...[0, 1 / 3, 2 / 3, 1].map((u) => Math.abs(x / w - u)));
        ctx.lineTo(x, h * (0.66 + near * 0.3 + r() * 0.04));
      }
      ctx.lineTo(w, h);
      ctx.fill();
      // Tachitas de alpaca: dos columnas de 4 en cada panel de madera
      for (const u of [1 / 6, 1 / 2, 5 / 6]) {
        for (const off of [-0.028, 0.028]) {
          for (let k = 0; k < 4; k++) {
            const x = (u + off) * w;
            const y = h * (0.26 + k * 0.09 + (off > 0 ? 0.045 : 0));
            const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 6);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(0.5, '#b9bcc0');
            g.addColorStop(1, '#6d7074');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 5.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  },

  criollo: {
    // Calabaza alta con boca en trompeta y funda recta de cuero crudo cosida en X
    height: 0.125,
    radius: (t) =>
      t < 0.55
        ? 0.039 + 0.005 * Math.pow(1 - t / 0.55, 2)
        : 0.039 + 0.012 * Math.pow((t - 0.55) / 0.45, 2.2),
    bodyRough: 0.4,
    inner: '#d2b48a',
    lip: '#d9c29b',
    body: (ctx, w, h) => {
      gourd(ctx, w, h, '#8f4d22', '#4a2008', 41);
      // Vetas más claras de la calabaza
      const r = rng(43);
      for (let i = 0; i < 30; i++) {
        ctx.fillStyle = `rgba(230,170,90,${0.08 + r() * 0.12})`;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 20 + r() * 50, 8 + r() * 20, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    band: {
      to: 0.5,
      straight: 0.0475,
      draw: (ctx, w, h) => {
        // Cuero crudo con textura de corteza
        ctx.fillStyle = '#94744c';
        ctx.fillRect(0, 0, w, h);
        const r = rng(42);
        for (let i = 0; i < 420; i++) {
          ctx.fillStyle = r() > 0.5 ? 'rgba(255,240,215,0.16)' : 'rgba(70,50,30,0.18)';
          const x = r() * w;
          const y = r() * h;
          ctx.fillRect(x, y, 1 + r() * 2, 10 + r() * 40);
        }
        noise(ctx, w, h, 44, 0.06);
        // Costura al frente: tiento cruzado en X
        atFront(ctx, w, (x) => {
          ctx.strokeStyle = 'rgba(60,40,20,0.5)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
          ctx.strokeStyle = '#ece4d2';
          ctx.lineWidth = 6;
          for (let y = h * 0.08; y < h * 0.9; y += 26) {
            ctx.beginPath();
            ctx.moveTo(x - 13, y);
            ctx.lineTo(x + 13, y + 20);
            ctx.moveTo(x + 13, y);
            ctx.lineTo(x - 13, y + 20);
            ctx.stroke();
          }
        });
        // Monograma grabado (personalizable), a un costado
        const mx = w * 0.3;
        ctx.strokeStyle = 'rgba(80,55,30,0.55)';
        ctx.lineWidth = 4;
        ctx.strokeRect(mx - 64, h * 0.18, 128, h * 0.66);
        ctx.strokeRect(mx - 58, h * 0.21, 116, h * 0.6);
        ctx.beginPath();
        ctx.moveTo(mx, h * 0.21);
        ctx.lineTo(mx, h * 0.81);
        ctx.moveTo(mx - 58, h * 0.51);
        ctx.lineTo(mx + 58, h * 0.51);
        ctx.stroke();
        text(ctx, 'M', mx - 29, h * 0.37, 'bold 50px Georgia, serif', 'rgba(80,55,30,0.7)');
        text(ctx, 'G', mx + 29, h * 0.37, 'bold 50px Georgia, serif', 'rgba(80,55,30,0.7)');
        text(ctx, 'R', mx - 29, h * 0.66, 'bold 50px Georgia, serif', 'rgba(80,55,30,0.7)');
        text(ctx, 'C', mx + 29, h * 0.66, 'bold 50px Georgia, serif', 'rgba(80,55,30,0.7)');
      },
    },
  },

  criolloPremium: {
    // Calabaza moteada que abre hacia la boca, funda recta de cuero y virola plana cincelada
    height: 0.13,
    radius: (t) => 0.04 + 0.009 * Math.pow(t, 2.2),
    bodyRough: 0.38,
    inner: '#d3b98f',
    body: (ctx, w, h) => {
      gourd(ctx, w, h, '#93461c', '#3a1404', 51);
      const r = rng(54);
      ctx.fillStyle = 'rgba(60,20,5,0.55)';
      for (let i = 0; i < 260; i++) {
        ctx.beginPath();
        ctx.arc(r() * w, r() * h, 1 + r() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    band: {
      to: 0.52,
      straight: 0.0475,
      draw: (ctx, w, h) => {
        ctx.fillStyle = '#6e4a2c';
        ctx.fillRect(0, 0, w, h);
        const r = rng(52);
        for (let i = 0; i < 380; i++) {
          ctx.fillStyle = r() > 0.5 ? 'rgba(255,230,200,0.1)' : 'rgba(30,15,5,0.18)';
          ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 6 + r() * 30);
        }
        noise(ctx, w, h, 53, 0.06);
        // Canto claro del cuero arriba
        ctx.fillStyle = '#e2cfae';
        ctx.fillRect(0, 0, w, h * 0.04);
        // Costura: solapa y tiento blanco trenzado en espiga
        atFront(ctx, w, (x) => {
          ctx.strokeStyle = 'rgba(230,215,190,0.8)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x - 22, h * 0.04);
          ctx.lineTo(x - 22, h);
          ctx.stroke();
          ctx.strokeStyle = '#efe8da';
          ctx.lineWidth = 9;
          for (let y = h * 0.1; y < h * 0.92; y += 24) {
            ctx.beginPath();
            ctx.moveTo(x - 14, y + 16);
            ctx.lineTo(x + 2, y);
            ctx.moveTo(x + 2, y + 10);
            ctx.lineTo(x + 16, y - 4);
            ctx.stroke();
          }
        });
      },
    },
    virola: {
      // Aro chato apoyado sobre la boca: canto exterior pulido + cara de arriba cincelada
      points: [
        [0.0508, 0.122],
        [0.0518, 0.132],
        [0.0508, 0.1355],
        [0.046, 0.1365],
        [0.04, 0.1365],
        [0.0362, 0.1355],
        [0.0352, 0.13],
      ],
      draw: (ctx, w, h) => premiumVirola(ctx, w, h),
    },
  },

  imperialAlgarrobo: {
    // Algarrobo torneado: panza redonda, cintura y pie ensanchado; virola con guarda
    height: 0.118,
    radius: (t) => {
      if (t < 0.08) return 0.036 + (0.08 - t) * 0.06; // pie
      if (t < 0.16) return 0.036 - (t - 0.08) * 0.05; // cintura
      return (
        0.032 +
        0.021 * Math.sin(Math.min((t - 0.16) / 0.42, 1) * (Math.PI / 2)) -
        (t > 0.6 ? (t - 0.6) * 0.03 : 0)
      );
    },
    bodyRough: 0.42,
    inner: '#c69468',
    body: (ctx, w, h) => {
      ctx.fillStyle = '#7d432b';
      ctx.fillRect(0, 0, w, h);
      // Vetas del algarrobo en arcos (como torneado)
      const r = rng(61);
      for (let i = 0; i < 70; i++) {
        ctx.strokeStyle = `rgba(${r() > 0.5 ? '70,30,15' : '190,120,80'},${0.12 + r() * 0.2})`;
        ctx.lineWidth = 1 + r() * 3;
        const cx = r() * w;
        const cy = h * (0.3 + r() * 0.5);
        ctx.beginPath();
        ctx.ellipse(cx, cy, 30 + r() * 120, 10 + r() * 50, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,190,150,0.12)');
      g.addColorStop(1, 'rgba(40,15,5,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    virola: {
      points: [
        [0.0535, 0.088],
        [0.0515, 0.106],
        [0.0505, 0.112],
        [0.052, 0.1135],
        [0.052, 0.1185],
        [0.0372, 0.12],
        [0.0362, 0.115],
      ],
      draw: (ctx, w, h) => guardaPampa(ctx, w, h),
    },
  },

  torpedoCincelado: {
    // Huevo alto forrado en cuero, costura en X, 4 patas y virola abombada cincelada
    height: 0.13,
    radius: (t) =>
      0.02 +
      0.031 * Math.pow(Math.sin(Math.min(t / 0.55, 1) * (Math.PI / 2)), 0.8) -
      (t > 0.6 ? (t - 0.6) * 0.022 : 0),
    bodyRough: 0.55,
    inner: '#c99a66',
    legs: true,
    colors: [LEATHER.negro, LEATHER.chocolate],
    body: (ctx, w, h, c) => {
      leather(ctx, w, h, c.leather ?? '#1f1d1c', 191);
      // Arrugas suaves del cuero
      const r = rng(192);
      ctx.lineWidth = 2;
      for (let i = 0; i < 30; i++) {
        ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)';
        const x = r() * w;
        const y = r() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 20, y + (r() - 0.5) * 30, x + 40, y + (r() - 0.5) * 20);
        ctx.stroke();
      }
      // Costura lateral con tiento negro cruzado en X
      const x = w * 0.25;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(150,140,130,0.55)';
      ctx.lineWidth = 6;
      for (let y = h * 0.05; y < h * 0.95; y += 28) {
        ctx.beginPath();
        ctx.moveTo(x - 12, y);
        ctx.lineTo(x + 12, y + 22);
        ctx.moveTo(x + 12, y);
        ctx.lineTo(x - 12, y + 22);
        ctx.stroke();
      }
    },
    virola: {
      points: [
        [0.0475, 0.106],
        [0.0478, 0.114],
        [0.0465, 0.122],
        [0.0435, 0.128],
        [0.041, 0.1305],
        [0.0388, 0.1298],
      ],
      draw: (ctx, w, h) => torpedoCinceladoVirola(ctx, w, h),
    },
  },

  camionero: {
    // Cuero que se angosta hacia abajo, patas de cuero y virola volcada en plato
    height: 0.108,
    radius: (t) => 0.022 + 0.031 * Math.pow(t, 0.7),
    bodyRough: 0.6,
    inner: '#cdb08a',
    legs: true,
    colors: [LEATHER.negro, LEATHER.chocolate],
    body: (ctx, w, h, c) => leather(ctx, w, h, c.leather ?? '#1d1b1a', 71),
    virola: {
      // Cuello en la boca (guarda de espirales) y ala abierta como un plato
      points: [
        [0.0335, 0.094],
        [0.0335, 0.104],
        [0.036, 0.1065],
        [0.048, 0.1105],
        [0.06, 0.1165],
        [0.0695, 0.122],
        [0.0735, 0.1245],
      ],
      tint: '#f7f0da',
      rope: { r: 0.0735, y: 0.1245 },
      draw: (ctx, w, h) => volcadaVirola(ctx, w, h),
    },
  },
  torpedoCriollo: {
    // Calabaza con forma de huevo, funda recta de cuero crudo y virola abombada
    height: 0.1,
    radius: (t) =>
      0.03 +
      0.022 * Math.sin(Math.min(t / 0.45, 1) * (Math.PI / 2)) -
      (t > 0.6 ? (t - 0.6) * 0.008 : 0),
    bodyRough: 0.45,
    inner: '#cdb48c',
    body: (ctx, w, h) => gourd(ctx, w, h, '#c98a45', '#8a5525', 151),
    band: {
      to: 0.55,
      straight: 0.0525,
      braid: true,
      draw: (ctx, w, h) => {
        // Cuero crudo con vetas verticales
        ctx.fillStyle = '#a77a4a';
        ctx.fillRect(0, 0, w, h);
        const r = rng(152);
        for (let i = 0; i < 260; i++) {
          ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.12)' : 'rgba(110,75,40,0.12)';
          ctx.fillRect(r() * w, 0, 1 + r() * 2, h);
        }
        noise(ctx, w, h, 153, 0.05);
        // Costura lateral con tiento cruzado en X
        const x = w * 0.12;
        ctx.strokeStyle = '#efe9dd';
        ctx.lineWidth = 7;
        for (let y = h * 0.08; y < h * 0.92; y += 30) {
          ctx.beginPath();
          ctx.moveTo(x - 14, y);
          ctx.lineTo(x + 14, y + 24);
          ctx.moveTo(x + 14, y);
          ctx.lineTo(x - 14, y + 24);
          ctx.stroke();
        }
        // Agujeritos de la trenza en el borde de arriba
        ctx.fillStyle = 'rgba(90,60,30,0.6)';
        for (let xx = 8; xx < w; xx += 20) {
          ctx.beginPath();
          ctx.arc(xx, h * 0.1, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    },
    virola: {
      points: [
        [0.0505, 0.094],
        [0.0515, 0.102],
        [0.0505, 0.113],
        [0.0468, 0.122],
        [0.042, 0.1285],
        [0.0392, 0.131],
        [0.0372, 0.13],
      ],
      draw: (ctx, w, h) => torpedoVirola(ctx, w, h),
    },
  },

  camioneroClasico: {
    height: 0.115,
    radius: (t) => 0.034 + 0.022 * Math.sin(Math.min(t / 0.7, 1) * (Math.PI / 2)),
    bodyRough: 0.6,
    inner: '#a8743f',
    legs: true,
    colors: [LEATHER.negro, LEATHER.chocolate],
    body: (ctx, w, h, c) => {
      leather(ctx, w, h, c.leather ?? '#2b2321', 161);
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
  imperial: {
    height: 0.095,
    radius: (t) =>
      0.018 +
      0.04 * Math.sin(Math.min(t / 0.55, 1) * (Math.PI / 2)) -
      (t > 0.55 ? (t - 0.55) * 0.018 : 0),
    bodyRough: 0.5,
    inner: '#d9c4a0',
    legs: true,
    colors: [LEATHER.negro, LEATHER.chocolate],
    body: (ctx, w, h, c) => {
      leather(ctx, w, h, c.leather ?? '#1f1d1c', 181);
      // Arrugas y brillos del cuero moldeado
      const r = rng(182);
      ctx.lineWidth = 2;
      for (let i = 0; i < 40; i++) {
        ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.18)';
        const x = r() * w;
        const y = r() * h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + 20, y + (r() - 0.5) * 30, x + 30 + r() * 40, y + (r() - 0.5) * 20);
        ctx.stroke();
      }
    },
    virola: {
      // Banda cincelada ancha + borde superior plano y pulido
      points: [
        [0.0548, 0.074],
        [0.0522, 0.092],
        [0.051, 0.111],
        [0.0522, 0.113],
        [0.0522, 0.119],
        [0.036, 0.1205],
        [0.0352, 0.116],
      ],
      draw: (ctx, w, h) => imperialVirola(ctx, w, h),
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
  let color: MateColor = def.colors?.[0] ?? { id: 'default' };

  const bodyTexture = () => canvasTexture(1024, 512, (ctx, w, h) => def.body(ctx, w, h, color));
  const bodyMat = std('#ffffff', { map: bodyTexture(), roughness: def.bodyRough });
  /** Sección con lóbulos y boca ondulada (solo si el mate los define). */
  const shapeLobes = (geo: THREE.BufferGeometry) => {
    if (!def.lobes) return geo;
    const { n, amp, rimWave } = def.lobes;
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const y = p.getY(i);
      const phi = Math.atan2(x, z);
      const k = 1 + amp * Math.cos(n * phi);
      p.setXYZ(
        i,
        x * k,
        y + (y > H * 0.88 ? rimWave * Math.cos(n * phi) * ((y - H * 0.88) / (H * 0.12)) : 0),
        z * k
      );
    }
    geo.computeVertexNormals();
    return geo;
  };
  g.add(new THREE.Mesh(shapeLobes(new THREE.LatheGeometry(profile, 96)), bodyMat));

  // Interior de calabaza/madera (se ve por la boca)
  const innerProfile = profile
    .slice(1)
    .map((p) => new THREE.Vector2(p.x * 0.9, Math.max(p.y, H * 0.05)));
  const innerTexture = () =>
    canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = def.inner;
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 'rgba(90,50,20,0.6)', 41, 25, true);
      if (def.innerPaint) {
        ctx.fillStyle = color.paint ?? '#f4f2ec';
        ctx.fillRect(0, 0, w, h * 0.12);
      }
    });
  const innerMat = std('#ffffff', { map: innerTexture(), roughness: 0.9, side: THREE.BackSide });
  g.add(new THREE.Mesh(shapeLobes(new THREE.LatheGeometry(innerProfile, 96)), innerMat));
  // Canto de la boca (une la pared de afuera con la de adentro)
  let rimMat: THREE.MeshStandardMaterial | null = null;
  if (def.lobes) {
    rimMat = std(color.paint ?? '#f4f2ec', { roughness: 0.6, side: THREE.DoubleSide });
    const rTop = def.radius(1);
    g.add(
      new THREE.Mesh(
        shapeLobes(
          new THREE.LatheGeometry(
            [new THREE.Vector2(rTop * 0.9, H), new THREE.Vector2(rTop, H)],
            96
          )
        ),
        rimMat
      )
    );
  }
  // Tapa interior (fondo de la calabaza) para que no se vea hueco desde arriba
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(def.radius(0.05) * 0.9, 32).rotateX(-Math.PI / 2),
    std(def.inner, { roughness: 0.95 })
  );
  floor.position.y = H * 0.05;
  g.add(floor);

  if (def.band) {
    const n = Math.round(N * def.band.to);
    const bandTop = def.band.to * H;
    const bandProfile = def.band.straight
      ? [
          new THREE.Vector2(def.band.straight - 0.004, 0.0004),
          new THREE.Vector2(def.band.straight, 0.0004),
          new THREE.Vector2(def.band.straight, bandTop),
          new THREE.Vector2(def.band.straight - 0.0025, bandTop),
        ]
      : profile.slice(1, n + 2).map((p) => new THREE.Vector2(p.x + 0.0022, p.y));
    if (def.band.braid) {
      const braid = new THREE.Mesh(
        new THREE.TorusGeometry(
          (def.band.straight ?? def.radius(def.band.to)) + 0.0004,
          0.0024,
          10,
          96
        ),
        std('#ffffff', { map: braidTexture(), roughness: 0.85 })
      );
      braid.rotation.x = Math.PI / 2;
      braid.position.y = bandTop;
      g.add(braid);
    }
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
        std(def.virola.tint ?? '#ffffff', {
          map: canvasTexture(1024, 256, def.virola.draw),
          metalness: 0.95,
          roughness: 0.22,
          side: THREE.DoubleSide,
        })
      )
    );
    if (def.virola.rope) {
      const rope = new THREE.Mesh(
        new THREE.TorusGeometry(def.virola.rope.r, 0.0017, 10, 128),
        std(def.virola.tint ?? '#ffffff', { map: ropeTexture(), metalness: 1, roughness: 0.25 })
      );
      rope.rotation.x = Math.PI / 2;
      rope.position.y = def.virola.rope.y;
      g.add(rope);
    }
    top = Math.max(H, ...def.virola.points.map((p) => p[1]));
  }
  let lipMat: THREE.MeshStandardMaterial | null = null;
  if (!def.virola && def.lip) {
    lipMat = std(color.paint ?? def.lip, { roughness: 0.6 });
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(def.radius(1) * 0.95, 0.0025, 8, 64),
      lipMat
    );
    lip.rotation.x = Math.PI / 2;
    lip.position.y = H;
    g.add(lip);
  }

  // Materiales de cuero que cambian con el color elegido
  const leatherMat = std(color.leather ?? '#2b2321', { roughness: 0.6 });
  const threadMat = std(color.thread ?? '#6e6157', { roughness: 0.8 });

  if (def.feet) {
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 14, 10), leatherMat);
      foot.scale.set(1.1, 0.7, 1.1);
      foot.position.set(Math.sin(a) * 0.03, 0.007, Math.cos(a) * 0.03);
      g.add(foot);
    }
  }

  if (def.legs) {
    // Base de cuero en cruz: 4 aletas gruesas que bajan pegadas al cuerpo y
    // terminan en patas planas que se juntan abajo formando una "X".
    const FOOT_H = 0.0075;
    const reach = def.radius(0.3) + 0.012;
    const topY = Math.min(0.046, H * 0.42);
    // Perfil de la aleta (x = hacia afuera, y = arriba): el borde de adentro sigue el cuerpo
    const fin = new THREE.Shape();
    fin.moveTo(0, 0);
    fin.lineTo(reach, 0);
    fin.lineTo(reach, FOOT_H * 0.9);
    fin.quadraticCurveTo(reach - 0.003, FOOT_H + 0.002, reach - 0.008, FOOT_H + 0.004);
    fin.bezierCurveTo(
      reach - 0.016,
      FOOT_H + 0.006,
      def.radius(topY / H) + 0.004,
      topY * 0.6,
      def.radius(topY / H) - 0.001,
      topY
    );
    for (let i = 12; i >= 0; i--) {
      const y = (i / 12) * topY;
      fin.lineTo(Math.max(0, def.radius(y / H) - 0.002), y);
    }
    fin.closePath();
    const finGeo = new THREE.ExtrudeGeometry(fin, {
      depth: 0.0095,
      bevelEnabled: true,
      bevelThickness: 0.0024,
      bevelSize: 0.0022,
      bevelSegments: 4,
      curveSegments: 10,
    }).translate(0, 0, -0.00475);
    // Pata plana que asoma un poco a los costados de la aleta
    const pad = new THREE.Shape();
    pad.moveTo(0, -0.0085);
    pad.lineTo(reach - 0.004, -0.0085);
    pad.quadraticCurveTo(reach + 0.0015, -0.0085, reach + 0.0015, -0.002);
    pad.lineTo(reach + 0.0015, 0.002);
    pad.quadraticCurveTo(reach + 0.0015, 0.0085, reach - 0.004, 0.0085);
    pad.lineTo(0, 0.0085);
    pad.closePath();
    const padGeo = new THREE.ExtrudeGeometry(pad, {
      depth: FOOT_H * 0.6,
      bevelEnabled: true,
      bevelThickness: 0.0012,
      bevelSize: 0.0012,
      bevelSegments: 2,
    })
      .rotateX(Math.PI / 2)
      .translate(0, FOOT_H * 0.6 + 0.0012, 0);
    const legMat = leatherMat;
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2;
      const leg = new THREE.Group();
      leg.rotation.y = a - Math.PI / 2;
      leg.add(new THREE.Mesh(finGeo, legMat), new THREE.Mesh(padGeo, legMat));
      // Pespunte a lo largo del borde de la aleta
      for (let i = 0; i < 6; i++) {
        const t = (i + 0.5) / 6;
        const x = THREE.MathUtils.lerp(reach - 0.009, def.radius(topY / H), t);
        const y =
          THREE.MathUtils.lerp(FOOT_H + 0.005, topY - 0.003, t) - Math.sin(t * Math.PI) * 0.006;
        for (const z of [-0.0072, 0.0072]) {
          const st = new THREE.Mesh(new THREE.BoxGeometry(0.0028, 0.0009, 0.0006), threadMat);
          st.position.set(x, y, z);
          st.rotation.z = -0.9;
          leg.add(st);
        }
      }
      g.add(leg);
    }
    // Costuras en "U" sobre el cuerpo, uniendo la parte de arriba de cada aleta
    for (let k = 0; k < 4; k++) {
      const a0 = Math.PI / 4 + (k * Math.PI) / 2;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const a = a0 + t * (Math.PI / 2);
        const y = topY - Math.sin(t * Math.PI) * topY * 0.3;
        const r = def.radius(y / H) + 0.0003;
        pts.push(new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r));
      }
      const seam = new THREE.CatmullRomCurve3(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(seam, 48, 0.0007, 6), legMat));
      for (let i = 1; i < 14; i++) {
        const st = new THREE.Mesh(new THREE.SphereGeometry(0.0008, 6, 4), threadMat);
        st.position.copy(seam.getPoint(i / 14)).multiplyScalar(1.004);
        g.add(st);
      }
    }
  }

  /** Cambia el color del cuero o de la pintura sin reconstruir el mate. */
  const setColor = (id: string) => {
    const next = def.colors?.find((c) => c.id === id);
    if (!next || next.id === color.id) return;
    color = next;
    const old = bodyMat.map;
    bodyMat.map = bodyTexture();
    bodyMat.needsUpdate = true;
    old?.dispose();
    if (def.innerPaint) {
      const oldInner = innerMat.map;
      innerMat.map = innerTexture();
      innerMat.needsUpdate = true;
      oldInner?.dispose();
    }
    if (rimMat && next.paint) rimMat.color.set(next.paint);
    if (next.leather) leatherMat.color.set(next.leather);
    if (next.thread) threadMat.color.set(next.thread);
    if (lipMat && next.paint) lipMat.color.set(next.paint);
  };

  return { group: g, profile, top, setColor };
}

// ─── Bombillas ──────────────────────────────────────────────────────────────
// El origen (0,0,0) es la punta del filtro: así el motor la "clava" en la yerba.

export function buildBombillaModel(style: BombillaStyle) {
  const g = new THREE.Group();

  if (style === 'bombillon') {
    buildBombillon(g);
  } else if (style === 'inoxCurva') {
    buildInoxCurva(g);
  } else if (style === 'chata') {
    buildChata(g);
  } else if (style === 'bohr') {
    buildBohr(g);
  } else {
    buildDosBochas(g);
  }
  return { group: g };
}

// ─── Bombilla dos bochas (modelo detallado) ─────────────────────────────────

const CHROME = () => std('#e4e4e2', { metalness: 1, roughness: 0.12 });

/** Anillo cincelado: filetes en los bordes y trama de rombos al medio. */
function engravedBandTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f1f0ec');
    g.addColorStop(0.5, '#c9c7c1');
    g.addColorStop(1, '#ecebe6');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(40,40,40,0.6)';
    ctx.lineWidth = 2;
    for (const y of [h * 0.14, h * 0.86]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.lineWidth = 1.5;
    for (let x = -h; x < w + h; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.22);
      ctx.lineTo(x + h * 0.56, h * 0.78);
      ctx.moveTo(x + h * 0.56, h * 0.22);
      ctx.lineTo(x, h * 0.78);
      ctx.stroke();
    }
  });
}

/** Frente de la cuchara: cromo con un óvalo de agujeritos. v=0 es la punta. */
function spoonTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.4, h * 0.55, 10, w * 0.5, h * 0.55, w * 0.9);
    g.addColorStop(0, '#f4f4f2');
    g.addColorStop(1, '#a9aaa8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Óvalo perforado (en el canvas la punta queda abajo)
    const cx = w * 0.5;
    const cy = h * 0.6;
    const rx = w * 0.38;
    const ry = h * 0.3;
    ctx.fillStyle = '#1f2021';
    for (let y = cy - ry; y <= cy + ry; y += 17) {
      const row = Math.round((y - cy) / 17);
      for (let x = cx - rx + (row % 2 ? 8 : 0); x <= cx + rx; x += 17) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

/** Superficie de cuchara cóncava con forma de gota (punta redondeada abajo). */
function spoonGeometry(
  length: number,
  maxHalfW: number,
  neckHalfW: number,
  depth: number,
  offsetZ = 0
) {
  const nu = 24;
  const nt = 48;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const halfW = (t: number) => {
    const split = 0.42;
    if (t < split) return maxHalfW * Math.sqrt(Math.max(0, 1 - ((split - t) / split) ** 2));
    const k = (t - split) / (1 - split);
    const smooth = k * k * (3 - 2 * k);
    return maxHalfW + (neckHalfW - maxHalfW) * smooth;
  };
  const bowl = (t: number) => Math.sin(Math.min(t / 0.88, 1) * Math.PI);
  for (let j = 0; j <= nt; j++) {
    const t = j / nt;
    for (let i = 0; i <= nu; i++) {
      const u = (i / nu) * 2 - 1;
      pos.push(halfW(t) * u, t * length, offsetZ - depth * (1 - u * u) * bowl(t));
      uv.push((u + 1) / 2, t);
    }
  }
  for (let j = 0; j < nt; j++) {
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      const b = a + nu + 1;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/** Cuchara de la bombilla de acero: agujeritos en casi toda la gota y el sello INOX arriba. */
function inoxSpoonTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.4, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.95);
    g.addColorStop(0, '#f6f6f4');
    g.addColorStop(1, '#a3a4a2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.5;
    const cy = h * 0.66;
    const rx = w * 0.4;
    const ry = h * 0.27;
    ctx.fillStyle = '#1c1d1e';
    for (let y = cy - ry; y <= cy + ry; y += 16) {
      const row = Math.round((y - cy) / 16);
      for (let x = cx - rx + (row % 2 ? 8 : 0); x <= cx + rx; x += 16) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny > 1) continue;
        ctx.beginPath();
        ctx.arc(x, y, 4.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Sello "INOX" con su logo
    ctx.strokeStyle = 'rgba(60,60,60,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx - 6, h * 0.3, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 10, h * 0.3, 14, 0, Math.PI * 2);
    ctx.stroke();
    text(ctx, 'INOX', cx + 30, h * 0.34, 'bold 18px system-ui', 'rgba(60,60,60,0.75)');
  });
}

/** Moleteado en espiral del agarre. */
function spiralKnurlTexture() {
  const tex = canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = '#d4d6d8';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(35,35,35,0.6)';
    ctx.lineWidth = 2.2;
    for (let i = -h; i < w + h; i += 7) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + h * 0.6, h);
      ctx.stroke();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 3);
  return tex;
}

/** Anillo dorado repujado con cruces (collares del bombillón). */
function goldBandTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#f3dc8c');
    g.addColorStop(0.5, '#b58f34');
    g.addColorStop(1, '#ecd384');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(70,50,10,0.65)';
    ctx.lineWidth = 2;
    for (const y of [h * 0.12, h * 0.88]) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (let x = 0; x < w; x += 32) {
      ctx.strokeRect(x + 4, h * 0.22, 24, h * 0.56);
      ctx.beginPath();
      ctx.moveTo(x + 4, h * 0.22);
      ctx.lineTo(x + 28, h * 0.78);
      ctx.moveTo(x + 28, h * 0.22);
      ctx.lineTo(x + 4, h * 0.78);
      ctx.stroke();
    }
  });
}

/** Cuchara redonda de alpaca con pocos agujeros grandes. */
function roundSpoonTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.5, 10, w * 0.5, h * 0.5, w * 0.9);
    g.addColorStop(0, '#e9e6de');
    g.addColorStop(1, '#9e9a90');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#262524';
    const cx = w * 0.5;
    const cy = h * 0.68;
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) {
        if (x * x + y * y > 10) continue;
        ctx.beginPath();
        ctx.arc(cx + x * 22 + (y % 2 ? 11 : 0), cy + y * 30, 5.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

function buildBombillon(g: THREE.Group) {
  const alpaca = std('#d6d2c8', { metalness: 0.95, roughness: 0.25 });
  const gold = std('#e2c063', { metalness: 1, roughness: 0.2 });
  const goldBand = std('#ffffff', { map: goldBandTexture(), metalness: 1, roughness: 0.3 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    g.add(m);
    return m;
  };
  const cyl = (rTop: number, rBot: number, y0: number, y1: number, seg = 24) =>
    new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg).translate(0, (y0 + y1) / 2, 0);

  // Cuchara redonda y ancha
  const L = 0.05;
  add(
    spoonGeometry(L, 0.0145, 0.0045, 0.004),
    std('#ffffff', {
      map: roundSpoonTexture(),
      metalness: 0.95,
      roughness: 0.28,
      side: THREE.DoubleSide,
    })
  );
  add(
    spoonGeometry(L, 0.0145, 0.0045, 0.004, -0.001),
    std('#cfcbc1', { metalness: 0.95, roughness: 0.25, side: THREE.DoubleSide })
  );
  // Caño inferior liso
  add(cyl(0.0043, 0.0047, L - 0.006, 0.098), alpaca);
  // Collar dorado inferior
  add(cyl(0.0058, 0.0058, 0.098, 0.106), goldBand);
  for (const y of [0.098, 0.106])
    add(
      new THREE.TorusGeometry(0.0058, 0.0009, 8, 24).rotateX(Math.PI / 2).translate(0, y, 0),
      gold
    );
  // Tramo trenzado: 3 cordones gruesos entrelazados
  add(cyl(0.0035, 0.0035, 0.106, 0.178), alpaca);
  for (let k = 0; k < 3; k++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const a = t * Math.PI * 2 * 3 + (k * Math.PI * 2) / 3;
      const r = 0.0036 + 0.0008 * Math.sin(t * Math.PI * 18 + k);
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0.106 + t * 0.072, Math.sin(a) * r));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0021, 8), alpaca);
  }
  // Collar dorado superior (más alto) con molduras
  add(cyl(0.0062, 0.0062, 0.178, 0.191), goldBand);
  for (const y of [0.178, 0.1845, 0.191])
    add(
      new THREE.TorusGeometry(0.0062, 0.001, 8, 24).rotateX(Math.PI / 2).translate(0, y, 0),
      gold
    );
  add(cyl(0.0052, 0.0062, 0.191, 0.197), gold);
  // Boquilla dorada ancha y aplanada
  const mouth = add(cyl(0.0105, 0.0052, 0.197, 0.252, 28), gold);
  mouth.scale.z = 0.42;
  const hole = add(
    new THREE.CircleGeometry(0.0088, 24).rotateX(-Math.PI / 2).translate(0, 0.2521, 0),
    std('#3a2e12', { roughness: 0.6 })
  );
  hole.scale.z = 0.32;
}

/**
 * Bombilla chata: caño de acero aplanado (óvalo) con una curva suave hacia
 * atrás, boca abierta arriba, anillo de tiento dorado cerca de la boca y
 * ranuras de filtro en la punta de abajo.
 */
function buildChata(g: THREE.Group) {
  const N = 40;
  const L = 0.24;
  // Eje curvo (curva en el plano X: de perfil se ve el arco)
  const axis = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.004, 0.08, 0),
    new THREE.Vector3(0.006, 0.16, 0),
    new THREE.Vector3(0.0, L, 0),
  ]);
  // Sección ovalada (ancha en Z = de frente se ve plana y ancha)
  const pos: number[] = [];
  const idx: number[] = [];
  const seg = 20;
  const ry = 0.0062;
  const rx = 0.0026;
  const frames = axis.computeFrenetFrames(N, false);
  for (let i = 0; i <= N; i++) {
    const c = axis.getPointAt(i / N);
    const nrm = frames.normals[i];
    const bin = frames.binormals[i];
    const taper = i === 0 ? 0.6 : 1;
    for (let j = 0; j <= seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      const p = c
        .clone()
        .addScaledVector(nrm, Math.cos(a) * rx * taper)
        .addScaledVector(bin, Math.sin(a) * ry * taper);
      pos.push(p.x, p.y, p.z);
    }
  }
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < seg; j++) {
      const a = i * (seg + 1) + j;
      const b = a + seg + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  g.add(
    new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({
        color: '#dcdcda',
        metalness: 1,
        roughness: 0.12,
        side: THREE.DoubleSide,
      })
    )
  );

  // Boca abierta (interior oscuro)
  const top = axis.getPointAt(1);
  const hole = new THREE.Mesh(
    new THREE.CircleGeometry(1, 20).rotateX(-Math.PI / 2),
    std('#202122', { roughness: 0.6 })
  );
  hole.scale.set(rx * 0.75, 1, ry * 0.8);
  hole.position.copy(top).add(new THREE.Vector3(0, -0.0005, 0));
  g.add(hole);

  // Anillo de tiento dorado cerca de la boca
  const ringT = 0.82;
  const rc = axis.getPointAt(ringT);
  const tan = axis.getTangentAt(ringT);
  const braid = std('#ffffff', { map: braidTexture(), roughness: 0.6 });
  braid.color.set('#d8b46a');
  for (let k = 0; k < 4; k++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.2, 10, 32), braid);
    ring.scale.set(rx * 1.05, ry * 1.03, 0.008);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
    ring.rotateZ(Math.PI / 2);
    ring.position.copy(rc).addScaledVector(tan, (k - 1.5) * 0.0022);
    g.add(ring);
  }

  // Ranuras del filtro en la punta de abajo (en ambas caras)
  const slot = std('#2a2c2e', { roughness: 0.6 });
  for (let k = 0; k < 5; k++) {
    const t = 0.012 + k * 0.007;
    const c = axis.getPointAt(t / L);
    for (const dir of [-1, 1]) {
      const sl = new THREE.Mesh(new THREE.BoxGeometry(0.0004, 0.0028, ry * 1.3), slot);
      sl.position.copy(c).add(new THREE.Vector3(dir * rx * 1.02, 0, 0));
      g.add(sl);
    }
  }
}

/** Paleta de la Bohr: flor de lis y "ALPACA" grabados arriba, agujeritos abajo. */
function bohrSpoonTexture() {
  return canvasTexture(256, 512, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#f3eee2');
    g.addColorStop(0.5, '#c9c2b2');
    g.addColorStop(1, '#ebe5d7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const ink = 'rgba(70,64,52,0.75)';
    // Flor de lis
    const cx = w * 0.5;
    const cy = h * 0.27;
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 6, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const d of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(cx + d * 12, cy + 4, 4, 11, d * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(cx - 14, cy + 12, 28, 3);
    text(ctx, 'ALPACA', cx, h * 0.36, 'bold 22px Georgia, serif', ink);
    // Agujeritos en la parte baja de la gota
    ctx.fillStyle = '#26241f';
    const hy = h * 0.68;
    for (let row = -4; row <= 4; row++) {
      const n = 7 - Math.abs(row) * 0.6;
      for (let k = 0; k < n; k++) {
        const x = cx + (k - (n - 1) / 2) * 20;
        const y = hy + row * 22;
        ctx.beginPath();
        ctx.arc(x, y, 4.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });
}

/**
 * Bombilla Bohr de alpaca: caño liso con una curva larga y suave en el tercio
 * de arriba, tres anillos bajo una boquilla plana que se ensancha, y paleta
 * casi plana con la flor de lis grabada. Sin moleteado ni anillos oscuros.
 */
function buildBohr(g: THREE.Group) {
  const alpaca = std('#e6e0d1', { metalness: 1, roughness: 0.16 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    g.add(m);
    return m;
  };
  // Paleta casi plana con el cuello que abraza el caño
  const L = 0.052;
  add(
    spoonGeometry(L, 0.0132, 0.0046, 0.0016),
    std('#ffffff', {
      map: bohrSpoonTexture(),
      metalness: 1,
      roughness: 0.22,
      side: THREE.DoubleSide,
    })
  );
  add(spoonGeometry(L, 0.0132, 0.0046, 0.0016, -0.0012), alpaca);
  add(new THREE.CylinderGeometry(0.0042, 0.0054, 0.012, 18).translate(0, L - 0.002, 0), alpaca);

  // Caño: recto y después una curva larga y suave
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, L + 0.002, 0),
    new THREE.Vector3(0, 0.12, 0),
    new THREE.Vector3(0.004, 0.165, 0),
    new THREE.Vector3(0.012, 0.2, 0),
    new THREE.Vector3(0.022, 0.224, 0),
  ]);
  add(new THREE.TubeGeometry(curve, 80, 0.0036, 16), alpaca);

  // Tres anillos y boquilla plana que se ensancha, siguiendo la curva
  const tip = curve.getPoint(1);
  const tan = curve.getTangent(1);
  const orient = (m: THREE.Object3D, along: number) => {
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
    m.position.copy(tip).addScaledVector(tan, along);
  };
  for (let k = 0; k < 3; k++) {
    const ring = add(new THREE.TorusGeometry(0.0041, 0.0011, 8, 24).rotateX(Math.PI / 2), alpaca);
    orient(ring, 0.0015 + k * 0.0028);
  }
  const collar = add(new THREE.CylinderGeometry(0.0043, 0.0043, 0.009, 18), alpaca);
  orient(collar, 0.0045);
  const mouth = add(new THREE.CylinderGeometry(0.0078, 0.0042, 0.032, 20), alpaca);
  orient(mouth, 0.009 + 0.016);
  mouth.scale.z = 0.38;
  const hole = add(
    new THREE.CircleGeometry(0.0066, 20).rotateX(-Math.PI / 2),
    std('#24221e', { roughness: 0.6 })
  );
  orient(hole, 0.009 + 0.0321);
  hole.scale.z = 0.3;
}

function buildInoxCurva(g: THREE.Group) {
  const chrome = CHROME();
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    g.add(m);
    return m;
  };
  const cyl = (rTop: number, rBot: number, y0: number, y1: number, seg = 20) =>
    new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg).translate(0, (y0 + y1) / 2, 0);

  // Cuchara grande, levemente inclinada hacia adelante
  const L = 0.066;
  const spoon = new THREE.Group();
  spoon.add(
    new THREE.Mesh(
      spoonGeometry(L, 0.0142, 0.0042, 0.005),
      std('#ffffff', {
        map: inoxSpoonTexture(),
        metalness: 1,
        roughness: 0.16,
        side: THREE.DoubleSide,
      })
    ),
    new THREE.Mesh(
      spoonGeometry(L, 0.0142, 0.0042, 0.005, -0.0011),
      new THREE.MeshStandardMaterial({
        color: '#dcdcda',
        metalness: 1,
        roughness: 0.14,
        side: THREE.DoubleSide,
      })
    )
  );
  spoon.rotation.x = -0.1;
  spoon.position.z = 0.0015;
  g.add(spoon);
  add(cyl(0.0037, 0.0046, L - 0.012, L + 0.004), chrome);

  // Agarre moleteado en espiral
  add(
    cyl(0.0041, 0.0041, L + 0.004, 0.142),
    std('#ffffff', { map: spiralKnurlTexture(), metalness: 1, roughness: 0.3 })
  );
  add(cyl(0.0036, 0.0041, 0.142, 0.146), chrome);

  // Caño liso con tres ranuras
  add(cyl(0.0036, 0.0036, 0.146, 0.178), chrome);
  const groove = std('#2a2b2d', { metalness: 0.8, roughness: 0.4 });
  for (const y of [0.167, 0.1715, 0.176]) {
    add(
      new THREE.TorusGeometry(0.0036, 0.0006, 6, 24).rotateX(Math.PI / 2).translate(0, y, 0),
      groove
    );
  }

  // Curva hacia la boquilla
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.177, 0),
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(0.006, 0.222, 0),
    new THREE.Vector3(0.022, 0.244, 0),
    new THREE.Vector3(0.032, 0.254, 0),
  ]);
  add(new THREE.TubeGeometry(curve, 60, 0.0036, 14), chrome);
  // Boquilla aplanada siguiendo la curva
  const tip = curve.getPoint(1);
  const tan = curve.getTangent(1);
  const mouth = add(new THREE.CylinderGeometry(0.0052, 0.0037, 0.016, 16), chrome);
  mouth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tan);
  mouth.position.copy(tip).addScaledVector(tan, -0.006);
  mouth.scale.z = 0.5;
}

function buildDosBochas(g: THREE.Group) {
  const chrome = CHROME();
  const band = std('#ffffff', { map: engravedBandTexture(), metalness: 1, roughness: 0.25 });
  const add = (geo: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(geo, mat);
    g.add(m);
    return m;
  };
  const cyl = (rTop: number, rBot: number, y0: number, y1: number, seg = 20) =>
    new THREE.CylinderGeometry(rTop, rBot, y1 - y0, seg).translate(0, (y0 + y1) / 2, 0);

  // Filtro tipo cuchara: frente perforado y dorso cromado
  const L = 0.06;
  add(
    spoonGeometry(L, 0.0122, 0.0042, 0.0046),
    std('#ffffff', { map: spoonTexture(), metalness: 1, roughness: 0.18, side: THREE.DoubleSide })
  );
  add(
    spoonGeometry(L, 0.0122, 0.0042, 0.0046, -0.0011),
    new THREE.MeshStandardMaterial({
      color: '#dcdcda',
      metalness: 1,
      roughness: 0.15,
      side: THREE.DoubleSide,
    })
  );
  // Cuello donde el caño entra a la cuchara
  add(cyl(0.0035, 0.0043, L - 0.004, L + 0.008), chrome);

  // Caño inferior liso
  add(cyl(0.0034, 0.0034, L + 0.008, 0.129), chrome);

  // Anillos cincelados + bochas + tramo retorcido
  const ring = (y0: number, y1: number) => {
    add(cyl(0.0045, 0.0045, y0, y1), band);
    for (const y of [y0, y1])
      add(
        new THREE.TorusGeometry(0.0045, 0.0007, 8, 24).rotateX(Math.PI / 2).translate(0, y, 0),
        chrome
      );
  };
  const bocha = (y: number) =>
    add(new THREE.SphereGeometry(0.0088, 32, 24).translate(0, y, 0), chrome);

  ring(0.128, 0.135);
  bocha(0.1438);
  ring(0.1526, 0.1596);

  // Tramo retorcido (torzado) entre las dos bochas
  add(cyl(0.0027, 0.0027, 0.1596, 0.1926), chrome);
  for (let k = 0; k < 3; k++) {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = t * Math.PI * 2 * 2.5 + (k * Math.PI * 2) / 3;
      pts.push(new THREE.Vector3(Math.cos(a) * 0.0024, 0.1596 + t * 0.033, Math.sin(a) * 0.0024));
    }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 90, 0.0013, 8), chrome);
  }

  ring(0.1926, 0.1996);
  bocha(0.2084);
  ring(0.2172, 0.2242);

  // Boquilla aplanada que se ensancha hacia arriba, con la boca abierta
  const mouth = add(cyl(0.0057, 0.0037, 0.2242, 0.262, 24), chrome);
  mouth.scale.z = 0.45;
  const hole = add(
    new THREE.CircleGeometry(0.0048, 20).rotateX(-Math.PI / 2).translate(0, 0.2621, 0),
    std('#202122', { roughness: 0.6 })
  );
  hole.scale.z = 0.38;
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
export function buildShelf(width = SHELF.width, gap = SHELF.gap) {
  const g = new THREE.Group();
  const tex = woodTexture('#9a6a3e', '#4e3018', 1, 17);
  const wood = std('#ffffff', { map: tex, roughness: 0.55 });
  const { depth, board, tiers } = SHELF;
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
export function shelfTierY(tier: number, gap = SHELF.gap) {
  const { board, tiers } = SHELF;
  return (tiers - 1 - tier) * (gap + board) + board;
}
