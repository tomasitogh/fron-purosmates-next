/**
 * Efectos visuales del playground: la yerba dentro del mate (relieve + textura
 * pintada según la marca), el punto suave que usan las partículas y el vapor.
 * Todo por código, sin archivos que descargar.
 */
import * as THREE from 'three';

import type { YerbaBrand } from './catalog';
import { canvasTexture, rng } from './models';

// ─── Yerba dentro del mate ──────────────────────────────────────────────────

type YerbaLook = {
  base: string;
  flecks: string[];
  /** Cantidad de palitos claros a la vista. */
  sticks: number;
  /** Trocitos de hierbas de otro verde (yerbas compuestas). */
  herbs?: string[];
};

const CON_PALO: YerbaLook = {
  base: '#8f9550',
  flecks: ['#7c8440', '#9aa25a', '#6f7a3a', '#a8ad62', '#858c45', '#b4b56e'],
  sticks: 620,
};
const SIN_PALO: YerbaLook = {
  base: '#84933f',
  flecks: ['#74862f', '#93a34a', '#667a2c', '#9fae55', '#7d8f38'],
  sticks: 70,
};
const BARBACUA: YerbaLook = {
  base: '#87804a',
  flecks: ['#7a6f3c', '#958c54', '#6c6434', '#a39a60', '#7f7a40', '#5f5a30'],
  sticks: 430,
};
const COMPUESTA: YerbaLook = {
  ...CON_PALO,
  sticks: 420,
  herbs: ['#4f7d3a', '#6b9a4a', '#3f6b35', '#86a85a'],
};

/** Cómo se ve cada yerba (ver "Referencia" en docs/PLAYGROUND.md). */
const LOOKS: Record<YerbaBrand, YerbaLook> = {
  donomar: CON_PALO,
  playadito: CON_PALO,
  rosamonte: CON_PALO,
  cosmico: CON_PALO,
  baldo: SIN_PALO,
  taragui: SIN_PALO,
  kalena: SIN_PALO,
  lamerced: BARBACUA,
  solylluvia: BARBACUA,
  cbse: COMPUESTA,
  pipore: COMPUESTA,
};

const yerbaCache = new Map<YerbaLook, THREE.Texture>();

/** Textura de la yerba vista desde arriba: hojita triturada, polvo y palitos. */
export function yerbaTexture(brand: YerbaBrand) {
  const look = LOOKS[brand];
  const cached = yerbaCache.get(look);
  if (cached) return cached;
  const tex = canvasTexture(512, 512, (ctx, w, h) => {
    const r = rng(31 + look.sticks);
    ctx.fillStyle = look.base;
    ctx.fillRect(0, 0, w, h);
    // Hojitas trituradas de distintos tamaños
    for (let i = 0; i < 9000; i++) {
      ctx.fillStyle = look.flecks[Math.floor(r() * look.flecks.length)];
      ctx.globalAlpha = 0.55 + r() * 0.45;
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 1.5 + r() * 4.5, 1 + r() * 2.5, r() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const c of look.herbs ?? []) {
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.7 + r() * 0.3;
        ctx.beginPath();
        ctx.ellipse(r() * w, r() * h, 3 + r() * 5, 1.5 + r() * 2.5, r() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Sombritas entre las hojas: le dan profundidad
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = '#2f3a16';
      ctx.globalAlpha = 0.1 + r() * 0.22;
      ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2);
    }
    // Palitos amarillo pálido
    ctx.lineCap = 'round';
    for (let i = 0; i < look.sticks; i++) {
      const x = r() * w;
      const y = r() * h;
      const a = r() * Math.PI;
      const len = 5 + r() * 15;
      ctx.strokeStyle = ['#d9cf9a', '#cfc08a', '#e3dbb0', '#c4b57c'][Math.floor(r() * 4)];
      ctx.globalAlpha = 0.75 + r() * 0.25;
      ctx.lineWidth = 1.4 + r() * 2.2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    // Polvo fino
    for (let i = 0; i < 7000; i++) {
      ctx.fillStyle = r() > 0.5 ? '#c9cc8a' : '#4f5a24';
      ctx.globalAlpha = 0.25 + r() * 0.3;
      ctx.fillRect(r() * w, r() * h, 1, 1);
    }
    ctx.globalAlpha = 1;
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  yerbaCache.set(look, tex);
  return tex;
}

/** Tinte de la yerba seca (deja la textura tal cual) y mojada (verde musgo). */
export const YERBA_TINT_DRY = new THREE.Color('#ffffff');
export const YERBA_TINT_WET = new THREE.Color('#84ad72');

/**
 * Superficie de la yerba: un disco de radio 1 con relieve granulado. Trae un
 * "morph target" con la montañita: del lado -X la yerba se amontona y del lado
 * +X queda el hueco donde se echa el agua y va la bombilla. El motor mezcla
 * entre las dos formas con `morphTargetInfluences[0]` (0 = recién volcada).
 */
export function yerbaMoundGeometry() {
  const RINGS = 16;
  const SEGS = 56;
  const r = rng(77);
  const flat: number[] = [0, 0, 0];
  const mound: number[] = [0, 0, 0];
  const uv: number[] = [0.5, 0.5];
  const index: number[] = [];

  const grain = (x: number, z: number) =>
    Math.sin(x * 9.1 + z * 4.3) * 0.016 +
    Math.sin(x * 17.7 - z * 13.1 + 1.3) * 0.011 +
    Math.sin(z * 23.3 + x * 5.9 + 0.4) * 0.008;

  for (let i = 1; i <= RINGS; i++) {
    const rad = i / RINGS;
    // Contra la pared del mate no hay relieve: así no asoma por fuera
    const edge = 1 - Math.pow(rad, 5);
    for (let j = 0; j < SEGS; j++) {
      const a = (j / SEGS) * Math.PI * 2;
      const x = Math.cos(a) * rad;
      const z = Math.sin(a) * rad;
      const bump = (grain(x, z) + (r() - 0.5) * 0.03) * edge;
      flat.push(x, bump + 0.05 * edge, z);
      const hill = 0.3 * Math.exp(-((x + 0.38) ** 2 + z * z) / 0.3);
      const hole = 0.34 * Math.exp(-((x - 0.42) ** 2 + z * z) / 0.11);
      mound.push(x, bump * 1.4 + (hill - hole) * edge, z);
      uv.push(x * 0.5 + 0.5, z * 0.5 + 0.5);
    }
  }
  // Abanico central + anillos
  for (let j = 0; j < SEGS; j++) index.push(0, 1 + ((j + 1) % SEGS), 1 + j);
  for (let i = 0; i < RINGS - 1; i++) {
    for (let j = 0; j < SEGS; j++) {
      const a = 1 + i * SEGS + j;
      const b = 1 + i * SEGS + ((j + 1) % SEGS);
      const c = a + SEGS;
      const d = b + SEGS;
      index.push(a, b, c, b, d, c);
    }
  }

  const build = (pos: number[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  };
  const geo = build(flat);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const target = build(mound);
  geo.morphAttributes.position = [target.attributes.position];
  geo.morphAttributes.normal = [target.attributes.normal];
  return geo;
}

// ─── Partículas ─────────────────────────────────────────────────────────────

let dot: THREE.Texture | null = null;

/** Punto redondo con borde suave (para que las partículas no sean cuadraditos). */
export function softDotTexture() {
  if (dot) return dot;
  dot = canvasTexture(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.85)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
  return dot;
}

// ─── Vapor ──────────────────────────────────────────────────────────────────

type Puff = { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; life: number; max: number };

/** Vaporcito del agua caliente: unas pocas nubes que suben, crecen y se apagan. */
export class Steam {
  readonly group = new THREE.Group();
  private puffs: Puff[] = [];
  private acc = 0;

  constructor(count = 18) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({
        map: softDotTexture(),
        color: '#ffffff',
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.visible = false;
      this.group.add(sprite);
      this.puffs.push({ sprite, mat, life: 0, max: 0 });
    }
  }

  /** Emite vapor desde `at` (mundo) a razón de `rate` nubes por segundo. */
  emit(at: THREE.Vector3, radius: number, rate: number, dt: number) {
    this.acc += rate * dt;
    while (this.acc >= 1) {
      this.acc -= 1;
      const p = this.puffs.find((q) => !q.sprite.visible);
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * radius;
      p.sprite.position.set(at.x + Math.cos(a) * d, at.y, at.z + Math.sin(a) * d);
      p.sprite.material.rotation = Math.random() * Math.PI;
      p.life = 0;
      p.max = 1.5 + Math.random() * 1.1;
      p.sprite.visible = true;
    }
  }

  update(dt: number) {
    for (const p of this.puffs) {
      if (!p.sprite.visible) continue;
      p.life += dt;
      const t = p.life / p.max;
      if (t >= 1) {
        p.sprite.visible = false;
        continue;
      }
      p.sprite.position.y += (0.075 - 0.04 * t) * dt;
      p.sprite.position.x += Math.sin(p.life * 2.1 + p.max * 9) * 0.006 * dt;
      p.sprite.scale.setScalar(0.018 + 0.07 * t);
      p.mat.opacity = 0.2 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * (1 - t * 0.4);
    }
  }

  clear() {
    for (const p of this.puffs) p.sprite.visible = false;
  }
}

// ─── Agua del mate ──────────────────────────────────────────────────────────

let mateWater: THREE.Texture | null = null;

/**
 * Agua dentro del mate vista desde arriba: verdosa y translúcida (se adivina la
 * yerba debajo) con la espumita que se junta contra el borde al cebar.
 */
export function mateWaterTexture() {
  if (mateWater) return mateWater;
  mateWater = canvasTexture(256, 256, (ctx, w, h) => {
    const r = rng(53);
    const c = w / 2;
    ctx.clearRect(0, 0, w, h);
    // Agua: oliva oscuro, y el borde se desvanece para fundirse con la yerba mojada
    const g = ctx.createRadialGradient(c, c, 0, c, c, c);
    g.addColorStop(0, 'rgba(70,84,30,0.62)');
    g.addColorStop(0.8, 'rgba(84,96,36,0.7)');
    g.addColorStop(1, 'rgba(84,96,36,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // Espuma: burbujas crema, tupidas en un anillo y algunas sueltas en el medio
    for (let i = 0; i < 560; i++) {
      const ring = r() < 0.78;
      const rad = (ring ? 0.5 + r() * 0.36 : r() * 0.5) * c;
      const a = r() * Math.PI * 2;
      const x = c + Math.cos(a) * rad;
      const y = c + Math.sin(a) * rad;
      const s = 1.5 + r() * (ring ? 5.5 : 3);
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(206,210,150,${0.16 + r() * 0.28})`;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(232,232,190,${0.4 + r() * 0.4})`;
      ctx.stroke();
    }
  });
  return mateWater;
}
