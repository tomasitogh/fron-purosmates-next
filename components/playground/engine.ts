/**
 * Motor 3D del playground "Cebá tu mate" (Three.js, sin React).
 *
 * Responsabilidades:
 *  - Construir la escena: cuarto de día, ventana con paisaje, mesa y los objetos.
 *  - Manejar la cámara en primera persona (arrastrar / giroscopio para mirar).
 *  - Detectar clicks sobre objetos (raycasting) para elegir el equipo.
 *  - Correr la máquina de estados de la preparación (yerba → inclinar → agua …).
 *
 * La UI (botones, textos, medidores) vive en React (`MateGame.tsx`) y se
 * entera de lo que pasa acá a través de `onChange(snapshot)`.
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

import {
  CATEGORY_ORDER,
  OPTIONS,
  POUR_TARGET,
  STEPS,
  type BombillaShape,
  type Category,
  type MateShape,
  type Option,
  type Step,
  type TermoShape,
  type YerbaShape,
} from './catalog';

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type Phase = 'choose' | 'prepare' | 'done';

export type Snapshot = {
  phase: Phase;
  focus: Category | null;
  selection: Partial<Record<Category, string>>;
  hovered: string | null;
  step: Step;
  meter: number;
  holding: boolean;
  waitLeft: number;
  tiltDeg: number;
  toast: { id: number; text: string; tone: 'info' | 'good' | 'warn' } | null;
  scores: Partial<Record<Step, number>>;
  finalScore: number | null;
};

export type EngineEvent =
  | { name: 'select'; category: Category; optionId: string }
  | { name: 'prepare_start' }
  | { name: 'step'; step: Step }
  | { name: 'complete'; score: number };

export type EngineCallbacks = {
  onChange: (s: Snapshot) => void;
  onEvent?: (e: EngineEvent) => void;
};

// ─── Constantes de la escena (unidades: metros) ─────────────────────────────

const TABLE_Y = 0.75;
const EYE = new THREE.Vector3(0, 1.28, 0.78);
const MAT_Y = TABLE_Y + 0.006;

/** Ángulo (respecto a mirar de frente) y distancia de cada zona sobre la mesa. */
const ZONES: Record<Category, { angle: number; spacing: number; anchorH: number }> = {
  yerba: { angle: THREE.MathUtils.degToRad(34), spacing: 0.15, anchorH: 0.3 },
  bombilla: { angle: THREE.MathUtils.degToRad(12), spacing: 0.085, anchorH: 0.31 },
  mate: { angle: THREE.MathUtils.degToRad(-11), spacing: 0.17, anchorH: 0.22 },
  termo: { angle: THREE.MathUtils.degToRad(-33), spacing: 0.15, anchorH: 0.44 },
};
const ZONE_RADIUS = 1.1;
const OVERVIEW_PITCH = -0.32;

const PREP = {
  mate: new THREE.Vector3(0, MAT_Y, 0.3),
  yerba: new THREE.Vector3(-0.34, MAT_Y, 0.24),
  termo: new THREE.Vector3(0.4, MAT_Y, 0.2),
  bombilla: new THREE.Vector3(-0.13, MAT_Y + 0.006, 0.45),
};

const PREP_LOOK = new THREE.Vector3(0, TABLE_Y - 0.05, 0.3);

const YERBA_DRY = new THREE.Color('#a9ad4e');
const YERBA_WET = new THREE.Color('#4d6a26');

// ─── Helpers ────────────────────────────────────────────────────────────────

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt));
const clamp = THREE.MathUtils.clamp;

function yawPitchTo(p: THREE.Vector3) {
  const d = p.clone().sub(EYE);
  return {
    yaw: Math.atan2(-d.x, -d.z),
    pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)),
  };
}

function quatZ(rad: number, yaw = 0) {
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, rad, 'YXZ'));
}

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  draw(ctx);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/** Pseudo-aleatorio determinístico para que la escena se vea igual siempre. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function woodTexture(base: string, dark: string, planks = 1, seed = 7) {
  const r = rng(seed);
  return canvasTexture(1024, 512, (ctx) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);
    const plankH = 512 / planks;
    for (let p = 0; p < planks; p++) {
      for (let i = 0; i < 70; i++) {
        const y = p * plankH + r() * plankH;
        ctx.strokeStyle = dark;
        ctx.globalAlpha = 0.05 + r() * 0.18;
        ctx.lineWidth = 0.6 + r() * 2.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x <= 1024; x += 64) {
          ctx.lineTo(x, y + Math.sin(x * 0.006 + i) * (2 + r() * 5));
        }
        ctx.stroke();
      }
      if (planks > 1) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = dark;
        ctx.fillRect(0, p * plankH, 1024, 2);
      }
    }
    ctx.globalAlpha = 1;
  });
}

function skyTexture() {
  const W = 2048;
  const H = 1024;
  const r = rng(42);
  return canvasTexture(W, H, (ctx) => {
    const horizon = H * 0.56;
    const sky = ctx.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, '#5aa9e6');
    sky.addColorStop(0.6, '#a5d4f3');
    sky.addColorStop(1, '#e4f3fb');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, horizon);

    // Sol con halo (coincide con la luz direccional que entra por la derecha)
    const sx = W * 0.66;
    const sy = H * 0.2;
    const glow = ctx.createRadialGradient(sx, sy, 10, sx, sy, 380);
    glow.addColorStop(0, 'rgba(255,250,225,1)');
    glow.addColorStop(0.12, 'rgba(255,244,200,0.9)');
    glow.addColorStop(1, 'rgba(255,244,200,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, horizon);

    // Nubes
    for (let n = 0; n < 14; n++) {
      const cx = r() * W;
      const cy = H * (0.14 + r() * 0.26);
      const s = 30 + r() * 50;
      ctx.fillStyle = `rgba(255,255,255,${0.55 + r() * 0.35})`;
      for (let k = 0; k < 7; k++) {
        ctx.beginPath();
        ctx.ellipse(
          cx + (k - 3) * s * 0.7,
          cy + Math.sin(k * 1.7) * s * 0.25,
          s * (0.7 + r() * 0.5),
          s * (0.45 + r() * 0.3),
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Lomas lejanas
    ctx.fillStyle = '#9cc3a6';
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    for (let x = 0; x <= W; x += 32)
      ctx.lineTo(x, horizon - 40 - Math.sin(x * 0.004) * 28 - Math.sin(x * 0.011) * 12);
    ctx.lineTo(W, horizon);
    ctx.fill();

    // Pasto
    const grass = ctx.createLinearGradient(0, horizon, 0, H);
    grass.addColorStop(0, '#86b95b');
    grass.addColorStop(1, '#4f8a39');
    ctx.fillStyle = grass;
    ctx.fillRect(0, horizon, W, H - horizon);

    // Casitas
    const houseColors = ['#f2e1c6', '#e8c7a8', '#f6f0e4', '#d9e4ec', '#f0d7d1'];
    for (let i = 0; i < 16; i++) {
      const w = 60 + r() * 70;
      const h = 40 + r() * 35;
      const x = r() * W;
      const y = horizon - h + 8 + r() * 18;
      ctx.fillStyle = houseColors[i % houseColors.length];
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = r() > 0.5 ? '#b4553c' : '#7d4a35';
      ctx.beginPath();
      ctx.moveTo(x - 6, y);
      ctx.lineTo(x + w / 2, y - h * 0.55);
      ctx.lineTo(x + w + 6, y);
      ctx.fill();
      ctx.fillStyle = '#6f8ea3';
      ctx.fillRect(x + w * 0.18, y + h * 0.3, w * 0.2, h * 0.28);
      ctx.fillRect(x + w * 0.6, y + h * 0.3, w * 0.2, h * 0.28);
    }

    // Árboles
    for (let i = 0; i < 70; i++) {
      const x = r() * W;
      const y = horizon + r() * 60;
      const s = 18 + r() * 34;
      ctx.fillStyle = '#5b4030';
      ctx.fillRect(x - 3, y - 4, 6, 24);
      ctx.fillStyle = ['#3f7d3a', '#4f8f43', '#2f6a33', '#679f4d'][i % 4];
      ctx.beginPath();
      ctx.arc(x, y - s * 0.6, s, 0, Math.PI * 2);
      ctx.arc(x - s * 0.6, y - s * 0.2, s * 0.7, 0, Math.PI * 2);
      ctx.arc(x + s * 0.6, y - s * 0.25, s * 0.75, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function yerbaLabelTexture(opt: Option, shape: YerbaShape) {
  const dark = shape.pack === '#2b2b2b';
  return canvasTexture(256, 512, (ctx) => {
    ctx.fillStyle = shape.pack;
    ctx.fillRect(0, 0, 256, 512);
    ctx.fillStyle = shape.band;
    ctx.fillRect(0, 60, 256, 70);
    ctx.fillStyle = dark ? '#111' : '#fff';
    ctx.font = 'bold 34px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('YERBA', 128, 108);
    ctx.fillStyle = dark ? '#f5f5dc' : '#254642';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.fillText('MATE', 128, 190);
    // Hojita
    ctx.fillStyle = shape.leaf;
    ctx.beginPath();
    ctx.ellipse(128, 285, 34, 62, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = dark ? '#2b2b2b' : shape.pack;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(100, 330);
    ctx.lineTo(158, 240);
    ctx.stroke();
    ctx.fillStyle = dark ? '#f5f5dc' : '#333';
    ctx.font = '600 24px system-ui, sans-serif';
    const words = opt.name.split(' ');
    ctx.fillText(words.slice(0, 2).join(' '), 128, 400);
    if (words.length > 2) ctx.fillText(words.slice(2).join(' '), 128, 432);
    ctx.fillStyle = shape.band;
    ctx.fillRect(0, 470, 256, 42);
    ctx.fillStyle = dark ? '#111' : '#fff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText('1 kg', 128, 499);
  });
}

// ─── Partículas (yerba que cae, gotas) ──────────────────────────────────────

class Particles {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private killY: Float32Array;
  private cursor = 0;

  constructor(
    private max: number,
    color: string,
    size: number
  ) {
    this.pos = new Float32Array(max * 3).fill(-100);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);
    this.killY = new Float32Array(max);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
  }

  spawn(p: THREE.Vector3, v: THREE.Vector3, killY: number) {
    const i = this.cursor;
    this.cursor = (this.cursor + 1) % this.max;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = 3;
    this.killY[i] = killY;
  }

  update(dt: number) {
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) continue;
      this.life[i] -= dt;
      this.vel[i * 3 + 1] -= 9.8 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      if (this.pos[i * 3 + 1] < this.killY[i] || this.life[i] <= 0) {
        this.life[i] = 0;
        this.pos[i * 3 + 1] = -100;
      }
    }
    this.points.geometry.attributes.position.needsUpdate = true;
  }

  clear() {
    this.life.fill(0);
    for (let i = 0; i < this.max; i++) this.pos[i * 3 + 1] = -100;
  }
}

// ─── Objetos de la mesa ─────────────────────────────────────────────────────

type MateParts = {
  profile: THREE.Vector2[];
  top: number;
  yerbaPivot: THREE.Group;
  yerbaMat: THREE.MeshStandardMaterial;
  water: THREE.Mesh;
};

type Item = {
  opt: Option;
  group: THREE.Group;
  homePos: THREE.Vector3;
  homeQuat: THREE.Quaternion;
  tPos: THREE.Vector3;
  tQuat: THREE.Quaternion;
  tScale: number;
  managed: boolean;
  ring: THREE.Mesh;
  ringMat: THREE.MeshBasicMaterial;
  mate?: MateParts;
  /** Punto local por donde sale la yerba (paquete) o el agua (termo). */
  mouth?: THREE.Vector3;
};

function std(color: string, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
}

function shadowed<T extends THREE.Object3D>(o: T): T {
  o.traverse((c) => {
    if ((c as THREE.Mesh).isMesh) {
      c.castShadow = true;
      c.receiveShadow = true;
    }
  });
  return o;
}

/** Collider invisible y grande para que los objetos finos sean fáciles de tocar. */
function hitbox(radius: number, height: number) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 10).translate(0, height / 2, 0),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  m.userData.hitbox = true;
  return m;
}

function buildYerba(opt: Option, shape: YerbaShape) {
  const g = new THREE.Group();
  const w = 0.11;
  const h = 0.21;
  const d = 0.065;
  const label = yerbaLabelTexture(opt, shape);
  const side = std(shape.band, { roughness: 0.8 });
  const front = std('#ffffff', { map: label, roughness: 0.75 });
  const top = std(shape.pack, { roughness: 0.85 });
  const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [
    side,
    side,
    top,
    top,
    front,
    front,
  ]);
  // Pliegue superior del paquete
  const fold = new THREE.Mesh(
    new THREE.BoxGeometry(w * 0.98, 0.02, d * 0.4).translate(0, h + 0.01, 0),
    top
  );
  g.add(box, fold, hitbox(0.07, 0.24));
  return { group: g, mouth: new THREE.Vector3(w * 0.42, h + 0.01, 0) };
}

function buildBombilla(shape: BombillaShape) {
  const g = new THREE.Group();
  const metal = std(shape.metal, { metalness: 0.95, roughness: 0.22 });
  const L = 0.24;
  if (shape.style === 'pico') {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.02, 0),
      new THREE.Vector3(0, 0.17, 0),
      new THREE.Vector3(0.008, 0.215, 0),
      new THREE.Vector3(0.032, 0.238, 0),
    ]);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.0036, 10), metal));
    const paleta = new THREE.Mesh(new THREE.SphereGeometry(0.012, 20, 12), metal);
    paleta.scale.set(1.4, 1.6, 0.45);
    paleta.position.y = 0.017;
    g.add(paleta);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.005, 12, 8), metal);
    tip.scale.set(1.3, 0.6, 1);
    tip.position.set(0.034, 0.239, 0);
    g.add(tip);
  } else {
    const tube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0034, 0.0034, L - 0.02, 12).translate(
        0,
        0.02 + (L - 0.02) / 2,
        0
      ),
      metal
    );
    g.add(tube);
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0034, 0.012, 12), metal);
    mouth.scale.z = 0.6;
    mouth.position.y = L;
    g.add(mouth);
    if (shape.style === 'recta') {
      const filtro = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0075, 0.0075, 0.032, 16).translate(0, 0.016, 0),
        metal
      );
      g.add(filtro);
    } else {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 120; i++) {
        const t = i / 120;
        const a = t * Math.PI * 2 * 9;
        pts.push(new THREE.Vector3(Math.cos(a) * 0.0075, 0.002 + t * 0.042, Math.sin(a) * 0.0075));
      }
      g.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 240, 0.0012, 6),
          metal
        )
      );
    }
  }
  g.add(hitbox(0.028, 0.26));
  return { group: g };
}

const MATE_PROFILES: Record<MateShape['style'], { body: number[][]; rim: number[][] }> = {
  imperial: {
    body: [
      [0, 0.012],
      [0.03, 0.012],
      [0.04, 0.02],
      [0.055, 0.04],
      [0.063, 0.065],
      [0.062, 0.09],
      [0.054, 0.112],
      [0.044, 0.126],
      [0.04, 0.13],
    ],
    rim: [
      [0.039, 0.124],
      [0.046, 0.127],
      [0.048, 0.142],
      [0.043, 0.147],
      [0.039, 0.146],
    ],
  },
  camionero: {
    body: [
      [0, 0.01],
      [0.045, 0.01],
      [0.052, 0.018],
      [0.064, 0.045],
      [0.067, 0.075],
      [0.064, 0.098],
      [0.059, 0.108],
    ],
    rim: [
      [0.057, 0.102],
      [0.065, 0.105],
      [0.066, 0.12],
      [0.061, 0.123],
      [0.057, 0.122],
    ],
  },
  torpedo: {
    body: [
      [0, 0.008],
      [0.03, 0.008],
      [0.035, 0.018],
      [0.043, 0.055],
      [0.045, 0.1],
      [0.041, 0.14],
      [0.035, 0.16],
      [0.032, 0.166],
    ],
    rim: [
      [0.031, 0.161],
      [0.036, 0.164],
      [0.036, 0.174],
      [0.031, 0.175],
    ],
  },
};

function radiusAt(profile: THREE.Vector2[], y: number) {
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1];
    const b = profile[i];
    if (y <= b.y) {
      const t = clamp((y - a.y) / Math.max(b.y - a.y, 1e-5), 0, 1);
      return THREE.MathUtils.lerp(a.x, b.x, t);
    }
  }
  return profile[profile.length - 1].x;
}

function buildMate(shape: MateShape) {
  const g = new THREE.Group();
  const def = MATE_PROFILES[shape.style];
  const profile = def.body.map(([x, y]) => new THREE.Vector2(x, y));
  const bodyMat =
    shape.style === 'torpedo'
      ? std('#ffffff', {
          map: woodTexture(shape.body, '#4a2c16', 1, 11),
          roughness: 0.55,
          side: THREE.DoubleSide,
        })
      : std(shape.body, { roughness: 0.78, side: THREE.DoubleSide });
  const metal = std(shape.rim, { metalness: 0.95, roughness: 0.25, side: THREE.DoubleSide });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 48), bodyMat));
  g.add(
    new THREE.Mesh(
      new THREE.LatheGeometry(
        def.rim.map(([x, y]) => new THREE.Vector2(x, y)),
        48
      ),
      metal
    )
  );
  // Pie (base metálica)
  const baseR = def.body[1][0];
  g.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(baseR * 0.9, baseR, def.body[0][1], 32).translate(
        0,
        def.body[0][1] / 2,
        0
      ),
      metal
    )
  );
  // Costura decorativa en el cuero
  if (shape.style !== 'torpedo') {
    const ringY = profile[4].y;
    const stitch = new THREE.Mesh(
      new THREE.TorusGeometry(radiusAt(profile, ringY) + 0.0008, 0.0012, 6, 64),
      std('#e8dcc0', { roughness: 0.9 })
    );
    stitch.rotation.x = Math.PI / 2;
    stitch.position.y = ringY;
    g.add(stitch);
  }

  const top = def.rim[def.rim.length - 1][1];

  // Superficie de la yerba (un disco que sube con el llenado y se inclina)
  const yerbaMat = std('#ffffff', { color: YERBA_DRY.clone(), roughness: 1 });
  const yerbaPivot = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1, 40), yerbaMat);
  disc.rotation.x = -Math.PI / 2;
  disc.receiveShadow = true;
  yerbaPivot.add(disc);
  yerbaPivot.visible = false;
  g.add(yerbaPivot);

  const water = new THREE.Mesh(
    new THREE.CircleGeometry(1, 32).rotateX(-Math.PI / 2),
    std('#8f9c3c', { roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.88 })
  );
  water.visible = false;
  g.add(water);

  g.add(hitbox(0.075, 0.2));
  return { group: g, mate: { profile, top, yerbaPivot, yerbaMat, water } satisfies MateParts };
}

function buildTermo(shape: TermoShape) {
  const g = new THREE.Group();
  const h = shape.height;
  const r = 0.045;
  const bodyH = h - 0.07;
  const body = std(shape.body, { metalness: 0.45, roughness: 0.38 });
  const cap = std(shape.cap, { roughness: 0.5 });
  const steel = std('#cfd3d6', { metalness: 1, roughness: 0.28 });
  g.add(
    new THREE.Mesh(new THREE.CylinderGeometry(r, r, bodyH, 40).translate(0, bodyH / 2, 0), body)
  );
  g.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(r * 1.01, r * 1.01, 0.012, 40).translate(0, 0.006, 0),
      steel
    )
  );
  g.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, r, 0.03, 40).translate(0, bodyH + 0.015, 0),
      steel
    )
  );
  g.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.033, 0.04, 32).translate(0, bodyH + 0.05, 0),
      cap
    )
  );
  // Pico cebador
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.03, 16), cap);
  spout.rotation.z = Math.PI / 2;
  spout.position.set(-0.038, h - 0.03, 0);
  g.add(spout);
  // Manija
  const handle = new THREE.Mesh(new THREE.TorusGeometry(bodyH * 0.32, 0.008, 10, 28, Math.PI), cap);
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(r, bodyH * 0.55, 0);
  handle.scale.x = 0.45;
  g.add(handle);
  g.add(hitbox(0.07, h + 0.02));
  return { group: g, mouth: new THREE.Vector3(-0.054, h - 0.03, 0) };
}

// ─── Motor ──────────────────────────────────────────────────────────────────

export class MateEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private clock = new THREE.Clock();
  private raf = 0;
  private disposed = false;
  private raycaster = new THREE.Raycaster();
  private items: Item[] = [];
  private hotspots: Partial<Record<Category, HTMLElement>> = {};
  private yerbaFx = new Particles(500, '#8c9a3a', 0.006);
  private dropFx = new Particles(300, '#cfe8ff', 0.005);
  private stream: THREE.Mesh;
  private dust: THREE.Points;
  private resizeObs: ResizeObserver;

  // Cámara
  private yaw = 0;
  private pitch = OVERVIEW_PITCH;
  private yawT = 0;
  private pitchT = OVERVIEW_PITCH;
  private fovT = 55;
  private gyro: { a: number; b: number; ga: number; gb: number } | null = null;
  private gyroOffset = { yaw: 0, pitch: 0 };

  // Puntero
  private pointer: { id: number; x: number; y: number; t: number; dragged: boolean } | null = null;

  // Estado de juego
  private s: Snapshot = {
    phase: 'choose',
    focus: null,
    selection: {},
    hovered: null,
    step: 'grab',
    meter: 0,
    holding: false,
    waitLeft: 5,
    tiltDeg: 0,
    toast: null,
    scores: {},
    finalScore: null,
  };
  private toastSeq = 0;
  private yerbaFill = 0;
  private slope = 0;
  private wet = 0;
  private wetT = 0;
  private waterShown = 0;
  private bombillaAnim: 'none' | 'lift' | 'insert' | 'done' = 'none';
  private drinkT = 0;
  private stepTimer = 0;
  private lastEmit = 0;
  private dirty = true;

  constructor(
    private host: HTMLElement,
    private cb: EngineCallbacks
  ) {
    const mobile = window.matchMedia('(pointer: coarse)').matches;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.75 : 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.domElement.style.touchAction = 'none';
    this.renderer.domElement.style.display = 'block';
    host.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.02, 80);
    this.camera.position.copy(EYE);

    this.buildRoom(mobile);
    this.buildItems();

    this.stream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0035, 0.0045, 1, 10).translate(0, -0.5, 0),
      std('#d9eeff', { transparent: true, opacity: 0.65, roughness: 0.05 })
    );
    this.stream.visible = false;
    this.scene.add(this.stream, this.yerbaFx.points, this.dropFx.points);

    this.dust = this.buildDust();
    this.scene.add(this.dust);

    this.resizeObs = new ResizeObserver(() => this.resize());
    this.resizeObs.observe(host);
    this.resize();

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('pointercancel', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.loop();
    this.emit(true);
  }

  // ── Construcción de la escena ────────────────────────────────────────────

  private buildRoom(mobile: boolean) {
    const sc = this.scene;
    sc.background = new THREE.Color('#cfe6f5');

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    sc.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    sc.environmentIntensity = 0.45;
    pmrem.dispose();

    sc.add(new THREE.HemisphereLight('#e3f1ff', '#c9a37c', 1.25));
    const sun = new THREE.DirectionalLight('#fff0d4', 3.2);
    sun.position.set(2.6, 5.2, -7.5);
    sun.target.position.set(0, TABLE_Y, 0);
    sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    sun.shadow.camera.left = -2.2;
    sun.shadow.camera.right = 2.2;
    sun.shadow.camera.top = 2.2;
    sun.shadow.camera.bottom = -2.2;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 16;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    sc.add(sun, sun.target);
    const windowFill = new THREE.DirectionalLight('#d6ebff', 0.7);
    windowFill.position.set(-1, 2, -3);
    sc.add(windowFill);

    // Paisaje de afuera (sin luz: siempre brillante, como el día)
    const outside = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 30),
      new THREE.MeshBasicMaterial({ map: skyTexture(), toneMapped: false })
    );
    outside.position.set(0, 3, -14);
    sc.add(outside);

    // Paredes con hueco de ventana
    const wallMat = std('#f3ead9', { roughness: 0.95 });
    const WZ = -1.0;
    const winL = -1.6;
    const winR = 1.6;
    const winB = 0.95;
    const winT = 2.6;
    const wallH = 3.1;
    const thick = 0.14;
    const addWall = (x0: number, x1: number, y0: number, y1: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, thick), wallMat);
      m.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ);
      m.castShadow = true;
      m.receiveShadow = true;
      sc.add(m);
    };
    addWall(-3, winL, 0, wallH);
    addWall(winR, 3, 0, wallH);
    addWall(winL, winR, 0, winB);
    addWall(winL, winR, winT, wallH);

    // Marco y parteluces de la ventana
    const frameMat = std('#fbfaf6', { roughness: 0.5 });
    const bar = (w: number, h: number, x: number, y: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.06), frameMat);
      m.position.set(x, y, WZ + 0.03);
      m.castShadow = true;
      sc.add(m);
    };
    bar(winR - winL + 0.08, 0.06, 0, winT);
    bar(winR - winL + 0.08, 0.06, 0, winB);
    bar(0.06, winT - winB, winL, (winB + winT) / 2);
    bar(0.06, winT - winB, winR, (winB + winT) / 2);
    bar(0.04, winT - winB, -0.53, (winB + winT) / 2);
    bar(0.04, winT - winB, 0.53, (winB + winT) / 2);
    bar(winR - winL, 0.035, 0, 2.05);
    // Alféizar
    const sill = new THREE.Mesh(new THREE.BoxGeometry(winR - winL + 0.2, 0.04, 0.26), frameMat);
    sill.position.set(0, winB - 0.01, WZ + 0.08);
    sill.receiveShadow = true;
    sill.castShadow = true;
    sc.add(sill);

    // Cortinas livianas
    const curtainMat = std('#fff8ec', {
      roughness: 1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
    });
    for (const sx of [-1, 1]) {
      const geo = new THREE.PlaneGeometry(0.55, 2.3, 24, 1);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.025);
      geo.computeVertexNormals();
      const c = new THREE.Mesh(geo, curtainMat);
      c.position.set(sx * 1.85, 1.75, WZ + 0.12);
      c.castShadow = true;
      sc.add(c);
    }

    // Plantas en el alféizar
    const potMat = std('#c0643c', { roughness: 0.9 });
    const leafMat = std('#3f8a3c', { roughness: 0.7 });
    for (const px of [-1.15, 1.2]) {
      const plant = new THREE.Group();
      plant.add(
        new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.06, 0.14, 20).translate(0, 0.07, 0),
          potMat
        )
      );
      const r = rng(px > 0 ? 3 : 9);
      for (let i = 0; i < 9; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05 + r() * 0.03, 12, 8), leafMat);
        leaf.position.set((r() - 0.5) * 0.14, 0.18 + r() * 0.14, (r() - 0.5) * 0.1);
        leaf.scale.set(1, 0.7, 1);
        plant.add(leaf);
      }
      plant.position.set(px, winB + 0.01, WZ + 0.08);
      sc.add(shadowed(plant));
    }

    // Laterales, piso y techo
    const side = (x: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4.2, wallH), wallMat);
      m.position.set(x, wallH / 2, 1.1);
      m.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2;
      m.receiveShadow = true;
      sc.add(m);
    };
    side(-3);
    side(3);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(6, wallH), wallMat);
    back.position.set(0, wallH / 2, 3.2);
    back.rotation.y = Math.PI;
    sc.add(back);
    const floorTex = woodTexture('#b98b5e', '#6d4b2e', 6, 3);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(3, 3);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 4.2),
      std('#ffffff', { map: floorTex, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 1.1);
    floor.receiveShadow = true;
    sc.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 4.2), std('#fbf8f2'));
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, wallH, 1.1);
    sc.add(ceil);

    // Cuadro en la pared izquierda
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.6, 0.8),
      std('#ffffff', {
        map: canvasTexture(512, 384, (ctx) => {
          ctx.fillStyle = '#254642';
          ctx.fillRect(0, 0, 512, 384);
          ctx.fillStyle = '#D4AF37';
          ctx.font = 'bold 64px Georgia, serif';
          ctx.textAlign = 'center';
          ctx.fillText('Puros', 256, 170);
          ctx.fillText('Mates', 256, 245);
          ctx.fillStyle = '#F5F5DC';
          ctx.font = '24px system-ui, sans-serif';
          ctx.fillText('mates artesanales argentinos', 256, 300);
        }),
      })
    );
    frame.position.set(-2.97, 1.75, 0.3);
    sc.add(frame);

    // Mesa
    const tableTex = woodTexture('#b07a4c', '#5a3820', 1, 5);
    tableTex.wrapS = THREE.RepeatWrapping;
    tableTex.repeat.set(2, 1);
    const tableMat = std('#ffffff', { map: tableTex, roughness: 0.55 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.05, 1.3), tableMat);
    top.position.set(0, TABLE_Y - 0.025, -0.05);
    sc.add(top);
    for (const [x, z] of [
      [-1.2, -0.6],
      [1.2, -0.6],
      [-1.2, 0.5],
      [1.2, 0.5],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, TABLE_Y - 0.05, 0.07), tableMat);
      leg.position.set(x, (TABLE_Y - 0.05) / 2, z);
      sc.add(leg);
    }
    shadowed(top);

    // Individual / tapete donde se arma el mate
    const mat = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.006, 0.3),
      std('#254642', { roughness: 0.95 })
    );
    mat.position.set(0, TABLE_Y + 0.003, 0.34);
    mat.receiveShadow = true;
    sc.add(mat);

    // Porta-bombillas
    const zb = this.zoneCenter('bombilla');
    const holder = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.035, 0.06),
      std('#7a4f2c', { roughness: 0.6 })
    );
    holder.position.set(zb.x, TABLE_Y + 0.0175, zb.z);
    holder.rotation.y = ZONES.bombilla.angle;
    sc.add(shadowed(holder));
  }

  private buildDust() {
    const n = 160;
    const pos = new Float32Array(n * 3);
    const r = rng(99);
    for (let i = 0; i < n; i++) {
      pos.set([(r() - 0.5) * 2.6, 0.8 + r() * 1.6, -0.9 + r() * 1.4], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: '#fff6dc',
        size: 0.006,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
  }

  private zoneCenter(cat: Category) {
    const a = ZONES[cat].angle;
    return new THREE.Vector3(
      EYE.x - Math.sin(a) * ZONE_RADIUS,
      TABLE_Y,
      EYE.z - Math.cos(a) * ZONE_RADIUS
    );
  }

  private buildItems() {
    for (const cat of CATEGORY_ORDER) {
      const zone = ZONES[cat];
      const center = this.zoneCenter(cat);
      const right = new THREE.Vector3(Math.cos(zone.angle), 0, -Math.sin(zone.angle));
      const fwd = new THREE.Vector3(-Math.sin(zone.angle), 0, -Math.cos(zone.angle));
      const opts = OPTIONS.filter((o) => o.category === cat);
      opts.forEach((opt, i) => {
        let built: { group: THREE.Group; mouth?: THREE.Vector3; mate?: MateParts };
        const sh = opt.shape;
        if (sh.kind === 'yerba') built = buildYerba(opt, sh);
        else if (sh.kind === 'bombilla') built = buildBombilla(sh);
        else if (sh.kind === 'mate') built = buildMate(sh);
        else built = buildTermo(sh);

        const pos = center
          .clone()
          .addScaledVector(right, (i - 1) * zone.spacing)
          .addScaledVector(fwd, i === 1 ? 0.05 : 0);
        const faceYaw = Math.atan2(EYE.x - pos.x, EYE.z - pos.z);
        let quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, faceYaw, 0));
        if (cat === 'bombilla') {
          pos.y = TABLE_Y + 0.006;
          quat = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(0, faceYaw, (i - 1) * -0.12, 'YXZ')
          );
        }
        const group = shadowed(built.group);
        group.traverse((c) => {
          if ((c as THREE.Mesh).userData?.hitbox) {
            c.castShadow = false;
            c.receiveShadow = false;
          }
        });
        group.position.copy(pos);
        group.quaternion.copy(quat);
        group.userData.optionId = opt.id;
        this.scene.add(group);

        const ringMat = new THREE.MeshBasicMaterial({
          color: '#D4AF37',
          transparent: true,
          opacity: 0,
          depthWrite: false,
        });
        const ringR = cat === 'bombilla' ? 0.035 : cat === 'termo' ? 0.068 : 0.08;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(ringR, ringR + 0.012, 48).rotateX(-Math.PI / 2),
          ringMat
        );
        ring.position.set(pos.x, TABLE_Y + 0.002, pos.z);
        this.scene.add(ring);

        this.items.push({
          opt,
          group,
          homePos: pos.clone(),
          homeQuat: quat.clone(),
          tPos: pos.clone(),
          tQuat: quat.clone(),
          tScale: 1,
          managed: true,
          ring,
          ringMat,
          mate: built.mate,
          mouth: built.mouth,
        });
      });
    }
  }

  // ── API pública (la llama React) ─────────────────────────────────────────

  setHotspot(cat: Category, el: HTMLElement | null) {
    if (el) this.hotspots[cat] = el;
    else delete this.hotspots[cat];
  }

  focus(cat: Category | null) {
    if (this.s.phase !== 'choose') return;
    this.s.focus = cat;
    if (cat) {
      // Apuntar un poco por debajo para que los objetos queden arriba del panel de opciones
      const target = this.zoneCenter(cat).add(
        new THREE.Vector3(0, this.camera.aspect < 1 ? -0.1 : 0, 0)
      );
      const { yaw, pitch } = yawPitchTo(target);
      this.yawT = yaw;
      this.pitchT = pitch;
    } else {
      this.yawT = 0;
      this.pitchT = OVERVIEW_PITCH;
    }
    this.dirty = true;
  }

  select(optionId: string) {
    const item = this.items.find((i) => i.opt.id === optionId);
    if (!item || this.s.phase !== 'choose') return;
    const cat = item.opt.category;
    this.s.selection = { ...this.s.selection, [cat]: optionId };
    this.toast(`Elegiste: ${item.opt.name}`, 'good');
    this.cb.onEvent?.({ name: 'select', category: cat, optionId });
    // Volver a la vista general después de un ratito, o ir a la próxima categoría
    window.setTimeout(() => {
      if (this.disposed || this.s.phase !== 'choose' || this.s.focus !== cat) return;
      const next = CATEGORY_ORDER.find((c) => !this.s.selection[c]);
      this.focus(next ?? null);
    }, 900);
    this.dirty = true;
  }

  get isComplete() {
    return CATEGORY_ORDER.every((c) => this.s.selection[c]);
  }

  startPrepare() {
    if (!this.isComplete) return;
    this.s.phase = 'prepare';
    this.s.focus = null;
    this.resetPrep();
    const sel = this.selected();
    const faceQuat = (p: THREE.Vector3) =>
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - p.x, EYE.z - p.z), 0)
      );
    sel.yerba.tPos.copy(PREP.yerba);
    sel.yerba.tQuat.copy(faceQuat(PREP.yerba));
    sel.termo.tPos.copy(PREP.termo);
    sel.termo.tQuat.copy(faceQuat(PREP.termo));
    sel.bombilla.tPos.copy(PREP.bombilla);
    sel.bombilla.tQuat.copy(quatZ(-Math.PI / 2));
    for (const it of this.items) it.ringMat.opacity = 0;
    // Mirar un poco por debajo del mate para que quede arriba del panel de pasos
    const { yaw, pitch } = yawPitchTo(PREP_LOOK);
    this.yawT = yaw;
    this.pitchT = pitch;
    this.cb.onEvent?.({ name: 'prepare_start' });
    this.setStep('grab');
  }

  /** Acción de "tocar" para los pasos que no son de mantener apretado. */
  action() {
    if (this.s.phase !== 'prepare') return;
    const sel = this.selected();
    if (this.s.step === 'grab') {
      sel.mate.tPos.copy(PREP.mate);
      sel.mate.tQuat.copy(quatZ(0, 0.25));
      this.setStep('yerba');
    } else if (this.s.step === 'bombilla' && this.bombillaAnim === 'none') {
      this.bombillaAnim = 'lift';
      const p = this.holePoint(0.18);
      sel.bombilla.tPos.copy(p);
      sel.bombilla.tQuat.copy(quatZ(-0.18, 0.25));
    } else if (this.s.step === 'drink' && this.drinkT === 0) {
      this.drinkT = 0.0001;
      sel.mate.tPos.set(0.0, 1.12, 0.5);
      sel.mate.tQuat.setFromEuler(new THREE.Euler(0.35, -0.5, 0.1, 'YXZ'));
      const { yaw, pitch } = yawPitchTo(new THREE.Vector3(0, 1.12, 0.5));
      this.yawT = yaw;
      this.pitchT = pitch;
      this.toast('Slurp… ¡hasta el ruidito!', 'good');
    }
  }

  setHolding(on: boolean) {
    if (this.s.holding === on) return;
    if (this.s.phase !== 'prepare') return;
    const st = this.s.step;
    if (on && st === 'wait') {
      this.toast('¡Paciencia! Dejá que la yerba absorba el agua.', 'warn');
      return;
    }
    if (on && !['yerba', 'tilt', 'water1', 'water2', 'cebar'].includes(st)) return;
    this.s.holding = on;
    if (!on) this.release();
    this.dirty = true;
  }

  /** Volver a cebar con el mismo equipo. */
  replay() {
    this.s.phase = 'choose';
    this.s.selection = { ...this.s.selection };
    this.startPrepare();
  }

  /** Volver a elegir todo desde cero. */
  reset() {
    this.resetPrep();
    for (const it of this.items) {
      it.tPos.copy(it.homePos);
      it.tQuat.copy(it.homeQuat);
    }
    this.s.phase = 'choose';
    this.s.selection = {};
    this.s.focus = null;
    this.yawT = 0;
    this.pitchT = OVERVIEW_PITCH;
    this.dirty = true;
  }

  async setGyro(enabled: boolean): Promise<boolean> {
    if (!enabled) {
      window.removeEventListener('deviceorientation', this.onOrientation);
      this.gyro = null;
      this.gyroOffset = { yaw: 0, pitch: 0 };
      return false;
    }
    const DOE = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof DOE?.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return false;
      } catch {
        return false;
      }
    }
    window.addEventListener('deviceorientation', this.onOrientation);
    return true;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObs.disconnect();
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('pointercancel', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('deviceorientation', this.onOrientation);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
    el.remove();
  }

  // ── Lógica de pasos ──────────────────────────────────────────────────────

  private selected() {
    const get = (c: Category) => this.items.find((i) => i.opt.id === this.s.selection[c])!;
    return {
      yerba: get('yerba'),
      bombilla: get('bombilla'),
      mate: get('mate'),
      termo: get('termo'),
    };
  }

  private resetPrep() {
    const sel = this.isComplete ? this.selected() : null;
    if (sel) {
      // Devolver la bombilla a la escena si estaba "adentro" del mate
      if (sel.bombilla.group.parent !== this.scene) this.scene.attach(sel.bombilla.group);
      sel.bombilla.managed = true;
      sel.mate.tPos.copy(sel.mate.homePos);
      sel.mate.tQuat.copy(sel.mate.homeQuat);
    }
    for (const it of this.items) {
      if (it.mate) {
        it.mate.yerbaPivot.visible = false;
        it.mate.water.visible = false;
        it.mate.yerbaMat.color.copy(YERBA_DRY);
      }
    }
    this.yerbaFill = 0;
    this.slope = 0;
    this.wet = 0;
    this.wetT = 0;
    this.waterShown = 0;
    this.bombillaAnim = 'none';
    this.drinkT = 0;
    this.s.scores = {};
    this.s.finalScore = null;
    this.s.meter = 0;
    this.s.tiltDeg = 0;
    this.s.holding = false;
    this.yerbaFx.clear();
    this.dropFx.clear();
    this.stream.visible = false;
  }

  private setStep(step: Step) {
    this.s.step = step;
    this.s.meter = 0;
    this.s.holding = false;
    this.stepTimer = 0;
    if (step === 'wait') this.s.waitLeft = 5;
    if (step === 'tilt') this.s.tiltDeg = 0;
    if (step === 'drink') this.s.meter = 1;
    this.cb.onEvent?.({ name: 'step', step });
    this.dirty = true;
  }

  private advanceSoon(next: Step | 'done', delay = 700) {
    const cur = this.s.step;
    window.setTimeout(() => {
      if (this.disposed || this.s.phase !== 'prepare' || this.s.step !== cur) return;
      if (next === 'done') this.finish();
      else this.setStep(next);
    }, delay);
  }

  private nextOf(step: Step): Step | 'done' {
    const i = STEPS.findIndex((s) => s.id === step);
    return STEPS[i + 1]?.id ?? 'done';
  }

  private bandScore(v: number, [lo, hi]: [number, number]) {
    if (v >= lo && v <= hi) return 100;
    const d = v < lo ? lo - v : v - hi;
    return Math.max(30, Math.round(100 - d * 260));
  }

  private release() {
    const st = this.s.step;
    const m = this.s.meter;
    const target = POUR_TARGET[st];
    if (st === 'tilt') {
      const deg = this.s.tiltDeg;
      if (deg < 18) {
        this.toast('Inclinalo un poco más para formar la montañita.', 'warn');
        this.s.tiltDeg = 0;
        return;
      }
      this.slope = -THREE.MathUtils.degToRad(Math.min(deg, 55)) * 0.45;
      this.s.scores.tilt = this.bandScore(deg / 100, [0.3, 0.5]);
      this.toast(
        deg > 65
          ? '¡Uy, se volcó un poco de yerba! Igual seguimos.'
          : deg >= 30 && deg <= 50
            ? '¡Pendiente perfecta!'
            : 'Bien, quedó la pendiente.',
        deg > 65 ? 'warn' : 'good'
      );
      this.advanceSoon('water1');
      return;
    }
    if (!target) return;
    const [lo, hi] = target;
    const minOk = st === 'cebar' ? 0.6 : lo * 0.8;
    if (m < minOk) {
      this.toast(
        st === 'yerba' ? 'Te falta yerba: llenalo un poco más.' : 'Un poquito más de agua.',
        'info'
      );
      return;
    }
    this.s.scores[st] = this.bandScore(m, target);
    const over = m > hi;
    const msgs: Partial<Record<Step, [string, string]>> = {
      yerba: ['¡Justo! Bien cargado.', 'Medio cargado de más, pero sirve.'],
      water1: ['Bien, la yerba se está humedeciendo.', 'Mucha agua: ojo que se lava.'],
      water2: ['Listo, yerba bien humedecida.', 'Un poco de más, pero vamos.'],
      cebar: ['¡Mate cebado como la gente!', 'Se rebalsó un poco… ¡a secar la mesa!'],
    };
    const [good, bad] = msgs[st]!;
    this.toast(over ? bad : m < lo ? 'Quedó cortito, pero sigamos.' : good, over ? 'warn' : 'good');
    if (st === 'water1') this.wetT = 0.45;
    if (st === 'water2') this.wetT = 0.8;
    this.advanceSoon(this.nextOf(st));
  }

  private finish() {
    const sc = Object.values(this.s.scores);
    const final = sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : 0;
    this.s.finalScore = final;
    this.s.phase = 'done';
    const sel = this.selected();
    sel.mate.tPos.copy(PREP.mate);
    sel.mate.tQuat.copy(quatZ(0, 0.25));
    const { yaw, pitch } = yawPitchTo(PREP_LOOK);
    this.yawT = yaw;
    this.pitchT = pitch;
    this.cb.onEvent?.({ name: 'complete', score: final });
    this.dirty = true;
  }

  /** Punto (mundo) del "hueco" de la yerba, del lado derecho del mate. */
  private holePoint(extraY = 0) {
    const mate = this.selected().mate;
    const mp = mate.mate!;
    const y = this.yerbaY(mp);
    const r = radiusAt(mp.profile, y) * 0.9;
    return mate.group.localToWorld(new THREE.Vector3(r * 0.38, mp.top + extraY, 0));
  }

  private yerbaY(mp: MateParts) {
    return mp.profile[0].y + this.yerbaFill * (mp.top - mp.profile[0].y) * 0.92;
  }

  private toast(text: string, tone: 'info' | 'good' | 'warn' = 'info') {
    this.s.toast = { id: ++this.toastSeq, text, tone };
    this.dirty = true;
  }

  // ── Frame loop ───────────────────────────────────────────────────────────

  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.updateHotspots();
    const now = performance.now();
    if (this.dirty && now - this.lastEmit > 50) this.emit();
  };

  private emit(force = false) {
    if (!force && !this.dirty) return;
    this.dirty = false;
    this.lastEmit = performance.now();
    this.cb.onChange({
      ...this.s,
      selection: { ...this.s.selection },
      scores: { ...this.s.scores },
    });
  }

  private update(dt: number) {
    // Cámara
    const portrait = this.camera.aspect < 1;
    const base = this.s.phase === 'choose' ? (this.s.focus ? 38 : 60) : 58;
    this.fovT = portrait ? base * 1.3 : base;
    this.yaw = damp(this.yaw, this.yawT, 5, dt);
    this.pitch = damp(this.pitch, this.pitchT, 5, dt);
    this.camera.fov = damp(this.camera.fov, this.fovT, 4, dt);
    this.camera.updateProjectionMatrix();
    const yaw = clamp(this.yaw + this.gyroOffset.yaw, -1.4, 1.4);
    const pitch = clamp(this.pitch + this.gyroOffset.pitch, -1.2, 0.5);
    const dir = new THREE.Vector3(
      -Math.sin(yaw) * Math.cos(pitch),
      Math.sin(pitch),
      -Math.cos(yaw) * Math.cos(pitch)
    );
    this.camera.lookAt(EYE.clone().add(dir));

    // Objetos: se acercan suavemente a su posición objetivo
    for (const it of this.items) {
      const hovered = this.s.phase === 'choose' && this.s.hovered === it.opt.id;
      const chosen = this.s.selection[it.opt.category] === it.opt.id;
      it.tScale = hovered ? 1.08 : 1;
      if (it.managed) {
        it.group.position.lerp(it.tPos, 1 - Math.exp(-7 * dt));
        it.group.quaternion.slerp(it.tQuat, 1 - Math.exp(-7 * dt));
      }
      const s = damp(it.group.scale.x, it.tScale, 10, dt);
      it.group.scale.setScalar(s);
      if (this.s.phase === 'choose') {
        const target = chosen ? 0.95 : hovered ? 0.45 : 0;
        it.ringMat.opacity = damp(it.ringMat.opacity, target, 10, dt);
      }
    }

    if (this.s.phase !== 'choose' && this.isComplete) this.updatePrep(dt);

    this.yerbaFx.update(dt);
    this.dropFx.update(dt);

    // Polvito flotando en la luz
    const p = this.dust.geometry.attributes.position as THREE.BufferAttribute;
    const t = this.clock.elapsedTime;
    for (let i = 0; i < p.count; i++) {
      p.setY(i, p.getY(i) + Math.sin(t * 0.3 + i) * 0.00012);
      p.setX(i, p.getX(i) + Math.cos(t * 0.2 + i * 1.3) * 0.0001);
    }
    p.needsUpdate = true;
  }

  private updatePrep(dt: number) {
    const sel = this.selected();
    const mate = sel.mate;
    const mp = mate.mate!;
    const st = this.s.step;
    const holding = this.s.holding && this.s.phase === 'prepare';
    this.stepTimer += dt;

    // ── Yerba
    let emittingYerba = false;
    if (st === 'yerba' && holding) {
      const mouthTarget = mate.group.localToWorld(new THREE.Vector3(0, mp.top + 0.09, 0));
      const q = quatZ(-2.05);
      sel.yerba.tQuat.copy(q);
      sel.yerba.tPos.copy(mouthTarget.clone().sub(sel.yerba.mouth!.clone().applyQuaternion(q)));
      if (sel.yerba.group.position.distanceTo(sel.yerba.tPos) < 0.03) {
        emittingYerba = true;
        if (this.s.meter < 0.92) {
          this.s.meter = Math.min(0.92, this.s.meter + 0.24 * dt);
          this.yerbaFill = this.s.meter;
          this.dirty = true;
        } else if (this.stepTimer > 0.2) {
          this.toast('¡Está lleno! Soltá.', 'warn');
          this.stepTimer = -1.5;
        }
      }
    } else {
      sel.yerba.tPos.copy(PREP.yerba);
      sel.yerba.tQuat.setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - PREP.yerba.x, EYE.z - PREP.yerba.z), 0)
      );
    }
    if (emittingYerba && this.s.meter < 0.92) {
      const mouth = sel.yerba.group.localToWorld(sel.yerba.mouth!.clone());
      const killY = mate.group.localToWorld(new THREE.Vector3(0, this.yerbaY(mp), 0)).y;
      for (let k = 0; k < 6; k++) {
        this.yerbaFx.spawn(
          mouth
            .clone()
            .add(new THREE.Vector3((Math.random() - 0.5) * 0.02, 0, (Math.random() - 0.5) * 0.02)),
          new THREE.Vector3((Math.random() - 0.5) * 0.1, -0.2, (Math.random() - 0.5) * 0.1),
          killY
        );
      }
    }

    // ── Inclinar
    if (st === 'tilt') {
      if (holding) {
        this.s.tiltDeg = Math.min(85, this.s.tiltDeg + 42 * dt);
        this.dirty = true;
        if (this.s.tiltDeg > 65 && Math.random() < 0.5) {
          const lip = mate.group.localToWorld(new THREE.Vector3(-0.04, mp.top, 0));
          this.yerbaFx.spawn(lip, new THREE.Vector3(-0.2, 0, 0), TABLE_Y);
        }
      }
      const tiltRad = THREE.MathUtils.degToRad(holding ? this.s.tiltDeg : 0);
      mate.tQuat.copy(quatZ(tiltRad, 0.25));
      mp.yerbaPivot.rotation.z = -tiltRad * 0.5;
    } else {
      mp.yerbaPivot.rotation.z = damp(mp.yerbaPivot.rotation.z, this.slope, 6, dt);
    }

    // ── Termo (agua)
    const pouring = (st === 'water1' || st === 'water2' || st === 'cebar') && holding;
    let streamOn = false;
    if (pouring) {
      const target = this.holePoint(0.1);
      const q = quatZ(1.85);
      sel.termo.tQuat.copy(q);
      sel.termo.tPos.copy(target.clone().sub(sel.termo.mouth!.clone().applyQuaternion(q)));
      if (sel.termo.group.position.distanceTo(sel.termo.tPos) < 0.03) {
        streamOn = true;
        const rate = st === 'cebar' ? 0.26 : 0.17;
        const cap = st === 'cebar' ? 1.05 : 0.7;
        this.s.meter = Math.min(cap, this.s.meter + rate * dt);
        this.dirty = true;
        if (st !== 'cebar') this.wet = Math.max(this.wet, Math.min(1, this.s.meter * 1.4));
        if (st === 'cebar' && this.s.meter > 1) {
          const lip = mate.group.localToWorld(new THREE.Vector3(0.045, mp.top, 0));
          this.dropFx.spawn(lip, new THREE.Vector3(0.15, 0, (Math.random() - 0.5) * 0.1), TABLE_Y);
          if (this.stepTimer > 0) {
            this.toast('¡Se rebalsa! Soltá.', 'warn');
            this.stepTimer = -1.5;
          }
        }
      }
    } else {
      sel.termo.tPos.copy(PREP.termo);
      sel.termo.tQuat.setFromEuler(
        new THREE.Euler(0, Math.atan2(EYE.x - PREP.termo.x, EYE.z - PREP.termo.z), 0)
      );
    }
    if (streamOn) {
      const spout = sel.termo.group.localToWorld(sel.termo.mouth!.clone());
      const end = this.holePoint(0);
      end.y = mate.group.localToWorld(new THREE.Vector3(0, this.waterY(mp), 0)).y;
      this.stream.position.copy(spout);
      this.stream.scale.y = Math.max(0.01, spout.y - end.y);
      this.stream.quaternion.identity();
      this.stream.visible = true;
    } else {
      this.stream.visible = false;
    }

    // ── Espera de 5 segundos
    if (st === 'wait' && this.s.phase === 'prepare') {
      this.s.waitLeft = Math.max(0, this.s.waitLeft - dt);
      this.wetT = 0.6;
      this.dirty = true;
      if (this.s.waitLeft === 0 && this.stepTimer < 1000) {
        this.stepTimer = 1000;
        this.toast('¡Absorbió! Ahora otro chorrito.', 'good');
        this.setStep('water2');
      }
    }

    // ── Bombilla
    if (st === 'bombilla' && this.bombillaAnim === 'lift') {
      if (sel.bombilla.group.position.distanceTo(sel.bombilla.tPos) < 0.01) {
        this.bombillaAnim = 'insert';
        const p = this.holePoint(0);
        p.y = mate.group.localToWorld(new THREE.Vector3(0, this.yerbaY(mp) - 0.07, 0)).y;
        sel.bombilla.tPos.copy(p);
      }
    } else if (st === 'bombilla' && this.bombillaAnim === 'insert') {
      if (sel.bombilla.group.position.distanceTo(sel.bombilla.tPos) < 0.004) {
        this.bombillaAnim = 'done';
        sel.bombilla.managed = false;
        mate.group.attach(sel.bombilla.group);
        this.toast('Bombilla adentro. ¡No la muevas!', 'good');
        this.advanceSoon('cebar', 500);
      }
    }

    // ── Tomar
    if (st === 'drink' && this.drinkT > 0 && this.s.phase === 'prepare') {
      this.drinkT += dt;
      this.s.meter = Math.max(0, 1 - this.drinkT / 2.6);
      this.dirty = true;
      if (this.drinkT > 3.1) {
        this.drinkT = 0;
        this.finish();
      }
    }

    // ── Visual de yerba y agua dentro del mate
    const yY = this.yerbaY(mp);
    const yR = radiusAt(mp.profile, yY) * 0.9;
    mp.yerbaPivot.visible = this.yerbaFill > 0.02;
    mp.yerbaPivot.position.y = yY;
    mp.yerbaPivot.children[0].scale.setScalar(yR * 0.9);
    this.wet = damp(this.wet, Math.max(this.wet, this.wetT), 1.2, dt);
    mp.yerbaMat.color.copy(YERBA_DRY).lerp(YERBA_WET, this.wet);

    let water = 0;
    if (st === 'water1' || st === 'water2') water = this.s.meter * 0.45;
    else if (st === 'wait') water = (this.s.waitLeft / 5) * 0.12;
    else if (st === 'cebar' || st === 'drink') water = Math.min(this.s.meter, 1);
    if (this.s.phase === 'done') water = 0;
    this.waterShown = damp(this.waterShown, water, 6, dt);
    mp.water.visible = this.waterShown > 0.01;
    if (mp.water.visible) {
      const wy = this.waterY(mp);
      const wr = radiusAt(mp.profile, wy);
      mp.water.position.set(wr * 0.35, wy, 0);
      mp.water.scale.setScalar(wr * 0.55);
    }
  }

  private waterY(mp: MateParts) {
    const yY = this.yerbaY(mp);
    const r = radiusAt(mp.profile, yY) * 0.9;
    const holeY = yY - 0.38 * r * Math.tan(Math.abs(this.slope));
    return holeY + this.waterShown * (mp.top * 0.96 - holeY);
  }

  private updateHotspots() {
    const show = this.s.phase === 'choose' && this.s.focus === null;
    const w = this.host.clientWidth;
    const h = this.host.clientHeight;
    for (const cat of CATEGORY_ORDER) {
      const el = this.hotspots[cat];
      if (!el) continue;
      const p = this.zoneCenter(cat)
        .add(new THREE.Vector3(0, ZONES[cat].anchorH, 0))
        .project(this.camera);
      const visible = show && p.z < 1 && Math.abs(p.x) < 1.1 && Math.abs(p.y) < 1.1;
      el.style.opacity = visible ? '1' : '0';
      el.style.pointerEvents = visible ? 'auto' : 'none';
      el.style.transform = `translate(-50%, -50%) translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
    }
  }

  // ── Input ────────────────────────────────────────────────────────────────

  private pick(clientX: number, clientY: number): Item | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(
      this.items.map((i) => i.group),
      true
    );
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.optionId) o = o.parent;
      if (o) return this.items.find((i) => i.opt.id === o!.userData.optionId) ?? null;
    }
    return null;
  }

  private onPointerDown = (e: PointerEvent) => {
    this.pointer = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      t: performance.now(),
      dragged: false,
    };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };

  private onPointerMove = (e: PointerEvent) => {
    const p = this.pointer;
    if (p && p.id === e.pointerId) {
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      if (!p.dragged && Math.hypot(dx, dy) > 6) p.dragged = true;
      if (p.dragged) {
        const k = 0.0032 * (this.camera.fov / 55);
        this.yawT = clamp(this.yawT + dx * k, -1.35, 1.35);
        this.pitchT = clamp(this.pitchT + dy * k, -1.15, 0.45);
        p.x = e.clientX;
        p.y = e.clientY;
      }
      return;
    }
    if (e.pointerType === 'mouse' && this.s.phase === 'choose') {
      const it = this.pick(e.clientX, e.clientY);
      const id = it?.opt.id ?? null;
      if (id !== this.s.hovered) {
        this.s.hovered = id;
        this.dirty = true;
      }
      this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    const p = this.pointer;
    this.pointer = null;
    if (!p || p.id !== e.pointerId || p.dragged || e.type === 'pointercancel') return;
    const it = this.pick(e.clientX, e.clientY);
    if (this.s.phase === 'choose') {
      if (!it) {
        if (this.s.focus) this.focus(null);
        return;
      }
      if (this.s.focus !== it.opt.category) this.focus(it.opt.category);
      else this.select(it.opt.id);
      return;
    }
    if (this.s.phase === 'prepare' && it) {
      const sel = this.selected();
      if (
        (this.s.step === 'grab' && it === sel.mate) ||
        (this.s.step === 'bombilla' && it === sel.bombilla) ||
        (this.s.step === 'drink' && it === sel.mate)
      ) {
        this.action();
      }
    }
  };

  private onWheel = (e: WheelEvent) => {
    this.pitchT = clamp(this.pitchT - e.deltaY * 0.0008, -1.15, 0.45);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    const tag = e.target instanceof HTMLElement ? e.target.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    // La barra espaciadora sobre un botón la maneja el propio botón
    if (e.code === 'Space' && (tag === 'BUTTON' || tag === 'A')) return;
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      if (['grab', 'bombilla', 'drink'].includes(this.s.step) && this.s.phase === 'prepare')
        this.action();
      else this.setHolding(true);
    } else if (e.code === 'Escape') {
      this.focus(null);
    } else if (e.code === 'ArrowLeft') {
      this.yawT = clamp(this.yawT + 0.15, -1.35, 1.35);
    } else if (e.code === 'ArrowRight') {
      this.yawT = clamp(this.yawT - 0.15, -1.35, 1.35);
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') this.setHolding(false);
  };

  private onOrientation = (e: DeviceOrientationEvent) => {
    if (e.alpha == null || e.beta == null) return;
    if (!this.gyro) {
      this.gyro = { a: e.alpha, b: e.beta, ga: 0, gb: 0 };
      return;
    }
    let da = e.alpha - this.gyro.a;
    if (da > 180) da -= 360;
    if (da < -180) da += 360;
    const db = e.beta - this.gyro.b;
    this.gyroOffset.yaw = THREE.MathUtils.degToRad(da);
    this.gyroOffset.pitch = THREE.MathUtils.degToRad(db) * 0.8;
  };

  private resize() {
    const w = this.host.clientWidth || 1;
    const h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
